# TripFlow Map Feature Research

> Comprehensive analysis of best-in-class map features for trip planning applications

**Research Date**: December 31, 2025
**Status**: Research Complete

---

## Executive Summary

This document outlines the most impactful map features that leading trip planning apps offer, with recommendations for TripFlow's roadmap. The research is based on competitive analysis of Wanderlog, Roadtrippers, Sygic Travel, MapMagic, and others.

### Key Findings

| Category | Current TripFlow | Industry Best Practice | Priority |
|----------|------------------|------------------------|----------|
| **Route Visualization** | None | Polylines between activities | **P1 - Critical** |
| **Route Optimization** | None | TSP algorithm for day planning | **P1 - Critical** |
| **Marker Clustering** | None | Auto-cluster at zoom levels | **P2 - High** |
| **Offline Maps** | Tile caching | Full offline mode | **P2 - High** |
| **Directions API** | None | OSRM/Valhalla integration | **P2 - High** |
| **Collaborative Maps** | None | Real-time sync | **P3 - Medium** |
| **Heatmaps** | None | Activity density visualization | **P4 - Nice-to-have** |

---

## 1. Route Visualization (P1 - Critical)

### What Competitors Do

**Wanderlog**: Shows animated polylines connecting activities in chronological order. Color-coded by day with distance/time annotations.

**Roadtrippers**: Drag-and-drop route editing with up to 150 waypoints. Real-time route recalculation.

**TravelMap**: Import GPS tracks, customize line colors by transport mode (walking, driving, transit).

### Recommended Implementation

```typescript
// Route visualization architecture
interface RouteSegment {
  from: Activity;
  to: Activity;
  mode: 'walking' | 'driving' | 'transit' | 'flight';
  distance: number;    // meters
  duration: number;    // seconds
  geometry: GeoJSON.LineString;
}

// Day routes with colors
const DAY_COLORS = [
  '#3B82F6', // Day 1 - Blue
  '#10B981', // Day 2 - Green
  '#F59E0B', // Day 3 - Amber
  '#EF4444', // Day 4 - Red
  '#8B5CF6', // Day 5 - Purple
];
```

### Key Features to Implement

1. **Polyline Layer**: Draw routes between consecutive activities
2. **Transport Mode Icons**: Show walking/driving/transit icons on segments
3. **Distance/Time Labels**: Display travel time between points
4. **Day Color Coding**: Match route colors to day filter colors
5. **Animated Route**: Optional animation showing travel direction

### Sources
- [TravelMap Route Visualization](https://travelmap.net/itinerary)
- [Wanderlog Features](https://wanderlog.com/)

---

## 2. Route Optimization (P1 - Critical)

### What Competitors Do

**Wanderlog**: One-click "optimize route" reorders activities for minimum travel time within a day.

**MyRouteOnline**: Multi-day optimization that chains days together so Day 2 starts where Day 1 ended.

**RouteXL**: TSP solver that finds fastest route through multiple stops.

### Technical Approaches

| Algorithm | Best For | Complexity | Implementation |
|-----------|----------|------------|----------------|
| **Nearest Neighbor** | Simple, fast | O(n²) | Good starting point |
| **Google OR-Tools** | Production TSP | - | Python backend required |
| **2-opt Improvement** | Local optimization | O(n²) | JavaScript friendly |
| **Genetic Algorithm** | Complex constraints | - | Best for time windows |

### Recommended Implementation

```typescript
// Client-side 2-opt optimization
export function optimizeRoute(activities: Activity[]): Activity[] {
  // Get distance matrix from routing API
  const distances = await getDistanceMatrix(activities);

  // Apply 2-opt improvement
  let route = nearestNeighborTSP(activities, distances);
  route = twoOptImprove(route, distances);

  return route;
}
```

### Features to Implement

1. **"Optimize Day" Button**: Reorder activities within a day
2. **Constraints Support**: Respect opening hours, must-visit times
3. **Preview Mode**: Show before/after comparison
4. **Undo Capability**: Revert to original order

### Sources
- [Building a Personal Travel Route Optimizer](https://medium.com/@van.evanfebrianto/building-a-personal-travel-route-optimizer-a-technical-odyssey-e46b5b49a1fa)
- [MyRouteOnline Multi-Day Planning](https://www.myrouteonline.com/features/multi-day-road-trip)
- [IEEE: Trip Planning with Constraints](https://ieeexplore.ieee.org/document/7581613)

---

## 3. Directions & Routing API (P2 - High)

### Open Source Options

| Engine | Strengths | Best Use Case | API Cost |
|--------|-----------|---------------|----------|
| **OSRM** | Fastest queries, mature | Large-scale routing | Free (self-host) |
| **Valhalla** | Time-aware routing, Tesla's choice | Dynamic costing | Free (self-host) |
| **GraphHopper** | Lightweight, Java-based | SMB applications | Freemium |
| **OpenRouteService** | Full-featured, hosted option | Quick integration | Free tier available |

### Recommended: OpenRouteService

OpenRouteService offers a generous free tier (2000 requests/day) with:
- Walking, cycling, driving directions
- Isochrones (reachability maps)
- Matrix calculations
- Turn-by-turn navigation

```typescript
// OpenRouteService integration example
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

export async function getDirections(
  start: [number, number],
  end: [number, number],
  profile: 'foot-walking' | 'cycling-regular' | 'driving-car'
): Promise<RouteResult> {
  const response = await fetch(
    `https://api.openrouteservice.org/v2/directions/${profile}`,
    {
      method: 'POST',
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coordinates: [start, end],
      }),
    }
  );

  return response.json();
}
```

### Sources
- [OpenStreetMap Routing Wiki](https://wiki.openstreetmap.org/wiki/Routing)
- [Top 10 Open-Source Route Optimization Tools](https://nextbillion.ai/blog/top-open-source-tools-for-route-optimization)
- [OSRM Wikipedia](https://en.wikipedia.org/wiki/Open_Source_Routing_Machine)

---

## 4. Marker Clustering (P2 - High)

### Why It Matters

When users have 20+ activities, markers overlap and become unusable. Clustering groups nearby markers at lower zoom levels.

### MapLibre GL JS Built-in Clustering

```typescript
// GeoJSON source with clustering
map.addSource('activities', {
  type: 'geojson',
  data: activitiesGeoJSON,
  cluster: true,
  clusterMaxZoom: 14,    // Max zoom to cluster points
  clusterRadius: 50,     // Radius in pixels
});

// Cluster circles layer
map.addLayer({
  id: 'clusters',
  type: 'circle',
  source: 'activities',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': [
      'step',
      ['get', 'point_count'],
      '#51bbd6',   // < 10 activities
      10, '#f1f075', // 10-25 activities
      25, '#f28cb1'  // > 25 activities
    ],
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      20, 10, 30, 25, 40
    ]
  }
});

// Cluster count labels
map.addLayer({
  id: 'cluster-count',
  type: 'symbol',
  source: 'activities',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Medium'],
    'text-size': 12
  }
});
```

### Features to Implement

1. **Smart Clustering**: Cluster by day or all activities
2. **Click to Expand**: Zoom to cluster extent on click
3. **Cluster Preview**: Show activity names in cluster tooltip
4. **Custom Cluster Icons**: Day-colored cluster backgrounds

### Sources
- [MapLibre Clustering Tutorial](https://docs.stadiamaps.com/tutorials/clustering-styling-points-with-maplibre/)
- [MapTiler Cluster Examples](https://docs.maptiler.com/sdk-js/examples/cluster/)
- [MapLibre Large Data Optimization](https://maplibre.org/maplibre-gl-js/docs/guides/large-data/)

---

## 5. Offline Maps Enhancement (P2 - High)

### Current TripFlow Implementation

- Service Worker caches map tiles
- IndexedDB for tile storage
- 2000 tile limit, 30-day expiration

### Best Practice Enhancements

**Google Maps Approach**: User selects rectangular area to download, sees storage estimate.

**HERE WeGo Approach**: Download entire countries/regions.

**Wanderlog Approach**: Auto-download tiles around itinerary locations.

### Recommended Improvements

```typescript
// Smart offline area calculation
export function calculateOfflineArea(trip: Trip): BoundingBox {
  // Get all activity coordinates
  const coords = trip.itinerary
    .filter(a => a.lat && a.lng)
    .map(a => [a.lng!, a.lat!]);

  // Add buffer (e.g., 5km around each point)
  const buffered = coords.map(c => ({
    north: c[1] + 0.045, // ~5km
    south: c[1] - 0.045,
    east: c[0] + 0.045,
    west: c[0] - 0.045,
  }));

  // Return merged bounding box
  return mergeBoundingBoxes(buffered);
}

// Pre-download tiles for trip
export async function downloadTripTiles(trip: Trip): Promise<void> {
  const bbox = calculateOfflineArea(trip);
  const tiles = getTilesInBoundingBox(bbox, zoomLevels: [10, 12, 14, 16]);

  // Download with progress
  for (let i = 0; i < tiles.length; i++) {
    await cacheTile(tiles[i]);
    updateProgress(i / tiles.length);
  }
}
```

### Features to Implement

1. **"Download for Offline" Button**: Manual trigger with progress
2. **Storage Estimate**: Show MB required before download
3. **Auto-Suggest**: Prompt download before trip starts
4. **Selective Zoom Levels**: Higher zoom near POIs, lower for overview

### Sources
- [PWA Maps with Service Workers](https://github.com/reyemtm/pwa-maps)
- [HERE WeGo Offline Maps](https://www.makeuseof.com/free-offline-map-app-here-wego-saved-my-road-trip/)

---

## 6. Collaborative Features (P3 - Medium)

### What Competitors Offer

| App | Collaboration Features |
|-----|------------------------|
| **Wanderlog** | Real-time sync, live editing, shared view |
| **ClanPlan** | Location sharing, place alerts, group chat |
| **Mapstr** | Up to 20 collaborators per map |
| **MapMagic** | Live collaboration while route planning |

### Implementation Considerations

**Real-time Sync Options**:
- Supabase Realtime (PostgreSQL with WebSocket)
- Firebase Realtime Database
- Liveblocks (collaborative editing library)
- Yjs (CRDT for conflict resolution)

### Recommended Features

1. **Share Trip Link**: Generate shareable URL
2. **Viewer vs Editor Roles**: Permission levels
3. **Live Cursors**: See where others are looking
4. **Comment on Markers**: Discussion per activity
5. **Live Location Sharing**: Optional during trip

### Sources
- [ClanPlan Group Features](https://clanplan.app/blog/best-group-travel-planner-apps/)
- [Mapstr Collaborative Maps](https://en.mapstr.com/fonctionnalites/faire-une-carte-collaborative)
- [Google Maps Sharing](https://blog.google/products/maps/share-your-trips-and-real-time-location-google-maps/)

---

## 7. Additional Features (P4 - Nice-to-have)

### Heatmaps

Show activity density or time spent in areas:

```typescript
map.addLayer({
  id: 'activity-heatmap',
  type: 'heatmap',
  source: 'activities',
  paint: {
    'heatmap-weight': ['get', 'duration'],
    'heatmap-intensity': 1,
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(33,102,172,0)',
      0.2, 'rgb(103,169,207)',
      0.4, 'rgb(209,229,240)',
      0.6, 'rgb(253,219,199)',
      0.8, 'rgb(239,138,98)',
      1, 'rgb(178,24,43)'
    ],
    'heatmap-radius': 30
  }
});
```

### Isochrones (Reachability Maps)

Show "what's reachable in X minutes" from a location:

```typescript
// OpenRouteService isochrone API
const isochrone = await fetch(
  'https://api.openrouteservice.org/v2/isochrones/foot-walking',
  {
    method: 'POST',
    body: JSON.stringify({
      locations: [[lng, lat]],
      range: [300, 600, 900], // 5, 10, 15 minutes
    }),
  }
);
```

### Mini-Map Overview

Small overview map in corner showing full trip extent.

### Sources
- [MapLibre Heatmap Layer](https://maplibre.org/maplibre-gl-js/docs/examples/)
- [MapLibre Plugins Directory](https://maplibre.org/maplibre-gl-js/docs/plugins/)

---

## 8. Implementation Roadmap

### Phase 1: Route Visualization (2-3 days)
- [ ] Create RouteLayer component
- [ ] Integrate with activity data
- [ ] Add day color coding
- [ ] Display distance/time annotations

### Phase 2: Directions Integration (2-3 days)
- [ ] Set up OpenRouteService account
- [ ] Create DirectionsService
- [ ] Cache route calculations
- [ ] Add transport mode selector

### Phase 3: Route Optimization (3-4 days)
- [ ] Implement 2-opt algorithm
- [ ] Add "Optimize Day" button
- [ ] Handle constraints (opening hours)
- [ ] Add undo functionality

### Phase 4: Marker Clustering (1-2 days)
- [ ] Enable MapLibre clustering
- [ ] Create custom cluster styles
- [ ] Add click-to-expand behavior
- [ ] Day-based cluster colors

### Phase 5: Enhanced Offline (2-3 days)
- [ ] Add download trip tiles button
- [ ] Show storage estimates
- [ ] Implement progress indicator
- [ ] Auto-suggest before trip

---

## 9. Technical Recommendations

### API Selection

| Need | Recommended Solution | Rationale |
|------|---------------------|-----------|
| **Place Search** | Google Places + Nominatim | Best quality with cost fallback |
| **Directions** | OpenRouteService | Free tier, good quality |
| **Geocoding** | Nominatim (current) | Free, sufficient quality |
| **Map Tiles** | Carto/MapTiler (current) | Free, fast, multiple styles |

### Performance Considerations

1. **Batch Geocoding**: Queue requests to avoid rate limits
2. **Cache Directions**: Store route calculations in IndexedDB
3. **Lazy Load Routes**: Only calculate visible day routes
4. **Cluster Early**: Enable clustering by default for 10+ markers

### Cost Estimates (if scaling)

| Service | Free Tier | Cost at 10k MAU |
|---------|-----------|-----------------|
| Google Places | $200/month credit | ~$150/month |
| OpenRouteService | 2000/day | Free |
| Nominatim | Unlimited (self-host) | Free |
| MapTiler | 100k tiles/month | ~$25/month |

---

## 10. Conclusion

TripFlow's map already has excellent foundational features (multi-style, weather radar, 3D buildings, offline caching). The highest-impact additions would be:

1. **Route Visualization**: Connect activities with polylines (industry standard)
2. **Route Optimization**: One-click day optimization (major differentiator)
3. **Directions API**: Show actual travel times between points
4. **Marker Clustering**: Essential for trips with many activities

These features would bring TripFlow to feature parity with Wanderlog and Roadtrippers while maintaining its unique visual design and AI integration.

---

**Sources Summary**:
- [Wanderlog](https://wanderlog.com/)
- [Roadtrippers Magazine](https://roadtrippers.com/magazine/planning-a-multi-state-road-trip-best-apps-and-tools-in-2025/)
- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js/docs/)
- [OpenStreetMap Routing Wiki](https://wiki.openstreetmap.org/wiki/Routing)
- [NextBillion Route Optimization Guide](https://nextbillion.ai/blog/top-open-source-tools-for-route-optimization)
- [Stadia Maps Clustering Tutorial](https://docs.stadiamaps.com/tutorials/clustering-styling-points-with-maplibre/)
- [ClanPlan Group Travel Apps](https://clanplan.app/blog/best-group-travel-planner-apps/)
