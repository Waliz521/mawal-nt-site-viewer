/** Layer type → workflow colour (Google Earth legend). */
export const LAYER_COLORS = {
  fence: '#FF0000',
  existing_solar: '#FFFF00',
  proposed_solar: '#00FF00',
  bess: '#FFA500',
  generators: '#0000FF',
  storage: '#808080',
  tbc: '#CCCCCC',
  purple: '#800080',
  cyan: '#00FFFF',
  other: '#999999',
};

/**
 * Classify a KML placemark name into a layer_type.
 * Name matching is primary; KML gx:CascadingStyle colours vary.
 */
export function classifyLayer(name) {
  const n = normalizeName(name);

  if (
    n.includes('additional solar area required') ||
    n.includes('outside existing fence') ||
    n.includes('outside fence') ||
    n.includes('additional land required')
  ) {
    return 'cyan';
  }

  if (n.includes('practical buildable') || n.includes('practical additional')) {
    return 'purple';
  }

  if (n.includes('solar compound fence') || n.includes('building compound fence')) {
    return 'fence';
  }

  if (n.includes('compound fence') || (n.includes('fence') && n.includes('compound'))) {
    return 'fence';
  }

  if (n.includes('existing solar')) {
    return 'existing_solar';
  }

  if (
    n.includes('proposed additional solar') ||
    n.includes('proposed solar') ||
    n === 'required solar'
  ) {
    return 'proposed_solar';
  }

  if (n.includes('proposed bess') || n.includes('bess')) {
    return 'bess';
  }

  if (n.includes('generator')) {
    return 'generators';
  }

  if (n.startsWith('tbc') || n.includes('tbc ') || n.includes(' — tbc') || n.includes('tbc /')) {
    return 'tbc';
  }

  if (
    n.includes('diesel tank') ||
    n.includes('fuel tank') ||
    n.includes('storage/shed') ||
    n.includes('storage shed') ||
    n.includes('storage')
  ) {
    return 'storage';
  }

  return 'other';
}

export function colorForLayerType(layerType) {
  return LAYER_COLORS[layerType] ?? LAYER_COLORS.other;
}

function normalizeName(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/\u2014/g, '-')
    .replace(/\u2013/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugify(name) {
  return normalizeSiteName(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeSiteName(name) {
  return normalizeName(name)
    .replace(/\.$/, '')
    .replace(/\baptula\b/g, 'apatula');
}

/** Fuzzy match folder/calculator/coords community names. */
export function namesMatch(a, b) {
  const na = normalizeSiteName(a);
  const nb = normalizeSiteName(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;

  const strip = (s) =>
    s
      .replace(/\s*[-–—,\u2013\u2014]\s*/g, ' ')
      .replace(/\./g, '')
      .replace(/\s+/g, ' ')
      .trim();

  return strip(na) === strip(nb);
}

export function isAdditionalKmlFile(fileName) {
  const lower = fileName.toLowerCase();
  return (
    lower.includes('additional') ||
    lower.includes('extra area') ||
    lower.includes('outside')
  );
}
