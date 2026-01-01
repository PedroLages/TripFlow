# Apple Maps Integration Guide

> Step-by-step guide to integrating AppleMapView component into TripFlow's MapTab

## Quick Start

### 1. Set Up Apple Developer Credentials

Follow the complete setup guide: [apple-maps-setup.md](./apple-maps-setup.md)

**Summary**:
1. Create Maps Identifier at [Apple Developer Portal](https://developer.apple.com/account/resources)
2. Create MapKit JS Key and download `.p8` private key file
3. Note your Team ID and Key ID

### 2. Configure Environment Variables

Create or update `.env` file:

```bash
# Apple Maps Configuration
VITE_APPLE_MAPS_TEAM_ID=YOUR_TEAM_ID
VITE_APPLE_MAPS_KEY_ID=YOUR_KEY_ID
VITE_APPLE_MAPS_IDENTIFIER=com.yourcompany.tripflow.web
APPLE_MAPS_PRIVATE_KEY_PATH=/path/to/AuthKey_XXXXXXXXXX.p8
VITE_MAPKIT_TOKEN_API=http://localhost:3002/api/mapkit-token
```

**Security Note**: Never commit the `.p8` private key file to git. Add it to `.gitignore`.

### 3. Start Development Servers

Run both Vite and the token server:

```bash
# Option 1: Run both servers together
npm run dev:full

# Option 2: Run separately (two terminals)
npm run dev        # Terminal 1: Vite dev server (port 3001)
npm run dev:token  # Terminal 2: Token server (port 3002)
```

**Expected Output**:
```
═══════════════════════════════════════════════
  MapKit JS Token Server
═══════════════════════════════════════════════
  Running on: http://localhost:3002
  Token API:  http://localhost:3002/api/mapkit-token
  Health:     http://localhost:3002/health
═══════════════════════════════════════════════

Environment Status:
  Team ID:    ✓ Set
  Key ID:     ✓ Set
  Private Key: ✓ Set
```

### 4. Test Token Generation

```bash
curl http://localhost:3002/api/mapkit-token
```

Should return a JWT token like:
```
eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0QxMjM0RUYifQ...
```

---

## Basic Usage

### Simple Map

```tsx
import AppleMapView from '../components/AppleMapView';

function MyComponent() {
  return (
    <AppleMapView
      center={{ latitude: 37.7749, longitude: -122.4194 }}
      mapType="standard"
      className="w-full h-[600px]"
    />
  );
}
```

### Map with Markers

```tsx
const markers = [
  {
    id: 'marker-1',
    coordinate: { latitude: 37.7749, longitude: -122.4194 },
    title: 'San Francisco',
    subtitle: 'California',
    color: '#FF6B6B',
  },
  {
    id: 'marker-2',
    coordinate: { latitude: 37.8044, longitude: -122.2712 },
    title: 'Oakland',
    subtitle: 'California',
    color: '#4ECDC4',
  },
];

<AppleMapView
  center={{ latitude: 37.7897, longitude: -122.2711 }}
  markers={markers}
  onMarkerClick={(marker) => console.log('Clicked:', marker.title)}
  className="w-full h-[600px]"
/>
```

### Map with Routes

```tsx
const routes = [
  {
    id: 'route-1',
    coordinates: [
      { latitude: 37.7749, longitude: -122.4194 },
      { latitude: 37.7844, longitude: -122.4078 },
      { latitude: 37.8044, longitude: -122.2712 },
    ],
    color: '#6366F1', // Indigo
    distance: 12500, // meters
  },
];

<AppleMapView
  center={{ latitude: 37.7897, longitude: -122.2711 }}
  routes={routes}
  className="w-full h-[600px]"
/>
```

---

## Migrating from MapLibre to MapKit JS

### Step 1: Create Toggle Component

Add a map provider toggle to MapTab:

```tsx
import { useState } from 'react';
import { MapPin } from 'lucide-react';
import AppleMapView from '../AppleMapView';
// ... existing MapLibre imports

const MapTab = ({ trip, updateTrip }) => {
  const [mapProvider, setMapProvider] = useState<'maplibre' | 'apple'>('apple');

  return (
    <div className="...">
      {/* Map Provider Toggle */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setMapProvider('maplibre')}
          className={`px-4 py-2 rounded-xl ${
            mapProvider === 'maplibre'
              ? 'bg-brand-primary text-white'
              : 'bg-slate-100 dark:bg-slate-800'
          }`}
        >
          MapLibre (OSM)
        </button>
        <button
          onClick={() => setMapProvider('apple')}
          className={`px-4 py-2 rounded-xl ${
            mapProvider === 'apple'
              ? 'bg-brand-primary text-white'
              : 'bg-slate-100 dark:bg-slate-800'
          }`}
        >
          Apple Maps
        </button>
      </div>

      {/* Conditional Rendering */}
      {mapProvider === 'apple' ? (
        <AppleMapView
          center={mapCenter}
          markers={activityMarkers}
          routes={routeSegments}
          mapType={mapStyle === 'satellite' ? 'satellite' : 'standard'}
          onMapLoad={(map) => console.log('Apple Map loaded:', map)}
        />
      ) : (
        <Map /* existing MapLibre component */ />
      )}
    </div>
  );
};
```

### Step 2: Convert Data Formats

MapLibre uses GeoJSON, MapKit JS uses Coordinate arrays:

```tsx
// MapLibre Route (GeoJSON)
const maplibreRoute = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [
      [-122.4194, 37.7749],  // [lng, lat]
      [-122.4078, 37.7844],
    ],
  },
};

// MapKit JS Route (Coordinate Array)
const mapkitRoute = {
  id: 'route-1',
  coordinates: [
    { latitude: 37.7749, longitude: -122.4194 },  // {lat, lng}
    { latitude: 37.7844, longitude: -122.4078 },
  ],
  color: '#6366F1',
};

// Conversion Helper
const geoJSONToMapKit = (geoJSON: GeoJSON.LineString): Coordinate[] => {
  return geoJSON.coordinates.map(([lng, lat]) => ({
    latitude: lat,
    longitude: lng,
  }));
};
```

### Step 3: Adapt Route Visualization

```tsx
// Existing MapLibre route segments
const routeSegments: RouteSegment[] = [
  {
    from: activity1,
    to: activity2,
    distance: 1200,
    day: 1,
    geometry: {
      type: 'LineString',
      coordinates: [[lng1, lat1], [lng2, lat2]],
    },
  },
];

// Convert to MapKit format
const mapkitRoutes = routeSegments.map((segment) => ({
  id: `route-${segment.from.id}-${segment.to.id}`,
  coordinates: segment.geometry.coordinates.map(([lng, lat]) => ({
    latitude: lat,
    longitude: lng,
  })),
  color: DAY_COLORS[segment.day - 1] || '#94a3b8',
  distance: segment.distance,
  data: segment, // Store original data for reference
}));

<AppleMapView
  routes={mapkitRoutes}
  // ... other props
/>
```

---

## Component API Reference

### AppleMapViewProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `center` | `Coordinate` | **Required** | Map center coordinates |
| `zoom` | `number` | `13` | Initial zoom level (not directly supported by MapKit, use region instead) |
| `mapType` | `'standard' \| 'mutedStandard' \| 'satellite' \| 'hybrid'` | `'standard'` | Map display type |
| `colorScheme` | `'light' \| 'dark'` | `'light'` | Map color scheme |
| `markers` | `MarkerData[]` | `[]` | Array of map markers |
| `routes` | `RouteSegment[]` | `[]` | Array of route polylines |
| `showsUserLocation` | `boolean` | `false` | Show user's current location |
| `onMapLoad` | `(map: mapkit.Map) => void` | - | Callback when map initializes |
| `onMarkerClick` | `(marker: MarkerData) => void` | - | Callback when marker is clicked |
| `className` | `string` | `''` | Tailwind CSS classes |

### MarkerData

```typescript
interface MarkerData {
  id: string;                // Unique identifier
  coordinate: Coordinate;    // Location
  title: string;            // Primary text
  subtitle?: string;        // Secondary text
  color?: string;           // Hex color (e.g., '#FF6B6B')
  data?: any;               // Custom data payload
}
```

### RouteSegment

```typescript
interface RouteSegment {
  id: string;                // Unique identifier
  coordinates: Coordinate[]; // Array of waypoints
  color: string;            // Line color (hex)
  distance?: number;        // Distance in meters
  data?: any;               // Custom data payload
}
```

### Coordinate

```typescript
interface Coordinate {
  latitude: number;   // -90 to 90
  longitude: number;  // -180 to 180
}
```

---

## Advanced Usage

### Accessing MapKit Instance

```tsx
const MyMapComponent = () => {
  const [map, setMap] = useState<mapkit.Map | null>(null);

  const handleMapLoad = (mapInstance: mapkit.Map) => {
    setMap(mapInstance);

    // Now you can call MapKit methods directly
    mapInstance.setCenterAnimated(
      new window.mapkit.Coordinate(37.7749, -122.4194),
      true
    );
  };

  return <AppleMapView onMapLoad={handleMapLoad} />;
};
```

### Dynamic Map Type Switching

```tsx
const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');

<select onChange={(e) => setMapType(e.target.value as any)} value={mapType}>
  <option value="standard">Standard</option>
  <option value="mutedStandard">Muted</option>
  <option value="satellite">Satellite</option>
  <option value="hybrid">Hybrid</option>
</select>

<AppleMapView mapType={mapType} />
```

### Fitting Bounds to Show All Markers

```tsx
const handleMapLoad = (map: mapkit.Map) => {
  if (markers.length === 0) return;

  // Calculate bounding box
  const lats = markers.map((m) => m.coordinate.latitude);
  const lngs = markers.map((m) => m.coordinate.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const spanLat = (maxLat - minLat) * 1.2; // 20% padding
  const spanLng = (maxLng - minLng) * 1.2;

  const region = new window.mapkit.CoordinateRegion(
    new window.mapkit.Coordinate(centerLat, centerLng),
    new window.mapkit.CoordinateSpan(spanLat, spanLng)
  );

  map.setRegionAnimated(region, true);
};
```

---

## Troubleshooting

### "Map Initialization Failed"

**Symptom**: Red error message with "Failed to fetch MapKit token"

**Solutions**:
1. Ensure token server is running:
   ```bash
   npm run dev:token
   ```

2. Check token server logs for errors:
   ```
   Token generation error: Error: ENOENT: no such file or directory
   ```
   → Fix: Update `APPLE_MAPS_PRIVATE_KEY_PATH` in `.env`

3. Verify environment variables are set:
   ```bash
   node -e "require('dotenv').config(); console.log(process.env.VITE_APPLE_MAPS_TEAM_ID)"
   ```

### Token Expires Too Quickly

**Symptom**: Map loads but stops working after 30 minutes

**Solution**: Implement token refresh mechanism:

```tsx
useEffect(() => {
  const refreshInterval = setInterval(() => {
    console.log('[AppleMapView] Refreshing token...');
    // MapKit JS automatically calls authorizationCallback when token expires
  }, 25 * 60 * 1000); // Refresh every 25 minutes

  return () => clearInterval(refreshInterval);
}, []);
```

### CORS Errors in Production

**Symptom**: Token fetch fails with CORS policy error

**Solution**: Update token server CORS configuration for production domain:

```javascript
// server/mapkit-token.js
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://your-production-domain.com'
    : true,
  credentials: true
}));
```

---

## Production Deployment

### Serverless Token Generation

For production, use serverless functions instead of Express:

**Vercel** (`api/mapkit-token.ts`):
```typescript
import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';

export default async function handler(req: Request) {
  const privateKey = readFileSync(process.env.APPLE_MAPS_PRIVATE_KEY_PATH!, 'utf8');

  const token = jwt.sign(
    { origin: req.headers.get('origin') || '' },
    privateKey,
    {
      algorithm: 'ES256',
      expiresIn: '30m',
      issuer: process.env.VITE_APPLE_MAPS_TEAM_ID!,
      header: {
        kid: process.env.VITE_APPLE_MAPS_KEY_ID!,
        typ: 'JWT',
        alg: 'ES256',
      },
    }
  );

  return new Response(token, {
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
    },
  });
}
```

### Environment Variables in Production

Set these in your deployment platform (Vercel, Netlify, etc.):

```bash
VITE_APPLE_MAPS_TEAM_ID=ABC123DEF4
VITE_APPLE_MAPS_KEY_ID=XXXXXXXXXX
VITE_APPLE_MAPS_IDENTIFIER=com.yourcompany.tripflow.web
APPLE_MAPS_PRIVATE_KEY_PATH=/path/to/key.p8  # Or use env var for key content
VITE_MAPKIT_TOKEN_API=https://yourapp.com/api/mapkit-token
```

---

## Next Steps

1. ✅ Token server running
2. ✅ AppleMapView component created
3. ⏳ Integrate into MapTab with toggle
4. ⏳ Migrate route visualization logic
5. ⏳ Test on mobile devices
6. ⏳ Deploy to production with serverless functions

## Resources

- [MapKit JS Documentation](https://developer.apple.com/documentation/mapkitjs)
- [MapKit JS API Reference](https://developer.apple.com/documentation/mapkitjs/mapkit)
- [Apple Developer Portal](https://developer.apple.com/account/resources)
- [TripFlow Apple Maps Setup Guide](./apple-maps-setup.md)
