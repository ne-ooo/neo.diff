# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [1.0.0] - 2026-03-09

### Added

- **Myers algorithm** — `myersDiff()`, `myersDiffString()` — O(ND) optimal diff algorithm
- **Patience algorithm** — `patienceDiff()`, `patienceDiffString()` — produces more readable diffs for code with moved blocks
- **Text diffing** — `diffLines()`, `diffWords()`, `diffChars()`, `diffSentences()`, `diffLinesPatiently()`, `diffLinesHistogram()`
- **Structured diffing** — `diffJson()`, `diffJsonString()`, `diffArrays()`, `diffPrimitiveArrays()`, `diffObjects()`, `applyChanges()`
- **Patch support** — `createPatch()`, `createTwoFilesPatch()`, `formatPatch()`, `applyPatch()`, `applyPatches()`, `parsePatch()`, `parseMultiplePatches()`, `validatePatch()`
- **Core utilities** — `computeLCS()`, `backtrackLCS()`, `buildChangesFromMatches()`, `editDistance()`, `similarity()`, `normalizeText()`, `mergeConsecutiveChanges()`
- Full TypeScript types: `DiffChange`, `DiffResult`, `DiffOptions`, `PatchOptions`, `PatchResult`, `ParsedPatch`, `Hunk`, `EqualityFn`, `StructuredDiffChange`
- Multiple sub-path exports for tree-shaking: `@lpm.dev/neo.diff/myers`, `/patience`, `/text`, `/structured`, `/patch`
- Zero runtime dependencies — 86% smaller than the `diff` package (12KB minified vs 86KB)
- 176 tests across Myers, Patience, patch, structured, text, and common utilities
- ESM + CJS dual output with full TypeScript declaration files
