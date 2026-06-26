import path from 'node:path';
import XLSX from 'xlsx';
import { namesMatch, normalizeSiteName, slugify } from './layer-classifier.mjs';

/**
 * Load site metadata from Calculator + GIS coords workbooks.
 * @param {string} projectRoot
 */
export function loadExcelMetadata(projectRoot) {
  const calculatorPath = path.join(projectRoot, 'Site_Profile_Working_Calculator.xlsx');
  const coordsPath = path.join(projectRoot, 'Data', 'GIS_Sites_27_Coordinates.xlsx');

  const calculatorRows = readCalculator(calculatorPath);
  const coordsRows = readCoords(coordsPath);

  return { calculatorRows, coordsRows };
}

function readCalculator(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets['Calculator'];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null });

  return rows
    .filter((r) => r.Site)
    .map((r) => ({
      name: String(r.Site).trim(),
      slug: slugify(r.Site),
      region: r.Region ?? null,
      landCouncil: r['Land council'] ?? null,
      coordinates: r.Coordinates ?? null,
      existingSolarKw: num(r['Existing solar (kW)']),
      existingBessKwh: num(r['Existing BESS (kWh)']),
      targetSolarKwac: num(r['Target total solar (kWac)']),
      targetBessKwh: num(r['Target BESS (kWh)']),
      additionalSolarKwac: num(r['Additional solar required (kWac)']),
      additionalBessKwh: num(r['Additional BESS required (kWh)']),
      trafficLight: normalizeTrafficLight(r['Traffic light rating']),
      notes: r['Comments/assumptions'] ?? null,
    }));
}

function readCoords(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  const headerRow = raw.find((row) => row?.[1] === 'Community Name');
  if (!headerRow) return [];

  const headerIndex = raw.indexOf(headerRow);
  const dataRows = raw.slice(headerIndex + 1);

  return dataRows
    .filter((row) => row?.[1] && row[1] !== 'Community Name')
    .map((row) => {
      const correctLatLong = row[11];
      const parsed = parseLatLng(correctLatLong) ?? {
        lat: num(row[3]),
        lng: num(row[4]),
      };

      return {
        name: String(row[1]).trim(),
        region: row[2] ?? null,
        lat: parsed.lat,
        lng: parsed.lng,
        targetSolarKwac: num(row[5]),
        targetBessKwh: num(row[6]),
        existingSolarKw: num(row[7]),
        existingBessKwh: num(row[8]),
      };
    });
}

function parseLatLng(value) {
  if (!value) return null;
  const s = String(value).trim();
  const match = s.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
  if (!match) return null;
  return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
}

function num(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeTrafficLight(value) {
  if (!value) return null;
  const v = String(value).trim().toUpperCase();
  if (v === 'GREEN' || v === 'AMBER' || v === 'RED') return v;
  return null;
}

export function buildSiteRecord({ folder, calculatorRows, coordsRows }) {
  const communityName = folder.communityName;
  const calc = calculatorRows.find((r) => namesMatch(r.name, communityName));
  const coords = coordsRows.find((r) => namesMatch(r.name, communityName));

  const displayName = coords?.name ?? communityName;
  const slug = slugify(communityName);

  let lat = coords?.lat ?? null;
  let lng = coords?.lng ?? null;

  if ((lat == null || lng == null) && calc?.coordinates) {
    const parsed = parseLatLng(calc.coordinates);
    if (parsed) {
      lat = lat ?? parsed.lat;
      lng = lng ?? parsed.lng;
    }
  }

  return {
    slug,
    name: displayName,
    folderName: folder.folderName,
    siteNumber: folder.siteNumber,
    lat,
    lng,
    region: calc?.region ?? coords?.region ?? null,
    landCouncil: calc?.landCouncil ?? null,
    existingSolarKw: calc?.existingSolarKw ?? coords?.existingSolarKw ?? null,
    targetSolarKwac: calc?.targetSolarKwac ?? coords?.targetSolarKwac ?? null,
    existingBessKwh: calc?.existingBessKwh ?? coords?.existingBessKwh ?? null,
    targetBessKwh: calc?.targetBessKwh ?? coords?.targetBessKwh ?? null,
    additionalSolarKwac: calc?.additionalSolarKwac ?? null,
    additionalBessKwh: calc?.additionalBessKwh ?? null,
    trafficLight: calc?.trafficLight ?? null,
    imageryDate: null,
    notes: calc?.notes ?? null,
    normalizedName: normalizeSiteName(displayName),
  };
}
