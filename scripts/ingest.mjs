import fs from 'node:fs/promises';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  classifyLayer,
  colorForLayerType,
  isAdditionalKmlFile,
} from './lib/layer-classifier.mjs';
import {
  computeCentroidFromLayers,
  discoverSiteFolders,
  parseKmlFile,
  roundArea,
} from './lib/kml-parser.mjs';
import { buildSiteRecord, loadExcelMetadata } from './lib/excel-sync.mjs';

const siteViewerRoot = path.resolve(import.meta.dirname, '..');
const projectRootDefault = path.resolve(siteViewerRoot, '..');

loadEnv({ path: path.join(siteViewerRoot, '.env') });

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const projectRoot = process.env.PROJECT_ROOT
  ? path.resolve(process.env.PROJECT_ROOT)
  : projectRootDefault;

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!dryRun && (!supabaseUrl || !serviceKey)) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example → .env or use --dry-run.',
  );
  process.exit(1);
}

const supabase =
  !dryRun && supabaseUrl && serviceKey
    ? createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

async function main() {
  console.log(`Project root: ${projectRoot}`);
  console.log(dryRun ? 'DRY RUN — no Supabase writes' : 'Live ingest to Supabase');

  const folders = await discoverSiteFolders(projectRoot);
  console.log(`Found ${folders.length} site folders with KML`);

  const { calculatorRows, coordsRows } = loadExcelMetadata(projectRoot);
  console.log(
    `Excel: ${calculatorRows.length} calculator rows, ${coordsRows.length} coord rows`,
  );

  let totalLayers = 0;
  const summary = [];

  for (const folder of folders) {
    const site = buildSiteRecord({ folder, calculatorRows, coordsRows });
    const allLayers = [];

    for (const kmlPath of folder.kmlFiles) {
      const fileName = path.basename(kmlPath);
      const layers = await parseKmlFile(kmlPath);

      for (const layer of layers) {
        let layerName = layer.name;
        if (!layerName || layerName === 'Unnamed') {
          layerName = path.basename(kmlPath, '.kml');
        }
        const layerType = classifyLayer(layerName);
        const { areaM2, areaHa } = roundArea(layer.areaM2);
        allLayers.push({
          fileName,
          kmlPath,
          layerName,
          layerType,
          colorHex: colorForLayerType(layerType),
          areaM2,
          areaHa,
          geojson: layer.geojson,
          styleRaw: layer.styleRaw,
          isAdditionalFile: isAdditionalKmlFile(fileName),
        });
      }
    }

    if (site.lat == null || site.lng == null) {
      const centroid = computeCentroidFromLayers(allLayers);
      if (centroid) {
        site.lat = centroid.lat;
        site.lng = centroid.lng;
      }
    }

    totalLayers += allLayers.length;
    summary.push({
      site: site.name,
      slug: site.slug,
      kmlCount: folder.kmlFiles.length,
      layerCount: allLayers.length,
      trafficLight: site.trafficLight,
    });

    if (dryRun) {
      printSiteSummary(site, allLayers);
      continue;
    }

    await upsertSite(site, folder.kmlFiles, allLayers);
    console.log(`✓ ${site.name} — ${allLayers.length} layers`);
  }

  console.log('\n--- Ingest summary ---');
  console.table(summary);
  console.log(`Total: ${folders.length} sites, ${totalLayers} layers`);
}

function printSiteSummary(site, layers) {
  console.log(`\n[${site.slug}] ${site.name} (${site.trafficLight ?? 'n/a'})`);
  for (const l of layers) {
    console.log(
      `  ${l.layerType.padEnd(16)} ${l.areaM2.toFixed(1).padStart(10)} m²  ${l.layerName}`,
    );
  }
}

async function upsertSite(site, kmlPaths, layers) {
  const { data: existingSite, error: findErr } = await supabase
    .from('sites')
    .select('id')
    .eq('slug', site.slug)
    .maybeSingle();

  if (findErr) throw findErr;

  let siteId = existingSite?.id;

  const sitePayload = {
    slug: site.slug,
    name: site.name,
    folder_name: site.folderName,
    site_number: site.siteNumber,
    lat: site.lat,
    lng: site.lng,
    region: site.region,
    land_council: site.landCouncil,
    existing_solar_kw: site.existingSolarKw,
    target_solar_kwac: site.targetSolarKwac,
    existing_bess_kwh: site.existingBessKwh,
    target_bess_kwh: site.targetBessKwh,
    additional_solar_kwac: site.additionalSolarKwac,
    additional_bess_kwh: site.additionalBessKwh,
    traffic_light: site.trafficLight,
    imagery_date: site.imageryDate,
    notes: site.notes,
  };

  if (siteId) {
    const { error } = await supabase.from('sites').update(sitePayload).eq('id', siteId);
    if (error) throw error;
    await supabase.from('site_layers').delete().eq('site_id', siteId);
    await supabase.from('site_kml_files').delete().eq('site_id', siteId);
  } else {
    const { data, error } = await supabase.from('sites').insert(sitePayload).select('id').single();
    if (error) throw error;
    siteId = data.id;
  }

  const kmlFileIds = new Map();

  for (const kmlPath of kmlPaths) {
    const fileName = path.basename(kmlPath);
    const storagePath = `${site.slug}/${fileName}`;
    const fileBuffer = await fs.readFile(kmlPath);

    const { error: uploadErr } = await supabase.storage
      .from('kml-files')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/vnd.google-earth.kml+xml',
        upsert: true,
      });

    if (uploadErr) throw uploadErr;

    const isAdditional = isAdditionalKmlFile(fileName);
    const isPrimary = !isAdditional;

    const { data: kmlRow, error: kmlErr } = await supabase
      .from('site_kml_files')
      .insert({
        site_id: siteId,
        file_name: fileName,
        storage_path: storagePath,
        is_primary: isPrimary,
        is_additional_area: isAdditional,
      })
      .select('id')
      .single();

    if (kmlErr) throw kmlErr;
    kmlFileIds.set(fileName, kmlRow.id);
  }

  const layerRows = layers.map((l) => ({
    site_id: siteId,
    kml_file_id: kmlFileIds.get(l.fileName),
    layer_name: l.layerName,
    layer_type: l.layerType,
    geometry_geojson: l.geojson,
    area_m2: l.areaM2,
    area_ha: l.areaHa,
    color_hex: l.colorHex,
    kml_style_raw: l.styleRaw,
  }));

  if (layerRows.length > 0) {
    const { error: layerErr } = await supabase.from('site_layers').insert(layerRows);
    if (layerErr) throw layerErr;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
