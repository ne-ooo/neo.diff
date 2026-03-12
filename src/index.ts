/**
 * @lpm.dev/neo.diff - Modern, tree-shakeable diff library
 *
 * 70% smaller than diff package, multiple algorithms, TypeScript-native
 *
 * @example
 * ```typescript
 * import { diffLines } from '@lpm.dev/neo.diff'
 *
 * const diff = diffLines('old text\nline 2', 'new text\nline 2')
 * // => [
 * //   { value: 'old text\n', removed: true },
 * //   { value: 'new text\n', added: true },
 * //   { value: 'line 2', count: 1 }
 * // ]
 * ```
 */

// Core algorithm exports
export { myersDiff, myersDiffString } from './core/myers.js'
export { patienceDiff, patienceDiffString } from './core/patience.js'

// Text diffing functions
export {
  diffLines,
  diffLinesPatiently,
  diffLinesHistogram,
  diffWords,
  diffChars,
  diffSentences,
} from './text/index.js'

// Common utilities
export {
  computeLCS,
  backtrackLCS,
  buildChangesFromMatches,
  editDistance,
  similarity,
  normalizeText,
  mergeConsecutiveChanges,
} from './core/common.js'

// Structured diffing functions
export {
  diffJson,
  diffJsonString,
  diffArrays,
  diffPrimitiveArrays,
  diffObjects,
  applyChanges,
} from './structured/index.js'

// Patch support
export {
  createPatch,
  createTwoFilesPatch,
  formatPatch,
  applyPatch,
  applyPatches,
  parsePatch,
  parseMultiplePatches,
  validatePatch,
} from './patch/index.js'

// Types
export type {
  DiffChange,
  DiffResult,
  DiffOptions,
  PatchOptions,
  PatchResult,
  ParsedPatch,
  Hunk,
  EqualityFn,
  StructuredDiffChange,
} from './types.js'
