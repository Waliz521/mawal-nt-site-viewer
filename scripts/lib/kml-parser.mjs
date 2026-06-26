import fs from 'node:fs/promises';
import path from 'node:path';
import { kml } from '@tmcw/togeojson';
import { DOMParser } from '@xmldom/xmldom';
import area from '@turf/area';

/**
 * Discover "Site N - Name" folders and their KML files under projectRoot.
 * @returns {Promise<Array<{ folderName: string, siteNumber: number|null, communityName: string, kmlFiles: string[] }>>}
 */
export async function discoverSiteFolders(projectRoot) {
  const entries = await fs.readdir(projectRoot, { withFileTypes: true });
  const sitePattern = /^Site\s+(\d+)\s+-\s+(.+)$/i;
  const sites = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const match = entry.name.match(sitePattern);
    if (!match) continue;

    const folderPath = path.join(projectRoot, entry.name);
    const files = await fs.readdir(folderPath);
    const kmlFiles = files
      .filter((f) => f.toLowerCase().endsWith('.kml'))
      .map((f) => path.join(folderPath, f))
      .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

    if (kmlFiles.length === 0) continue;

    sites.push({
      folderName: entry.name,
      siteNumber: parseInt(match[1], 10),
      communityName: match[2].trim(),
      kmlFiles,
    });
  }

  return sites.sort((a, b) => (a.siteNumber ?? 999) - (b.siteNumber ?? 999));
}

/**
 * Parse KML file into polygon features with areas.
 * @returns {Promise<Array<{ name: string, geojson: object, areaM2: number, styleRaw: object|null }>>}
 */
export async function parseKmlFile(kmlPath) {
  const xml = await fs.readFile(kmlPath, 'utf8');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const geo = kml(doc);

  const features = [];
  collectFeatures(geo, features);

  return features.map((feature) => {
    const areaM2 = area(feature);
    return {
      name: feature.properties?.name ?? feature.properties?.Name ?? 'Unnamed',
      geojson: feature,
      areaM2,
      styleRaw: feature.properties ?? null,
    };
  });
}

function collectFeatures(geojson, out) {
  if (!geojson) return;

  if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
    for (const f of geojson.features) {
      collectFeatures(f, out);
    }
    return;
  }

  if (geojson.type === 'Feature') {
    if (isPolygonGeometry(geojson.geometry)) {
      out.push(geojson);
    }
    return;
  }

  // Some parsers nest FeatureCollections inside features
  if (geojson.features) {
    collectFeatures({ type: 'FeatureCollection', features: geojson.features }, out);
  }
}

function isPolygonGeometry(geometry) {
  if (!geometry) return false;
  return geometry.type === 'Polygon' || geometry.type === 'MultiPolygon';
}

export function computeCentroidFromLayers(layers) {
  let latSum = 0;
  let lngSum = 0;
  let count = 0;

  for (const layer of layers) {
    const coords = extractFirstCoordinate(layer.geojson?.geometry);
    if (!coords) continue;
    lngSum += coords[0];
    latSum += coords[1];
    count += 1;
  }

  if (count === 0) return null;
  return { lat: latSum / count, lng: lngSum / count };
}

function extractFirstCoordinate(geometry) {
  if (!geometry) return null;
  if (geometry.type === 'Polygon') {
    return geometry.coordinates?.[0]?.[0] ?? null;
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates?.[0]?.[0]?.[0] ?? null;
  }
  return null;
}

export function roundArea(m2) {
  return {
    areaM2: Math.round(m2 * 100) / 100,
    areaHa: Math.round((m2 / 10000) * 10000) / 10000,
  };
}
