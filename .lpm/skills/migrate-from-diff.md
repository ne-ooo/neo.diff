---
name: migrate-from-diff
description: Step-by-step guide for migrating from the npm diff package to neo.diff — function mapping, applyPatch return type change, diffJson smart serialization and key sorting, diffLines line ending normalization, algorithm selection, new features, and missing features
version: "1.0.0"
globs:
  - "**/*.ts"
  - "**/*.js"
---

# Migrate from diff to @lpm.dev/neo.diff

## Quick Comparison

| Aspect | npm diff | neo.diff |
|--------|---------|----------|
| Bundle size | 88 KB | 12 KB (86% smaller) |
| Tree-shakeable | No (all-or-nothing) | Yes (50-200 bytes/function) |
| TypeScript | Community @types/debug | Native, strict mode |
| Algorithms | Single | Myers + Patience (via options) |
| JSON diffing | Plain JSON.stringify | Smart serialization + key sorting |
| Object diffing | Not provided | Microdiff-style (CREATE/REMOVE/CHANGE) |
| Patch result | `string \| false` | `PatchResult` object with diagnostics |
| Fuzz control | Single `fuzzFactor` | Separated `maxOffset` / `maxContextMismatch` |
| Line endings | Raw `\r\n` preserved | Normalized to `\n` by default |
| Dependencies | Zero | Zero |

## Step 1: Replace Imports

```typescript
// Before (npm diff)
import { diffLines, diffWords, diffJson, applyPatch } from 'diff'

// After (neo.diff)
import { diffLines, diffWords, diffJson, applyPatch } from '@lpm.dev/neo.diff'
```

## Step 2: Function Name Mapping

| npm `diff` | neo.diff | Notes |
|-----------|----------|-------|
| `diffChars(old, new)` | `diffChars(old, new)` | 1:1 |
| `diffWords(old, new)` | `diffWords(old, new)` | 1:1 |
| `diffWordsWithSpace(old, new)` | `diffWords(old, new)` | neo.diff always preserves whitespace tokens |
| `diffLines(old, new)` | `diffLines(old, new)` | **Normalizes `\r\n` by default** |
| `diffTrimmedLines(old, new)` | `diffLines(old, new, { ignoreWhitespace: true })` | Via option |
| `diffSentences(old, new)` | `diffSentences(old, new)` | 1:1 |
| `diffJson(old, new)` | `diffJson(old, new)` | **Sorts keys by default**, smart serialization |
| `diffArrays(old, new)` | `diffArrays(old, new)` | 1:1 |
| `createPatch(name, old, new)` | `createTwoFilesPatch(old, new, name, name)` | Different arg order |
| `applyPatch(source, patch)` | `applyPatch(source, patch)` | **Returns `PatchResult` object** |
| `parsePatch(str)` | `parsePatch(str)` | Now supports `{ strict: true }` |

## Step 3: Handle Critical Behavioral Differences

### `applyPatch` return type is completely different

This is the biggest migration change:

```typescript
// npm diff — returns string on success, false on failure
const result = applyPatch(source, patch)
if (result === false) {
  console.log('Patch failed')
} else {
  console.log(result) // patched string
}

// neo.diff — returns PatchResult object always
const result = applyPatch(source, patch)
if (!result.success) {
  console.log('Failed hunks:', result.rejected)
  console.log(`Applied ${result.appliedHunks}/${result.totalHunks}`)
}
console.log(result.content) // patched text (even on partial failure)
```

`PatchResult` provides diagnostics that npm `diff` cannot: which hunks failed, why, and what the partially-patched content looks like.

### `diffJson` sorts keys and handles non-serializable types

```typescript
// npm diff — key order matters, BigInt throws
diffJson({ b: 2, a: 1 }, { a: 1, b: 2 })  // Shows changes (key order different)
diffJson({ n: BigInt(123) }, { n: BigInt(456) })  // Throws TypeError

// neo.diff — keys sorted by default, non-serializable types preserved
diffJson({ b: 2, a: 1 }, { a: 1, b: 2 })  // No changes (keys sorted)
diffJson({ n: BigInt(123) }, { n: BigInt(456) })  // Shows "[BigInt: 123]" → "[BigInt: 456]"

// Smart replacer conversions:
// BigInt(123)       → "[BigInt: 123]"
// function hello()  → "[Function: hello]"
// Symbol('test')    → "[Symbol: test]"
// undefined         → "[undefined]"

// To preserve key order (npm diff behavior):
diffJson(oldObj, newObj, { sortKeys: false })
```

### `diffLines` normalizes line endings by default

```typescript
// npm diff — \r\n and \n are different
diffLines('line\r\n', 'line\n')  // Shows change

// neo.diff — normalized to \n before comparison
diffLines('line\r\n', 'line\n')  // No change

// To detect line ending differences (npm diff behavior):
diffLines(oldText, newText, { normalizeLineEndings: false })
```

### `diffWordsWithSpace` doesn't exist

```typescript
// npm diff — separate functions
diffWords('a b', 'a  b')          // No change (ignores whitespace)
diffWordsWithSpace('a b', 'a  b') // Shows whitespace change

// neo.diff — always preserves whitespace tokens
diffWords('a b', 'a  b')          // Shows whitespace change
diffWords('a b', 'a  b', { ignoreWhitespace: true })  // No change
```

## Step 4: Use New Features (Optional)

### Algorithm selection

```typescript
// Patience algorithm for better code diffs
import { diffLinesPatiently } from '@lpm.dev/neo.diff'
diffLinesPatiently(oldCode, newCode)

// Or via options (works on all text diff functions)
diffLines(old, new, { algorithm: 'patience' })
diffWords(old, new, { algorithm: 'patience' })
```

### Structured object diffing

```typescript
import { diffObjects, applyChanges } from '@lpm.dev/neo.diff'

const changes = diffObjects(oldConfig, newConfig)
// Returns: [{ type: 'CREATE'|'REMOVE'|'CHANGE', path, value, oldValue? }]

// Supports Map, Set, Date, RegExp, circular references
// Apply changes to reconstruct
const updated = applyChanges(original, changes)
```

### Three-level fuzz control for patches

```typescript
// npm diff — single fuzzFactor
applyPatch(source, patch, { fuzzFactor: 2 })

// neo.diff — separated concerns
applyPatch(source, patch, {
  maxOffset: 5,          // Allow position drift
  maxContextMismatch: 0, // But context must match
})
```

### Strict modes

```typescript
// Strict JSON string diffing — throws on invalid JSON
diffJsonString(oldStr, newStr, { strict: true })

// Strict patch parsing — throws on malformed format
parsePatch(patchStr, { strict: true })
```

### Utility functions

```typescript
import { editDistance, similarity, tokenizeLines } from '@lpm.dev/neo.diff'

editDistance('kitten', 'sitting')  // 3
similarity('hello', 'hallo')      // 0.8
tokenizeLines('a\nb')             // ['a\n', 'b']
```

## Step 5: Handle Missing Features

| npm `diff` feature | neo.diff alternative |
|-------------------|----------------------|
| `structuredPatch()` | `createPatch()` returns `ParsedPatch` object |
| `convertChangesToXML()` | Not supported — build from `DiffChange[]` |
| `convertChangesToDMP()` | Not supported |
| Callback-based async API | Not supported — all functions are synchronous |

## Migration Checklist

- [ ] Replace `import { ... } from 'diff'` with `import { ... } from '@lpm.dev/neo.diff'`
- [ ] Update `applyPatch` result handling: check `result.success` instead of `result === false`
- [ ] Audit `diffJson` usage: keys are now sorted by default (add `{ sortKeys: false }` if order matters)
- [ ] Audit `diffJson` with BigInt/functions: these now produce diffs instead of being dropped/throwing
- [ ] Audit `diffLines` with `\r\n` files: line endings normalized by default (add `{ normalizeLineEndings: false }` to detect)
- [ ] Replace `diffWordsWithSpace` with `diffWords` (always preserves whitespace tokens)
- [ ] Replace `diffTrimmedLines` with `diffLines(old, new, { ignoreWhitespace: true })`
- [ ] Update `createPatch` arg order: neo.diff is `createTwoFilesPatch(old, new, name, name)`
- [ ] Remove `@types/diff` from devDependencies (types are built-in)
- [ ] Remove `diff` from dependencies
- [ ] Add `@lpm.dev/neo.diff` to dependencies
