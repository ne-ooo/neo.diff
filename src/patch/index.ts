/**
 * Patch support exports
 */

export {
  createPatch,
  createTwoFilesPatch,
  formatPatch,
} from './generate.js'

export { applyPatch, applyPatches } from './apply.js'
export type { ApplyPatchOptions } from './apply.js'

export {
  parsePatch,
  parseMultiplePatches,
  validatePatch,
} from './parse.js'
