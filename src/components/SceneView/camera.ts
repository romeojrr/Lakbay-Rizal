// SRS v2.3 §3.6: each chapter frames the scene with camera {x, y, zoom} (percent of the scene,
// zoom 1–1.6). The point (x, y) is centred as far as the scene's edges allow.

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface CameraView {
  /** translate(tx%, ty%) scale(zoom), with the transform origin at the top left. */
  tx: number;
  ty: number;
  zoom: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * `focusY` is where the point should land (in % of the frame height): 50 = the middle; less
 * when the text box covers the bottom of the scene, so the point stays in view above it.
 */
export function cameraView(camera: Camera | undefined, focusY = 50): CameraView {
  const zoom = clamp(camera?.zoom ?? 1, 1, 1.6);
  const x = camera?.x ?? 50;
  const y = camera?.y ?? 50;
  // Centre the point, but never show past the scene's edges.
  const tx = clamp(50 - x * zoom, 100 - 100 * zoom, 0);
  const ty = clamp(focusY - y * zoom, 100 - 100 * zoom, 0);
  return { tx, ty, zoom };
}

/** Where a point of the scene (in %) appears on screen once the camera has moved. */
export function onScreen(view: CameraView, point: { x: number; y: number }) {
  return { x: view.tx + point.x * view.zoom, y: view.ty + point.y * view.zoom };
}
