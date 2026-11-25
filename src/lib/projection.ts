// Equirectangular projection inside a region map's bounds (SRS §8.6).
// Same formula the art scripts used to draw the maps, so pins line up with towns.

export interface MapBounds {
  lat0: number; // southern edge
  lat1: number; // northern edge
  lon0: number; // western edge
  lon1: number; // eastern edge
}

export interface MapPoint {
  /** Percent from the left edge of the map image. */
  x: number;
  /** Percent from the top edge of the map image. */
  y: number;
}

export function projectToPercent(lat: number, lon: number, bounds: MapBounds): MapPoint {
  return {
    x: ((lon - bounds.lon0) / (bounds.lon1 - bounds.lon0)) * 100,
    y: ((bounds.lat1 - lat) / (bounds.lat1 - bounds.lat0)) * 100,
  };
}

export function isInsideMap(point: MapPoint): boolean {
  return point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100;
}
