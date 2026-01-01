/**
 * TypeScript declarations for Apple MapKit JS
 * Based on https://developer.apple.com/documentation/mapkitjs
 */

declare namespace mapkit {
  // Core Types
  interface Coordinate {
    latitude: number;
    longitude: number;
  }

  interface CoordinateRegion {
    center: Coordinate;
    span: CoordinateSpan;
  }

  interface CoordinateSpan {
    latitudeDelta: number;
    longitudeDelta: number;
  }

  interface Padding {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }

  // Map Options
  interface MapConstructorOptions {
    center?: Coordinate;
    region?: CoordinateRegion;
    rotation?: number;
    tintColor?: string;
    colorScheme?: 'light' | 'dark';
    mapType?: 'standard' | 'mutedStandard' | 'satellite' | 'hybrid';
    padding?: Padding;
    showsMapTypeControl?: boolean;
    isRotationEnabled?: boolean;
    isZoomEnabled?: boolean;
    isScrollEnabled?: boolean;
    showsCompass?: 'hidden' | 'visible' | 'adaptive';
    showsScale?: 'hidden' | 'visible' | 'adaptive';
    showsUserLocation?: boolean;
    tracksUserLocation?: boolean;
  }

  // Map Class
  class Map {
    constructor(element: HTMLElement | string, options?: MapConstructorOptions);

    // Properties
    element: HTMLElement;
    center: Coordinate;
    region: CoordinateRegion;
    rotation: number;
    tintColor: string;
    colorScheme: 'light' | 'dark';
    mapType: 'standard' | 'mutedStandard' | 'satellite' | 'hybrid';
    padding: Padding;
    isRotationEnabled: boolean;
    isZoomEnabled: boolean;
    isScrollEnabled: boolean;
    showsMapTypeControl: boolean;
    showsCompass: 'hidden' | 'visible' | 'adaptive';
    showsScale: 'hidden' | 'visible' | 'adaptive';
    showsUserLocation: boolean;
    tracksUserLocation: boolean;

    // Methods
    setCenterAnimated(coordinate: Coordinate, animate?: boolean): void;
    setRegionAnimated(region: CoordinateRegion, animate?: boolean): void;
    setRotationAnimated(degrees: number, animate?: boolean): void;
    addAnnotation(annotation: Annotation): void;
    removeAnnotation(annotation: Annotation): void;
    addAnnotations(annotations: Annotation[]): void;
    removeAnnotations(annotations: Annotation[]): void;
    addOverlay(overlay: Overlay): void;
    removeOverlay(overlay: Overlay): void;
    addOverlays(overlays: Overlay[]): void;
    removeOverlays(overlays: Overlay[]): void;
    destroy(): void;

    // Events
    addEventListener(type: string, listener: (event: any) => void): void;
    removeEventListener(type: string, listener: (event: any) => void): void;
  }

  // Annotation Types
  interface AnnotationConstructorOptions {
    data?: any;
    title?: string;
    subtitle?: string;
    accessibilityLabel?: string | null;
    draggable?: boolean;
    enabled?: boolean;
    selected?: boolean;
    animates?: boolean;
    appearanceAnimation?: string;
    displayPriority?: number;
    collisionMode?: string;
    clusteringIdentifier?: string | null;
  }

  class Annotation {
    constructor(coordinate: Coordinate, factory?: (coordinate: Coordinate, options: AnnotationConstructorOptions) => HTMLElement, options?: AnnotationConstructorOptions);

    coordinate: Coordinate;
    data: any;
    title: string;
    subtitle: string;
    selected: boolean;
    enabled: boolean;
    draggable: boolean;
  }

  interface MarkerAnnotationConstructorOptions extends AnnotationConstructorOptions {
    color?: string;
    glyphColor?: string;
    glyphText?: string;
    glyphImage?: any;
    selectedGlyphImage?: any;
    size?: { width: number; height: number };
  }

  class MarkerAnnotation extends Annotation {
    constructor(coordinate: Coordinate, options?: MarkerAnnotationConstructorOptions);

    color: string;
    glyphColor: string;
    glyphText: string;
  }

  // Overlay Types
  class Overlay {
    map: Map | null;
    data: any;
    visible: boolean;
    enabled: boolean;
    selected: boolean;
  }

  interface PolylineOverlayConstructorOptions {
    data?: any;
    visible?: boolean;
    enabled?: boolean;
    selected?: boolean;
    style?: Style;
  }

  class PolylineOverlay extends Overlay {
    constructor(coordinates: Coordinate[], options?: PolylineOverlayConstructorOptions);

    points: Coordinate[];
  }

  interface PolygonOverlayConstructorOptions {
    data?: any;
    visible?: boolean;
    enabled?: boolean;
    selected?: boolean;
    style?: Style;
  }

  class PolygonOverlay extends Overlay {
    constructor(coordinates: Coordinate[], options?: PolygonOverlayConstructorOptions);

    points: Coordinate[];
  }

  // Style
  interface StyleConstructorOptions {
    strokeColor?: string;
    strokeOpacity?: number;
    lineWidth?: number;
    lineDash?: number[];
    lineCap?: string;
    lineJoin?: string;
    fillColor?: string;
    fillOpacity?: number;
    fillRule?: string;
  }

  class Style {
    constructor(options?: StyleConstructorOptions);

    strokeColor: string;
    strokeOpacity: number;
    lineWidth: number;
    lineDash: number[];
    fillColor: string;
    fillOpacity: number;
  }

  // Initialization
  interface InitOptions {
    authorizationCallback: (done: (token: string) => void) => void;
    language?: string;
  }

  function init(options: InitOptions): void;

  // Geocoder
  class Geocoder {
    constructor(options?: { language?: string; getsUserLocation?: boolean });

    lookup(
      place: string,
      callback: (error: Error | null, data: GeocoderResponse) => void,
      options?: { language?: string; limitToCountries?: string; getsUserLocation?: boolean }
    ): number;

    reverseLookup(
      coordinate: Coordinate,
      callback: (error: Error | null, data: GeocoderResponse) => void,
      options?: { language?: string }
    ): number;

    cancel(id: number): void;
  }

  interface GeocoderResponse {
    results: Place[];
  }

  interface Place {
    coordinate: Coordinate;
    formattedAddress: string;
    name: string;
    region: CoordinateRegion;
  }

  // Directions
  class Directions {
    constructor();

    route(request: DirectionsRequest, callback: (error: Error | null, data: DirectionsResponse) => void): number;
    cancel(id: number): void;
  }

  interface DirectionsRequest {
    origin: string | Coordinate | Place;
    destination: string | Coordinate | Place;
    transportType?: 'automobile' | 'walking';
    requestsAlternateRoutes?: boolean;
  }

  interface DirectionsResponse {
    routes: Route[];
  }

  interface Route {
    distance: number;
    expectedTravelTime: number;
    name: string;
    path: Coordinate[];
    polyline: PolylineOverlay;
    steps: RouteStep[];
  }

  interface RouteStep {
    distance: number;
    instructions: string;
    path: Coordinate[];
    transportType: string;
  }

  // Coordinate utilities
  function coordinateForMapPoint(point: { x: number; y: number }): Coordinate;
  function coordinateRegionForMapRect(rect: { origin: { x: number; y: number }; size: { width: number; height: number } }): CoordinateRegion;
}

declare global {
  interface Window {
    mapkit: typeof mapkit;
  }
}

export {};
