// Dapitan builder rules (SRS §3.5). Pure functions over content + progress.
// Materials available = start amounts (builder.json) + materials earned from stops
// − the cost of projects the player has built. Pre-built projects cost nothing.
import { BUILDER_PROJECTS, MATERIALS } from '../../content/constants';
import type { Builder, BuilderProject, Material } from '../../content/schemas';
import type { Progress } from '../../store/progress';

export type Materials = Record<Material, number>;

/** Where each project sits on the 320 × 180 top-down scene, in native pixels. */
export const PLOTS: Record<BuilderProject, { x: number; bottom: number; w: number; h: number }> = {
  school: { x: 14, bottom: 88, w: 60, h: 48 },
  // §3.5: the Casa Redonda is 4 px taller than the old placeholder, so it is anchored by its bottom edge.
  clinic: { x: 172, bottom: 76, w: 60, h: 52 },
  water: { x: 57, bottom: 162, w: 52, h: 48 },
};
export const SCENE = { w: 320, h: 180 };

export function isBuilt(
  project: BuilderProject,
  builder: Builder,
  progress: Pick<Progress, 'builder'>,
) {
  return builder.projects[project].prebuilt || progress.builder[project];
}

export function availableMaterials(
  builder: Builder,
  progress: Pick<Progress, 'builder' | 'materials'>,
): Materials {
  const result = { ...builder.start };
  for (const m of MATERIALS) result[m] += progress.materials[m];
  for (const p of BUILDER_PROJECTS) {
    const project = builder.projects[p];
    if (project.prebuilt || !progress.builder[p]) continue;
    for (const m of MATERIALS) result[m] -= project.cost[m] ?? 0;
  }
  return result;
}

/** How much of each material is still missing for a project (empty when it can be built). */
export function shortfall(project: BuilderProject, builder: Builder, available: Materials) {
  return MATERIALS.flatMap((m) => {
    const missing = (builder.projects[project].cost[m] ?? 0) - available[m];
    return missing > 0 ? [{ material: m, missing }] : [];
  });
}

export function builtCount(builder: Builder, progress: Pick<Progress, 'builder'>): number {
  return BUILDER_PROJECTS.filter((p) => isBuilt(p, builder, progress)).length;
}

export function isTownComplete(builder: Builder, progress: Pick<Progress, 'builder'>): boolean {
  return builtCount(builder, progress) === BUILDER_PROJECTS.length;
}
