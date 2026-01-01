# MapLibre GL JS Layer Options Research for Travel Planning PWA

> Comprehensive research on map layers, tiles, and data sources for TripFlow

## Table of Contents

1. [Satellite Imagery](#1-satellite-imagery)
2. [Terrain/Elevation Layers](#2-terrainelevation-layers)
3. [Traffic Layers](#3-traffic-layers)
4. [Weather Overlays](#4-weather-overlays)
5. [Map Themes/Styles](#5-map-themesstyles)
6. [3D Buildings](#6-3d-buildings)
7. [Transit/Public Transport](#7-transitpublic-transport)
8. [Points of Interest](#8-points-of-interest)
9. [Other Travel-Useful Layers](#9-other-travel-useful-layers)
10. [Quick Reference Table](#10-quick-reference-table)

---

## 1. Satellite Imagery

### FREE Options

#### EOX Sentinel-2 Cloudless (Recommended - No API Key)
- **Provider**: EOX (European Space Agency data)
- **URL**: `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg`
- **Cost**: FREE - No API key required
- **License**: Creative Commons Attribution-NonCommercial-ShareAlike 4.0
- **Resolution**: 10m (good for zoom levels up to ~14)
- **Coverage**: Global

```javascript
const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      satellite: {
        type: 'raster',
        tiles: [
          'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg'
        ],
        tileSize: 256,
        attribution: '&copy; <a href="https://s2maps.eu">Sentinel-2 cloudless</a> by EOX'
      }
    },
    layers: [{
      id: 'satellite',
      type: 'raster',
      source: 'satellite'
    }]
  }
});
```

#### USGS/NASA GIBS (No API Key)
- **Provider**: NASA Global Imagery Browse Services
- **URL**: Various endpoints at `https://gibs.earthdata.nasa.gov/`
- **Cost**: FREE - No API key required
- **Coverage**: Global, various temporal datasets
- **Use Case**: Historical imagery, scientific visualization

### FREEMIUM Options

#### MapTiler Satellite
- **Provider**: MapTiler
- **URL**: `https://api.maptiler.com/tiles/satellite-v2/tiles.json?key={API_KEY}`
- **Cost**: Free tier available (requires API key)
- **Resolution**: High resolution in many areas
- **Integration**:

```javascript
const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      satellite: {
        url: 'https://api.maptiler.com/tiles/satellite-v2/tiles.json?key=YOUR_API_KEY',
        tileSize: 512,
        type: 'raster'
      }
    },
    layers: [{
      id: 'satellite',
      type: 'raster',
      source: 'satellite'
    }]
  }
});
```

#### Esri/ArcGIS Satellite (Hybrid)
- **Provider**: Esri via MapLibre ArcGIS Plugin
- **URL**: Requires ArcGIS Location Platform account
- **Cost**: Free tier with usage limits
- **Plugin**: `@esri/maplibre-arcgis`

```javascript
import { setArcGISIdentity } from '@esri/maplibre-arcgis';

setArcGISIdentity({ accessToken: 'YOUR_ACCESS_TOKEN' });

const map = new maplibregl.Map({
  container: 'map',
  style: 'arcgis://styles/ArcGIS/Imagery'
});
```

#### AWS Location Service
- **Provider**: Amazon Web Services
- **Cost**: Free tier (up to $200 credits for new accounts, 6 months)
- **Features**: Satellite, hybrid, street styles
- **Integration**: Requires AWS SDK setup

---

## 2. Terrain/Elevation Layers

### FREE Options

#### MapLibre Demo Terrain Tiles (No API Key)
- **URL**: `https://demotiles.maplibre.org/terrain-tiles/tiles.json`
- **Cost**: FREE - No API key
- **Use Case**: Demo/development, basic terrain visualization

```javascript
map.on('load', () => {
  map.addSource('terrain', {
    type: 'raster-dem',
    url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
    tileSize: 256
  });

  map.setTerrain({ source: 'terrain', exaggeration: 1.5 });
});
```

### FREEMIUM Options

#### MapTiler Terrain RGB v2
- **Provider**: MapTiler
- **URL**: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key={API_KEY}`
- **Cost**: Free tier with API key
- **Features**: High-quality terrain data, hillshade support

```javascript
map.on('load', () => {
  // Add terrain source
  map.addSource('terrain-source', {
    type: 'raster-dem',
    url: 'https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=YOUR_API_KEY',
    tileSize: 256
  });

  // Enable 3D terrain
  map.setTerrain({ source: 'terrain-source', exaggeration: 1.5 });

  // Add hillshade layer
  map.addLayer({
    id: 'hillshade',
    type: 'hillshade',
    source: 'terrain-source',
    paint: {
      'hillshade-shadow-color': '#473B24',
      'hillshade-illumination-anchor': 'viewport'
    }
  });
});
```

### Hillshade Options

MapLibre GL JS v5.5.0+ supports multiple hillshade rendering methods:
- `standard` - Default method
- `basic` - Simple illumination
- `combined` - Multiple light sources combined
- `igor` - Enhanced detail
- `multidirectional` - Multiple independent light sources

Supported DEM encodings:
- Mapbox Terrain RGB
- Mapzen Terrarium tiles
- Custom encodings

---

## 3. Traffic Layers

### Status: Limited Free Options

Traffic data is typically expensive. Here are the available options:

#### TomTom Traffic API (Freemium - Best Free Option)
- **Provider**: TomTom
- **Free Tier**: 50,000 free tile requests + 2,500 non-tile requests per day
- **Features**: Real-time traffic flow and incidents
- **Integration**: Custom implementation needed

```javascript
// TomTom Traffic Flow Tiles
const TOMTOM_API_KEY = 'YOUR_API_KEY';

map.addSource('traffic', {
  type: 'raster',
  tiles: [
    `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`
  ],
  tileSize: 256
});

map.addLayer({
  id: 'traffic-layer',
  type: 'raster',
  source: 'traffic',
  paint: {
    'raster-opacity': 0.7
  }
});
```

#### HERE Traffic (Freemium)
- **Provider**: HERE Technologies
- **Free Tier**: Limited free plan available
- **Features**: Real-time traffic, incidents, routing

#### Mapbox Traffic Plugin (Reference)
- **Note**: `mapbox-gl-traffic` plugin exists but requires Mapbox account
- **Alternative**: Fork and adapt for MapLibre with other data sources

---

## 4. Weather Overlays

### FREE Options

#### RainViewer API (Recommended - Free for Personal Use)
- **Provider**: RainViewer
- **Cost**: FREE for personal/educational use
- **Limits**: 1000 requests/IP/minute
- **Data**: Weather radar (past and forecast), satellite infrared
- **Update Frequency**: Every 5 minutes

```javascript
// Fetch available radar frames
async function addWeatherRadar(map) {
  const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
  const data = await response.json();

  // Get the most recent radar frame
  const latestFrame = data.radar.past[data.radar.past.length - 1];

  map.addSource('weather-radar', {
    type: 'raster',
    tiles: [
      `https://tilecache.rainviewer.com/v2/radar/${latestFrame.path}/256/{z}/{x}/{y}/2/1_1.png`
    ],
    tileSize: 256
  });

  map.addLayer({
    id: 'weather-radar-layer',
    type: 'raster',
    source: 'weather-radar',
    paint: {
      'raster-opacity': 0.6
    }
  });
}
```

**Important Note (2025)**: Starting January 1, 2026, RainViewer is changing their API. Only past radar data and unprocessed source images will be available for free personal/educational use.

#### OpenWeatherMap (Free Tier)
- **Provider**: OpenWeatherMap
- **Cost**: Free tier (60 calls/minute, requires API key)
- **Layers Available**:
  - `clouds_new` - Cloud coverage
  - `precipitation_new` - Precipitation
  - `pressure_new` - Sea level pressure
  - `wind_new` - Wind speed
  - `temp_new` - Temperature

```javascript
const OWM_API_KEY = 'YOUR_API_KEY';

map.addSource('weather-clouds', {
  type: 'raster',
  tiles: [
    `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`
  ],
  tileSize: 256
});

map.addLayer({
  id: 'clouds-layer',
  type: 'raster',
  source: 'weather-clouds',
  paint: {
    'raster-opacity': 0.5
  }
});
```

### Commercial Options

#### WeatherLayers GL
- **Provider**: WeatherLayers
- **Cost**: Paid service
- **Features**: High-performance weather visualization
- **Data Sources**: NOAA GFS/HRRR, ECMWF IFS/AIFS
- **Compatibility**: MapLibre GL JS 5.0.0+ (Globe projection) or 3.0.0+

#### MapTiler Weather
- **Provider**: MapTiler
- **Cost**: Paid (part of premium plans)
- **Features**: Radar, cloud coverage, temperature, wind

---

## 5. Map Themes/Styles

### FREE - No API Key Required

#### OpenFreeMap (Highly Recommended)
- **Provider**: OpenFreeMap
- **Cost**: FREE - No API key, no rate limits
- **Data Source**: OpenStreetMap
- **Attribution Required**: Yes (automatic with MapLibre)

**Available Styles**:
| Style | URL | Description |
|-------|-----|-------------|
| Liberty | `https://tiles.openfreemap.org/styles/liberty` | Detailed, colorful style |
| Positron | `https://tiles.openfreemap.org/styles/positron` | Light, minimal style |
| Bright | `https://tiles.openfreemap.org/styles/bright` | Bright, clear style |

```javascript
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: [13.388, 52.517],
  zoom: 9.5
});
```

#### CARTO Basemaps (Free - No API Key for Basic Use)
- **Provider**: CARTO
- **Cost**: FREE for basic use
- **Styles**:
  - Positron (light): `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
  - Voyager: `https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json`
  - Dark Matter: `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`

```javascript
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  center: [-100.2, 38.1],
  zoom: 4
});
```

#### MapLibre Demo Tiles (Free - No API Key)
- **Provider**: MapLibre
- **URL**: `https://demotiles.maplibre.org/style.json`
- **Use Case**: Development, demos, CI testing
- **Data**: Lightweight world countries tileset

#### Protomaps (Free - Self-Hosted)
- **Provider**: Protomaps
- **Cost**: FREE (self-host PMTiles files)
- **License**: CC0 (public domain for styles), BSD-3 for code
- **Features**: Single-file tile archives, no server needed

```javascript
import { Protocol } from 'pmtiles';
import layers from 'protomaps-themes-base';

let protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      protomaps: {
        type: 'vector',
        url: 'pmtiles://https://your-bucket.s3.amazonaws.com/your-tiles.pmtiles'
      }
    },
    layers: layers('protomaps', 'light')
  }
});
```

### FREEMIUM Options

#### MapTiler
- **Free Tier**: Available with API key
- **Styles**: Street, Satellite, Outdoor, Topo, and many more
- **Customization**: Full style customization via Maputnik

#### Stadia Maps
- **Free Tier**: Localhost development without API key
- **Styles**: Multiple themes compatible with OpenMapTiles
- **Note**: Founding member of MapLibre project

```javascript
// For localhost development (no API key needed)
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json'
});
```

#### Thunderforest
- **Free Tier**: Hobby Project plan available
- **Specialty Styles**: OpenCycleMap, Transport, Outdoors, Landscape
- **Requires**: API key

---

## 6. 3D Buildings

### Using OpenFreeMap (FREE)
The `building` layer in OpenFreeMap/OpenMapTiles vector tiles contains height data from OpenStreetMap.

```javascript
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/bright',
  center: [-74.0066, 40.7135],
  zoom: 15.5,
  pitch: 45,
  bearing: -17.6,
  canvasContextAttributes: { antialias: true }
});

map.on('load', () => {
  // Find the first symbol layer for proper ordering
  const layers = map.getStyle().layers;
  let labelLayerId;
  for (let i = 0; i < layers.length; i++) {
    if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
      labelLayerId = layers[i].id;
      break;
    }
  }

  // Add vector tile source for buildings
  map.addSource('openfreemap', {
    url: 'https://tiles.openfreemap.org/planet',
    type: 'vector'
  });

  // Add 3D building extrusion layer
  map.addLayer({
    id: '3d-buildings',
    source: 'openfreemap',
    'source-layer': 'building',
    type: 'fill-extrusion',
    minzoom: 15,
    filter: ['!=', ['get', 'hide_3d'], true],
    paint: {
      'fill-extrusion-color': [
        'interpolate', ['linear'],
        ['get', 'render_height'],
        0, 'lightgray',
        200, 'royalblue',
        400, 'lightblue'
      ],
      'fill-extrusion-height': [
        'interpolate', ['linear'], ['zoom'],
        15, 0,
        16, ['get', 'render_height']
      ],
      'fill-extrusion-base': [
        'case',
        ['>=', ['get', 'zoom'], 16],
        ['get', 'render_min_height'],
        0
      ]
    }
  }, labelLayerId);
});
```

### Key Properties for 3D Extrusion
- `fill-extrusion-color`: Building color (can be data-driven)
- `fill-extrusion-height`: Total height from ground
- `fill-extrusion-base`: Base height (for buildings on stilts, etc.)
- `fill-extrusion-opacity`: Transparency

### Data Sources
- OpenStreetMap building data (via OpenMapTiles schema)
- OpenFreeMap (free, no API key)
- MapTiler (freemium)
- Custom GeoJSON with height properties

---

## 7. Transit/Public Transport

### GTFS Data Integration

GTFS (General Transit Feed Specification) is the standard format for public transit data.

#### Data Sources
- **TransitLand**: Global transit data aggregator (transitfeeds.com being deprecated Dec 2025)
- **Mobility Database**: New recommended source for transit data
- **Local Transit Agencies**: Most provide GTFS feeds directly

#### MapLibre + GTFS Example

```javascript
// Fetch and display GTFS stops as GeoJSON
async function loadTransitStops(map, gtfsStopsUrl) {
  const response = await fetch(gtfsStopsUrl);
  const stopsData = await response.json(); // Assuming pre-converted to GeoJSON

  map.addSource('transit-stops', {
    type: 'geojson',
    data: stopsData,
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50
  });

  // Clustered stops
  map.addLayer({
    id: 'transit-clusters',
    type: 'circle',
    source: 'transit-stops',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': '#3b82f6',
      'circle-radius': [
        'step', ['get', 'point_count'],
        15, 10, 20, 50, 25
      ]
    }
  });

  // Individual stops
  map.addLayer({
    id: 'transit-stop-points',
    type: 'circle',
    source: 'transit-stops',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#3b82f6',
      'circle-radius': 6,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  });
}
```

#### Real-Time Transit Examples
- **Sofia Real-Time Transit Map**: Open-source project combining GTFS real-time with MapLibre
- **Catenary Maps**: Global public transport map using MapLibre Native

#### Tools
- **gtfspy-webviz**: Web application for GTFS animation and visualization
- **GTFS-to-GeoJSON**: Convert GTFS to GeoJSON for MapLibre

---

## 8. Points of Interest

### Overpass API (FREE - OpenStreetMap)

Query POIs directly from OpenStreetMap using the Overpass API.

```javascript
// Query restaurants in a bounding box
async function fetchRestaurants(bounds) {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="restaurant"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
      way["amenity"="restaurant"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
    );
    out center;
  `;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query
  });

  const data = await response.json();

  // Convert to GeoJSON
  const geojson = {
    type: 'FeatureCollection',
    features: data.elements.map(el => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [el.lon || el.center?.lon, el.lat || el.center?.lat]
      },
      properties: {
        name: el.tags?.name,
        cuisine: el.tags?.cuisine,
        ...el.tags
      }
    }))
  };

  return geojson;
}

// Add POIs to map
async function addPOILayer(map, category) {
  const bounds = map.getBounds();
  const poiData = await fetchRestaurants({
    south: bounds.getSouth(),
    west: bounds.getWest(),
    north: bounds.getNorth(),
    east: bounds.getEast()
  });

  map.addSource('pois', {
    type: 'geojson',
    data: poiData
  });

  map.addLayer({
    id: 'poi-points',
    type: 'circle',
    source: 'pois',
    paint: {
      'circle-radius': 8,
      'circle-color': '#ef4444',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  });
}
```

### Common OSM Amenity Tags for Travel
| Category | OSM Tag |
|----------|---------|
| Restaurants | `amenity=restaurant` |
| Cafes | `amenity=cafe` |
| Hotels | `tourism=hotel` |
| Hostels | `tourism=hostel` |
| Museums | `tourism=museum` |
| Attractions | `tourism=attraction` |
| Viewpoints | `tourism=viewpoint` |
| ATMs | `amenity=atm` |
| Pharmacies | `amenity=pharmacy` |
| Hospitals | `amenity=hospital` |
| Tourist Info | `tourism=information` |

### Alternative: Vector Tile POI Layers

OpenMapTiles-compatible vector tiles include POI layers that can be styled:

```javascript
// POIs are included in the 'poi' source layer
map.addLayer({
  id: 'poi-labels',
  type: 'symbol',
  source: 'openmaptiles',
  'source-layer': 'poi',
  filter: ['==', ['get', 'class'], 'restaurant'],
  layout: {
    'icon-image': 'restaurant-icon',
    'text-field': ['get', 'name'],
    'text-offset': [0, 1.5],
    'text-size': 12
  }
});
```

---

## 9. Other Travel-Useful Layers

### UNESCO World Heritage Sites

#### Data Sources
- **UNESCO DataHub**: `https://data.unesco.org/explore/dataset/whc001/`
- **UNESCO Sites Navigator**: `https://whc.unesco.org/en/wh-gis/`
- **ArcGIS**: Pre-built layer available

```javascript
// Load UNESCO sites from GeoJSON
async function loadUNESCOSites(map) {
  const response = await fetch('/data/unesco-sites.geojson');
  const sites = await response.json();

  map.addSource('unesco', {
    type: 'geojson',
    data: sites
  });

  map.addLayer({
    id: 'unesco-sites',
    type: 'symbol',
    source: 'unesco',
    layout: {
      'icon-image': 'unesco-icon',
      'icon-size': 0.8,
      'text-field': ['get', 'name'],
      'text-offset': [0, 1.5],
      'text-size': 11
    },
    paint: {
      'text-color': '#1e40af',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1
    }
  });
}
```

### Time Zone Boundaries

#### Data Sources
- **Timezone Boundary Builder**: `https://github.com/evansiroky/timezone-boundary-builder`
  - GeoJSON and Shapefile formats
  - MIT license (code), ODbL license (data)
- **Geocode Earth**: `https://geocode.earth/data/boundary/timezone/`

```javascript
map.addSource('timezones', {
  type: 'geojson',
  data: '/data/timezones.geojson'
});

map.addLayer({
  id: 'timezone-boundaries',
  type: 'line',
  source: 'timezones',
  paint: {
    'line-color': '#6366f1',
    'line-width': 1,
    'line-dasharray': [2, 2]
  }
});

map.addLayer({
  id: 'timezone-labels',
  type: 'symbol',
  source: 'timezones',
  layout: {
    'text-field': ['get', 'tzid'],
    'text-size': 10
  },
  paint: {
    'text-color': '#4338ca'
  }
});
```

### National Parks & Protected Areas

#### Data Sources
- **World Database on Protected Areas (WDPA)**: `https://www.protectedplanet.net/`
  - Most comprehensive global database
  - Updated monthly
- **ProtectedPlanet API**: GeoJSON output available
- **Natural Earth Data**: US National Parks (398 units)
- **Data.gov**: US-specific GeoJSON datasets

### Cycling & Walking Routes

#### CyclOSM (Free - No API Key)
- **URL**: `https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png`
- **Features**: Cycle paths, surface types, elevation
- **Fair Use Policy**: Yes

```javascript
map.addSource('cyclosm', {
  type: 'raster',
  tiles: [
    'https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    'https://b.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    'https://c.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png'
  ],
  tileSize: 256,
  attribution: '&copy; CyclOSM contributors'
});
```

#### Thunderforest (Freemium)
- **Styles**: OpenCycleMap, Outdoors
- **Features**: Cycle routes, contours, trails
- **Requires**: API key (free Hobby tier available)

### Adding Custom GeoJSON Overlays

Generic pattern for adding any GeoJSON data:

```javascript
// Generic GeoJSON layer function
function addGeoJSONLayer(map, id, url, layerConfig) {
  map.addSource(id, {
    type: 'geojson',
    data: url
  });

  map.addLayer({
    id: `${id}-layer`,
    source: id,
    ...layerConfig
  });
}

// Usage examples
addGeoJSONLayer(map, 'currency-zones', '/data/currency-zones.geojson', {
  type: 'fill',
  paint: {
    'fill-color': ['get', 'color'],
    'fill-opacity': 0.3
  }
});

addGeoJSONLayer(map, 'airports', '/data/airports.geojson', {
  type: 'symbol',
  layout: {
    'icon-image': 'airport-icon',
    'icon-size': 1
  }
});
```

---

## 10. Quick Reference Table

| Layer Type | Best Free Option | API Key? | URL/Provider |
|------------|-----------------|----------|--------------|
| **Base Map (Vector)** | OpenFreeMap | No | `tiles.openfreemap.org/styles/*` |
| **Base Map (Alternative)** | CARTO | No | `basemaps.cartocdn.com/gl/*` |
| **Satellite** | EOX Sentinel-2 | No | `tiles.maps.eox.at/wmts/...` |
| **Terrain/Hillshade** | MapLibre Demo | No | `demotiles.maplibre.org/terrain-tiles/` |
| **Weather Radar** | RainViewer | No | `api.rainviewer.com` |
| **Weather Tiles** | OpenWeatherMap | Yes | `tile.openweathermap.org` |
| **Traffic** | TomTom | Yes | 50K free/day |
| **3D Buildings** | OpenFreeMap | No | Included in vector tiles |
| **POIs** | Overpass API | No | `overpass-api.de` |
| **Cycling** | CyclOSM | No | `tile-cyclosm.openstreetmap.fr` |
| **Transit** | GTFS + Custom | No | Various transit agencies |
| **Time Zones** | TZ Boundary Builder | No | GitHub releases |
| **UNESCO Sites** | UNESCO DataHub | No | `data.unesco.org` |
| **Parks** | Protected Planet | No | `protectedplanet.net` |
| **Self-Hosted** | Protomaps/PMTiles | No | Self-host PMTiles |

---

## Implementation Recommendations for TripFlow

### Recommended Stack (All Free/Freemium)

1. **Base Map**: OpenFreeMap (Liberty or Bright style)
2. **Satellite**: EOX Sentinel-2 Cloudless
3. **Terrain**: MapTiler free tier (with API key)
4. **Weather**: RainViewer + OpenWeatherMap free tier
5. **POIs**: Overpass API queries
6. **3D Buildings**: OpenFreeMap vector tiles
7. **Transit**: GTFS data from local agencies

### Layer Toggle Implementation

```typescript
// Layer configuration for TripFlow
interface MapLayerConfig {
  id: string;
  name: string;
  type: 'base' | 'overlay';
  source: object;
  layers: object[];
  visible: boolean;
}

const TRIPFLOW_LAYERS: MapLayerConfig[] = [
  {
    id: 'satellite',
    name: 'Satellite View',
    type: 'base',
    source: {
      type: 'raster',
      tiles: ['https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg'],
      tileSize: 256
    },
    layers: [{ id: 'satellite-layer', type: 'raster', source: 'satellite' }],
    visible: false
  },
  {
    id: 'weather',
    name: 'Weather Radar',
    type: 'overlay',
    source: { /* RainViewer config */ },
    layers: [{ /* layer config */ }],
    visible: false
  }
  // ... more layers
];
```

---

## Sources

### Official Documentation
- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js/docs/)
- [MapLibre Examples](https://maplibre.org/maplibre-gl-js/docs/examples/)
- [OpenFreeMap Quick Start](https://openfreemap.org/quick_start/)
- [MapTiler SDK Documentation](https://docs.maptiler.com/sdk-js/)

### Free Tile Providers
- [OpenFreeMap](https://openfreemap.org/)
- [CARTO Basemaps](https://carto.com/basemaps)
- [Protomaps](https://protomaps.com/)
- [Stadia Maps](https://stadiamaps.com/)

### Weather
- [RainViewer API](https://www.rainviewer.com/api.html)
- [OpenWeatherMap Weather Maps](https://openweathermap.org/api/weathermaps)

### Data Sources
- [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [UNESCO DataHub](https://data.unesco.org/)
- [Protected Planet](https://www.protectedplanet.net/)
- [Timezone Boundary Builder](https://github.com/evansiroky/timezone-boundary-builder)
- [TransitLand](https://www.transit.land/)

### Plugins
- [Esri MapLibre ArcGIS Plugin](https://developers.arcgis.com/maplibre-gl-js/)
- [PMTiles for MapLibre](https://docs.protomaps.com/pmtiles/maplibre)

---

*Last Updated: December 31, 2025*
*Research conducted for TripFlow travel planning PWA*
