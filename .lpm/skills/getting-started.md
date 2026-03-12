---
name: getting-started
description: How to import and use neo.diff — text diffing (lines, words, chars, sentences), algorithm selection (Myers vs Patience), structured diffing (JSON with smart serialization, arrays, objects with Map/Set/circular ref support), patch operations (create, apply with PatchResult, parse with strict mode), utilities, and TypeScript types
version: "1.0.0"
globs:
  - "**/*.ts"
  - "**/*.js"
  - "**/*.tsx"
  - "**/*.jsx"
---

# Getting Started with @lpm.dev/neo.diff

## Overview

neo.diff is a zero-dependency, tree-shakeable diff library. 86% smaller than npm `diff` (12KB vs 88KB). Provides text diffing, structured diffing (JSON/arrays/objects), and full patch support with multiple algorithms.

## Text Diffing

### Line-by-line (most common)

```typescript
import { diffLines } from '@lpm.dev/neo.diff'

const result = diffLines(oldText, newText)

for (const change of result) {
  if (change.added) console.log(`+ ${change.value}`)
  else if (change.removed) console.log(`- ${change.value}`)
  else console.log(`  ${change.value}`)
}
```

Line endings (`\r\n`, `\r`) are normalized to `\n` by default. Disable with `{ normalizeLineEndings: false }`.

### Word, character, and sentence diffing

```typescript
import { diffWords, diffChars, diffSentences } from '@lpm.dev/neo.diff'

diffWords('Hello world', 'Hello there')
// Changes: 'world' removed, 'there' added

diffChars('abc', 'adc')
// Changes: 'b' removed, 'd' added

diffSentences('First. Second.', 'First. Third.')
// Changes: 'Second.' removed, 'Third.' added
```

### DiffOptions

```typescript
diffLines(oldText, newText, {
  ignoreWhitespace: true,       // Normalize whitespace before comparing
  ignoreCase: true,             // Case-insensitive comparison
  algorithm: 'patience',        // 'myers' (default) or 'patience'
  normalizeLineEndings: true,   // Normalize \r\n to \n (default: true)
  context: 3,                   // Context lines for patch output
  timeout: 5000,                // Timeout in ms (default: 5000)
})
```

## Algorithm Selection

### Myers (default) — fast, general-purpose

```typescript
diffLines(oldText, newText)
// or explicitly:
diffLines(oldText, newText, { algorithm: 'myers' })
```

Best for sequential edits (typo fixes, line additions/removals). O((N+M)D) — fast when changes are small. 23x faster than Patience for large sequential changes.

### Patience — better for code refactoring

```typescript
import { diffLinesPatiently } from '@lpm.dev/neo.diff'

diffLinesPatiently(oldCode, newCode)
// or:
diffLines(oldCode, newCode, { algorithm: 'patience' })
```

Finds unique lines first as anchors, then applies Myers between anchors. Produces more readable diffs when functions are reordered or code blocks are moved.

### Histogram — not implemented

`{ algorithm: 'histogram' }` and `diffLinesHistogram()` both throw an error. Use `'myers'` or `'patience'` instead.

### Algorithm selection applies to all text functions

```typescript
diffWords('hello world', 'hello there', { algorithm: 'patience' })
diffChars('abc', 'adc', { algorithm: 'patience' })
```

## Structured Diffing

### JSON diffing — smart serialization

```typescript
import { diffJson } from '@lpm.dev/neo.diff'

const result = diffJson(oldConfig, newConfig)
```

Key features:
- **Sorts keys by default** — `{ b: 2, a: 1 }` and `{ a: 1, b: 2 }` produce NO diff
- **Handles non-serializable types** via smart replacer:

| Type | Output |
|------|--------|
| `BigInt(123)` | `"[BigInt: 123]"` |
| `function hello() {}` | `"[Function: hello]"` |
| `Symbol('test')` | `"[Symbol: test]"` |
| `undefined` | `"[undefined]"` |

```typescript
// Disable key sorting to detect order changes
diffJson(oldObj, newObj, { sortKeys: false })
```

### JSON string diffing

```typescript
import { diffJsonString } from '@lpm.dev/neo.diff'

// Default: falls back to line diff on invalid JSON
diffJsonString(oldJsonStr, newJsonStr)

// Strict: throws on invalid JSON
diffJsonString(oldJsonStr, newJsonStr, { strict: true })
```

### Array diffing

```typescript
import { diffArrays, diffPrimitiveArrays } from '@lpm.dev/neo.diff'

diffArrays([1, 2, 3], [1, 3, 4])
// Uses Myers algorithm

// Custom equality for complex elements
diffArrays(oldUsers, newUsers, (a, b) => a.id === b.id)
```

### Object diffing (microdiff-style)

Returns `CREATE`, `REMOVE`, `CHANGE` operations with full paths:

```typescript
import { diffObjects, applyChanges } from '@lpm.dev/neo.diff'

const changes = diffObjects(
  { user: { name: 'John', age: 30 } },
  { user: { name: 'Jane', age: 30, role: 'admin' } }
)
// [
//   { type: 'CHANGE', path: ['user', 'name'], oldValue: 'John', value: 'Jane' },
//   { type: 'CREATE', path: ['user', 'role'], value: 'admin' }
// ]

// Apply changes to reconstruct
const updated = applyChanges(original, changes)
```

**Special type handling:**
- **Map**: Recursively diffed by key-value entries
- **Set**: Compared atomically (entire Set is "changed" if not equal)
- **Date**: Compared by `getTime()`
- **RegExp**: Compared by `toString()`
- **Circular references**: Safe — tracked via internal `Set<unknown>`, no stack overflow

**Primitive vs object arrays in `diffObjects`:**
- Primitive arrays (`[1, 2, 3]`) use Myers — optimal minimal edits
- Object arrays (`[{ id: 1 }, { id: 2 }]`) use index-by-index comparison

## Patch Operations

### Create a patch

```typescript
import { createTwoFilesPatch, createPatch, formatPatch } from '@lpm.dev/neo.diff'

// Unified diff string (git-compatible)
const patchStr = createTwoFilesPatch(
  oldCode, newCode,
  'a/file.ts', 'b/file.ts',
  'old header', 'new header',
  { context: 3 }
)

// ParsedPatch object
const patch = createPatch(oldCode, newCode, 'old.txt', 'new.txt')
const formatted = formatPatch(patch)
```

### Apply a patch — returns PatchResult

```typescript
import { applyPatch } from '@lpm.dev/neo.diff'

const result = applyPatch(source, patch)

if (result.success) {
  console.log(result.content)  // Patched text
} else {
  console.log('Failed hunks:', result.rejected)
  console.log(`Applied ${result.appliedHunks}/${result.totalHunks} hunks`)
  console.log(result.content)  // Partially patched text
}
```

### Fuzzy patch application

```typescript
// Shorthand: allow 2 lines offset + 2 context mismatches
applyPatch(source, patch, { fuzzFactor: 2 })

// Precise control:
applyPatch(source, patch, {
  maxOffset: 5,          // Search up to 5 lines away from expected position
  maxContextMismatch: 0, // But context must match exactly
})
```

### Apply multiple patches sequentially

```typescript
import { applyPatches } from '@lpm.dev/neo.diff'

const result = applyPatches(source, [patch1, patch2, patch3])
```

### Parse patches

```typescript
import { parsePatch, validatePatch } from '@lpm.dev/neo.diff'

const patches = parsePatch(patchString)

// Strict mode: throws on malformed input
const patches = parsePatch(patchString, { strict: true })

// Validate a parsed patch
if (validatePatch(patches[0])) { /* valid */ }
```

## Utilities

```typescript
import { editDistance, similarity, computeLCS } from '@lpm.dev/neo.diff'

editDistance('kitten', 'sitting')  // 3
similarity('hello', 'hallo')      // 0.8 (80% similar)
```

### Tokenizers (exposed for custom use)

```typescript
import { tokenizeLines, tokenizeWords, tokenizeChars, tokenizeSentences } from '@lpm.dev/neo.diff'

tokenizeLines('a\nb\nc')     // ['a\n', 'b\n', 'c']
tokenizeWords('Hello world') // ['Hello', ' ', 'world']
tokenizeChars('abc')         // ['a', 'b', 'c']
```

`tokenizeChars` uses `Intl.Segmenter` for proper grapheme cluster handling (emoji, combining characters).

## TypeScript Types

```typescript
import type {
  DiffChange,              // { value, added?, removed?, count? }
  DiffResult,              // DiffChange[]
  DiffOptions,             // { algorithm?, ignoreWhitespace?, ignoreCase?, ... }
  StructuredDiffChange,    // { type: 'CREATE'|'REMOVE'|'CHANGE', path, value, oldValue? }
  ParsedPatch,             // { oldFileName, newFileName, hunks }
  Hunk,                    // { oldStart, oldLines, newStart, newLines, lines }
  PatchResult,             // { success, content, rejected?, appliedHunks?, totalHunks? }
  EqualityFn,              // (a: T, b: T) => boolean
} from '@lpm.dev/neo.diff'
```

## Tree-Shaking

The package is fully tree-shakeable (`sideEffects: false`). Import only what you need:

```typescript
// ~50-200 bytes per function
import { diffLines, applyPatch } from '@lpm.dev/neo.diff'
```
