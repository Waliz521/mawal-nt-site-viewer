import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const geojsonDir = path.join(root, 'data/boundaries/geojson');
const publicDir = path.join(root, 'web/public/boundaries');

const inputs = [
  {
    src: 'nt-states-territories.geojson',
    dest: 'nt-boundary.geojson',
  },
  {
    src: 'nt-indigenous-locations.geojson',
    dest: 'nt-indigenous-locations.geojson',
  },
];

function isNtFeature(feature) {
  const props = feature.properties ?? {};
  const code = String(props.STE_CODE21 ?? props.STE_CODE_2021 ?? '');
  const name = String(props.STE_NAME21 ?? props.STE_NAME_2021 ?? '');
  return code === '7' || /Northern Territory/i.test(name);
}

function filterCollection(data) {
  const features = (data.features ?? []).filter(isNtFeature);
  return {
    type: 'FeatureCollection',
    features,
  };
}

function mb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

await fs.mkdir(publicDir, { recursive: true });

for (const { src, dest } of inputs) {
  const srcPath = path.join(geojsonDir, src);
  const raw = await fs.readFile(srcPath, 'utf8');
  const data = JSON.parse(raw);
  const filtered = filterCollection(data);
  const out = `${JSON.stringify(filtered)}\n`;

  const publicPath = path.join(publicDir, dest);
  await fs.writeFile(publicPath, out);

  console.log(`${src} → ${dest}`);
  console.log(`  features: ${data.features?.length ?? 0} → ${filtered.features.length}`);
  console.log(`  size: ${mb(raw.length)} → ${mb(out.length)}`);
}
