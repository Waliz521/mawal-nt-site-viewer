# Mawal NT Site KML Viewer

Internal web app for **Mawal Energy** to browse ~25+ NT community power-station sites, view Google Earth KML polygons on a **free satellite basemap** (Leaflet + Esri), and inspect per-layer areas (m² / ha).

## Project layout

```
site-viewer/
├── README.md
├── package.json              # npm workspaces root
├── .env.example
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── scripts/
│   ├── ingest.mjs            # KML discovery + parse + Supabase upsert
│   └── lib/
│       ├── kml-parser.mjs
│       ├── layer-classifier.mjs
│       └── excel-sync.mjs
└── web/                      # React + Vite frontend (Phase 2)
    └── package.json
```

GIS source data stays in the parent project folder (`Site */`, Excel workbooks). The ingest script reads from there by default.

---

## Prerequisites

- **Node.js 18+**
- **Supabase** free-tier project ([supabase.com](https://supabase.com))
- **No map API key required** — uses Leaflet with free Esri satellite + OpenStreetMap tiles

---

## 1. Supabase setup

1. Create a new Supabase project (free tier is sufficient for ~27 sites).
2. Open **SQL Editor** and run:

   `supabase/migrations/001_initial_schema.sql`

3. Create a Storage bucket named `kml-files` if the migration insert did not succeed (Dashboard → Storage → New bucket, **private**).
4. Copy project URL and keys from **Settings → API**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` (frontend)
   - `SUPABASE_SERVICE_ROLE_KEY` (ingest script only — never expose in browser)

5. Optional auth: enable Email provider under **Authentication** for client login.

### Free tier limits (approx.)

| Resource | Free limit | This project |
|----------|------------|--------------|
| Database | 500 MB | ~27 sites, small JSON geometries — well under limit |
| Storage | 1 GB | 26 KML files (~few MB total) |
| Auth MAU | 50,000 | Internal client only |
| Egress | 5 GB/mo | Low traffic internal viewer |

---

## 2. Map basemap (no billing required)

The web app uses **Leaflet** with:

| Layer | Source |
|-------|--------|
| **Satellite + labels** (default) | Esri World Imagery + place labels — free, no API key |
| **Street map** | OpenStreetMap — toggle in map layer control (top-right) |

**Disclaimer:** Imagery date and alignment may differ from Google Earth Pro used for KML digitising. Fences should be roughly correct but not pixel-perfect.

---

## 3. Environment

```powershell
cd site-viewer
copy .env.example .env
# Edit .env with your keys
```

| Variable | Used by |
|----------|---------|
| `VITE_SUPABASE_URL` | Web app |
| `VITE_SUPABASE_ANON_KEY` | Web app |
| `SUPABASE_URL` | Ingest script |
| `SUPABASE_SERVICE_ROLE_KEY` | Ingest script only |
| `PROJECT_ROOT` | Optional override for GIS project root (defaults to parent folder) |

---

## 4. Install & ingest KMLs

```powershell
cd site-viewer
npm install

# Preview without Supabase writes
npm run ingest:dry

# Full ingest (requires .env + migration applied)
npm run ingest
```

### What ingest does

1. Scans `Site */` folders for `*.kml` (26 files across 25 folders today).
2. Matches folder names to `Site_Profile_Working_Calculator.xlsx` and `Data/GIS_Sites_27_Coordinates.xlsx`.
3. Parses polygons with `@tmcw/togeojson`, computes geodesic area with `@turf/area`.
4. Classifies layers by placemark **name** (fence, existing solar, proposed solar, BESS, etc.).
5. Upserts `sites`, `site_kml_files`, `site_layers`; uploads KML to Storage.

### Adding a new site

1. Create `Site N - Community Name/` in the GIS project root.
2. Drop KML file(s) exported from Google Earth Pro.
3. Update Calculator / coords Excel if applicable.
4. Re-run `npm run ingest`.

---

## 5. Run the web app

```powershell
cd site-viewer
npm run dev
```

Open **http://localhost:5173**

### Pages

| Route | Description |
|-------|-------------|
| `/` | Site grid with search + GREEN/AMBER/RED filter |
| `/sites/:slug` | Satellite map, layer toggles, area table, metadata |

### Required: anon read policies

If the site list shows a permission error, run this in Supabase SQL Editor:

`supabase/migrations/002_anon_read_policies.sql`

Use the layer control (top-right on map) to switch **Satellite + labels** ↔ **Street map**.

### Production build

```powershell
npm run build
npm run preview --workspace=web
```

### Deploy to Vercel

Push the **`site-viewer/`** folder as the repo root (not the parent GIS project with `Site */` folders).

**Recommended:** set Vercel **Root Directory** to `web` (Project Settings → General). The repo includes `web/vercel.json` for that layout.

| Setting | Root Directory = `web` | Root Directory = empty |
|---------|------------------------|-------------------------|
| Root Directory | `web` | *(leave blank)* |
| Output Directory | *(leave blank — uses `dist`)* | *(leave blank — uses `dist`)* |
| Framework Preset | Other | Other |

3. Add **Environment Variables** (Production + Preview):

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
   | `VITE_MAPBOX_ACCESS_TOKEN` | Mapbox token (overview map) |

4. Deploy. Site data comes from Supabase (run `npm run ingest` locally when KML/Excel changes).

---

## Layer colours (workflow legend)

| Type | Colour |
|------|--------|
| fence | Red `#FF0000` |
| existing_solar | Yellow `#FFFF00` |
| proposed_solar | Green `#00FF00` |
| bess | Orange `#FFA500` |
| generators | Blue `#0000FF` |
| storage / tanks | Grey `#808080` |
| tbc | Light grey `#CCCCCC` |
| purple (practical max) | Purple `#800080` |
| cyan (outside fence) | Cyan `#00FFFF` |

Classification uses placemark names first; Google Earth `gx:CascadingStyle` colours are stored but not relied on.

---

## Key formulas (metadata reference)

```
Additional solar area (m²) = Additional kWac × 7
BESS footprint (m²)        = (Additional kWh / 1000) × 150
Traffic light                = GREEN / AMBER / RED (from Calculator col AJ)
```

Source of truth: `WORKFLOW_Site_Profile_First_Report.md` in the parent project.
