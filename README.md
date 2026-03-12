# @lpm.dev/neo.diff

> Modern, fast, and tree-shakeable diff library for JavaScript & TypeScript

[![Bundle Size](https://img.shields.io/badge/bundle-12KB%20minified-success)](https://github.com/ne-ooo/neo.diff)
[![Gzipped](https://img.shields.io/badge/gzipped-3.99KB-success)](https://github.com/ne-ooo/neo.diff)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-176%20passing-success)](https://github.com/ne-ooo/neo.diff)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## Features

- 🚀 **Fast**: 1.16M ops/sec for small text, 811K ops/sec for objects
- 📦 **Tiny**: 12 KB minified, 3.99 KB gzipped (**86% smaller** than diff package)
- 🌳 **Tree-shakeable**: Import only what you need (~50-200 bytes per function)
- 🎯 **TypeScript-first**: Full type safety with strict mode
- 🔋 **Zero dependencies**: No runtime dependencies
- 🎨 **Multiple algorithms**: Myers (fast) and Patience (readable)
- 📝 **Text diffing**: Lines, words, characters, sentences
- 🏗️ **Structured diffing**: JSON, arrays, objects (microdiff-style)
- 🩹 **Patch support**: Generate, apply, and parse unified diff patches
- ⚡ **Modern**: ES2022, dual ESM/CJS builds

## Installation

```bash
lpm install @lpm.dev/neo.diff
```

```bash
lpm install @lpm.dev/neo.diff
```

```bash
lpm install @lpm.dev/neo.diff
```

## Quick Start

### Text Diffing

```typescript
import { diffLines, diffWords, diffChars } from '@lpm.dev/neo.diff'

// Line-by-line diff (most common)
const lineDiff = diffLines(
  'line 1\nline 2\nline 3',
  'line 1\nmodified\nline 3'
)
// => [
//   { value: 'line 1\n', count: 1 },
//   { value: 'line 2', removed: true, count: 1 },
//   { value: 'modified', added: true, count: 1 },
//   { value: '\nline 3', count: 1 }
// ]

// Word-by-word diff
const wordDiff = diffWords('Hello world', 'Hello there')

// Character-by-character diff
const charDiff = diffChars('abc', 'adc')
```

### Patience Algorithm (Better for Code)

```typescript
import { diffLinesPatiently } from '@lpm.dev/neo.diff'

// Produces more readable diffs for code with moved blocks
const diff = diffLinesPatiently(oldCode, newCode)
```

### Structured Diffing

```typescript
import { diffJson, diffArrays, diffObjects } from '@lpm.dev/neo.diff'

// JSON diff (stringifies and diffs line-by-line)
const jsonDiff = diffJson(
  { name: 'John', age: 30 },
  { name: 'John', age: 31 }
)

// Array diff
const arrayDiff = diffArrays([1, 2, 3], [1, 2, 4])

// Object diff (microdiff-style with CREATE/REMOVE/CHANGE)
const objectDiff = diffObjects(
  { a: 1, b: 2 },
  { a: 1, b: 20, c: 3 }
)
// => [
//   { type: 'CHANGE', path: ['b'], oldValue: 2, value: 20 },
//   { type: 'CREATE', path: ['c'], value: 3 }
// ]
```

### Patch Generation & Application

```typescript
import { createPatch, formatPatch, applyPatch } from '@lpm.dev/neo.diff'

const old = 'line 1\nline 2\nline 3'
const newText = 'line 1\nmodified\nline 3'

// Create patch
const patch = createPatch(old, newText, 'file.txt', 'file.txt')

// Format as unified diff
const formatted = formatPatch(patch)
// --- file.txt
// +++ file.txt
// @@ -1,3 +1,3 @@
//  line 1
// -line 2
// +modified
//  line 3

// Apply patch
const result = applyPatch(old, formatted)
// => 'line 1\nmodified\nline 3'
```

## API Documentation

### Text Diffing

#### `diffLines(oldText, newText, options?)`

Compare text line by line. Most commonly used diff function.

```typescript
diffLines('line 1\nline 2', 'line 1\nline 3')
```

**Options:**
- `ignoreWhitespace`: Ignore whitespace differences
- `ignoreCase`: Ignore case differences
- `context`: Number of context lines for patches (default: 3)

#### `diffLinesPatiently(oldText, newText, options?)`

Line diff using Patience algorithm. Better for code with moved sections.

#### `diffWords(oldText, newText, options?)`

Compare text word by word.

#### `diffChars(oldText, newText, options?)`

Compare text character by character.

#### `diffSentences(oldText, newText, options?)`

Compare text sentence by sentence.

### Structured Diffing

#### `diffJson(oldValue, newValue, options?)`

Diff JSON-serializable values. Stringifies with pretty-printing and diffs line-by-line.

```typescript
diffJson({ name: 'John' }, { name: 'Jane' })
```

#### `diffArrays(oldArray, newArray, equals?)`

Diff arrays element by element. Supports custom equality function.

```typescript
diffArrays([1, 2, 3], [1, 2, 4])

// With custom equality
diffArrays(users, newUsers, (a, b) => a.id === b.id)
```

#### `diffObjects(oldObj, newObj)`

Diff objects with microdiff-style output (CREATE/REMOVE/CHANGE operations).

```typescript
diffObjects({ a: 1 }, { a: 2, b: 3 })
// => [
//   { type: 'CHANGE', path: ['a'], oldValue: 1, value: 2 },
//   { type: 'CREATE', path: ['b'], value: 3 }
// ]
```

#### `applyChanges(obj, changes)`

Apply structured changes to recreate an object.

```typescript
const changes = diffObjects(oldObj, newObj)
const result = applyChanges(oldObj, changes)
// result === newObj
```

### Patch Support

#### `createPatch(oldStr, newStr, oldFileName?, newFileName?, options?)`

Create a patch structure from two strings.

#### `formatPatch(patch, oldHeader?, newHeader?)`

Format a patch as unified diff string (compatible with `git diff` and `patch` command).

#### `createTwoFilesPatch(oldStr, newStr, oldPath, newPath, oldHeader?, newHeader?, options?)`

Create a formatted unified diff patch in one step.

#### `applyPatch(source, patch, options?)`

Apply a unified diff patch to source text. Returns patched string or null if failed.

```typescript
applyPatch(source, patchString, { fuzzFactor: 2 })
```

#### `parsePatch(patchContent)`

Parse a unified diff patch string into structured format.

#### `validatePatch(patch)`

Validate a parsed patch structure.

### Algorithms

#### `myersDiff(oldSeq, newSeq, equals?)`

Myers diff algorithm for any sequence. Fast general-purpose algorithm.

#### `patienceDiff(oldSeq, newSeq, equals?)`

Patience diff algorithm. Better for code with moved sections.

### Utilities

#### `computeLCS(oldSeq, newSeq, equals?)`

Compute Longest Common Subsequence.

#### `editDistance(str1, str2)`

Calculate Levenshtein edit distance.

#### `similarity(str1, str2)`

Calculate similarity score (0-1) between strings.

#### `normalizeText(text, ignoreWhitespace?, ignoreCase?)`

Normalize text for comparison.

## Performance

| Operation | Ops/sec | Mean Time |
|-----------|---------|-----------|
| **Small text (3 lines)** | 1,164,097 | 0.9 μs |
| **Medium text (100 lines)** | 55,065 | 18.2 μs |
| **Large text (1000 lines)** | 754 | 1.33 ms |
| **Small object (3 keys)** | 811,201 | 1.2 μs |
| **Config diff** | 850,871 | 1.2 μs |
| **API response diff** | 134,551 | 7.4 μs |

### Algorithm Comparison

- **Myers**: 23x faster for large files, best general-purpose choice
- **Patience**: 1.1x faster for code with moved blocks, more readable output

See [PERFORMANCE.md](PERFORMANCE.md) for detailed benchmarks.

## Bundle Size

| Metric | Size | Comparison |
|--------|------|------------|
| **Minified** | 12 KB | 86% smaller than diff (88 KB) |
| **Gzipped** | 3.99 KB | Excellent for CDN |
| **Tree-shaken** | 50-200 bytes/function | Import only what you need |

## Why Choose neo.diff?

### vs `diff` package (88 KB, 20M downloads/week)
- ✅ **86% smaller** (12 KB vs 88 KB)
- ✅ **TypeScript-first** (diff has community types only)
- ✅ **Tree-shakeable** (diff is all-or-nothing)
- ✅ **Modern ESM** (diff is CommonJS-first)
- ✅ **Comparable performance** (sometimes faster)

### vs `fast-diff` (5 KB, 3M downloads/week)
- ✅ **More features** (patches, structured diff, multiple algorithms)
- ✅ **TypeScript native** (fast-diff has no types)
- ✅ **Better API** (more intuitive, better documented)
- ⚠️ **Slightly larger** (12 KB vs 5 KB, but way more functionality)

### vs `microdiff` (1 KB, 5M downloads/week)
- ✅ **Text diffing** (microdiff only does objects)
- ✅ **Patch support** (microdiff has none)
- ✅ **Multiple algorithms** (microdiff has one approach)
- ⚠️ **Larger** (12 KB vs 1 KB, but microdiff is object-only)

## Tree-Shaking

Import only what you need:

```typescript
// Full bundle (~12 KB)
import * as diff from '@lpm.dev/neo.diff'

// Single function (~50-200 bytes)
import { diffLines } from '@lpm.dev/neo.diff'

// Category import
import { diffLines, diffWords } from '@lpm.dev/neo.diff/text'
import { diffJson, diffObjects } from '@lpm.dev/neo.diff/structured'
```

## Options

### DiffOptions

```typescript
interface DiffOptions {
  context?: number           // Number of context lines (default: 3)
  ignoreWhitespace?: boolean // Ignore whitespace (default: false)
  ignoreCase?: boolean       // Ignore case (default: false)
  algorithm?: 'myers' | 'patience' | 'histogram' | 'lcs'
}
```

### PatchOptions

```typescript
interface PatchOptions {
  context?: number           // Context lines (default: 3)
  newlineAtEnd?: boolean     // Add newline at end (default: true)
  ignoreWhitespace?: boolean // Ignore whitespace (default: false)
}
```

## Real-World Examples

### Git-style Diff

```typescript
import { createTwoFilesPatch } from '@lpm.dev/neo.diff'

const patch = createTwoFilesPatch(
  oldContent,
  newContent,
  'a/src/file.ts',
  'b/src/file.ts',
  'Original',
  'Modified'
)

console.log(patch)
// --- a/src/file.ts  Original
// +++ b/src/file.ts  Modified
// @@ -1,5 +1,5 @@
// ...
```

### Testing Framework

```typescript
import { diffLines } from '@lpm.dev/neo.diff'

function assertTextEquals(expected: string, actual: string) {
  if (expected === actual) return

  const diff = diffLines(expected, actual)
  const message = diff
    .map((change) => {
      if (change.added) return `+ ${change.value}`
      if (change.removed) return `- ${change.value}`
      return `  ${change.value}`
    })
    .join('\n')

  throw new Error(`Text mismatch:\n${message}`)
}
```

### API Response Validation

```typescript
import { diffObjects } from '@lpm.dev/neo.diff'

const expected = { status: 200, data: { id: 1, name: 'Test' } }
const actual = { status: 200, data: { id: 1, name: 'Production' } }

const changes = diffObjects(expected, actual)
// => [{ type: 'CHANGE', path: ['data', 'name'], oldValue: 'Test', value: 'Production' }]
```

### Configuration Diff

```typescript
import { diffJson } from '@lpm.dev/neo.diff'

const oldConfig = { port: 3000, host: 'localhost' }
const newConfig = { port: 8080, host: 'localhost', ssl: true }

const diff = diffJson(oldConfig, newConfig)
// See exactly what changed in config
```

## Migration Guides

- [From diff package](MIGRATION.md#from-diff)
- [From fast-diff](MIGRATION.md#from-fast-diff)
- [From microdiff](MIGRATION.md#from-microdiff)

## TypeScript

Full TypeScript support with strict mode:

```typescript
import type { DiffResult, DiffChange, StructuredDiffChange } from '@lpm.dev/neo.diff'

const changes: DiffResult = diffLines(old, newText)
const change: DiffChange = changes[0]

if (change.added) {
  console.log('Added:', change.value)
}
```

## Requirements

- Node.js 18+ or modern browsers
- TypeScript 5.0+ (for TypeScript users)

## License

MIT

## See Also

- [PERFORMANCE.md](PERFORMANCE.md) - Detailed performance benchmarks
- [MIGRATION.md](MIGRATION.md) - Migration guides from other packages
- [PROGRESS.md](PROGRESS.md) - Implementation progress tracker
