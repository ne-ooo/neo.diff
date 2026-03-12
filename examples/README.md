# Examples

This directory contains practical, runnable examples demonstrating the features of `@lpm.dev/neo.diff`.

## Running Examples

```bash
# Run any example with ts-node
npx ts-node examples/basic/line-diff.ts

# Or build first and run with node
npm run build
node examples/basic/line-diff.js
```

## Example Categories

### Basic Examples (`basic/`)
- **line-diff.ts** - Line-by-line text diffing
- **word-diff.ts** - Word-level text diffing
- **char-diff.ts** - Character-level diffing
- **sentence-diff.ts** - Sentence-level diffing
- **algorithms.ts** - Myers vs Patience algorithm comparison

### Patch Examples (`patch/`)
- **generate-patch.ts** - Generate unified diff patches
- **apply-patch.ts** - Apply patches to source text
- **patch-files.ts** - Working with file patches
- **git-style-patches.ts** - Git-compatible patch format

### Structured Examples (`structured/`)
- **json-diff.ts** - Diff JSON objects
- **array-diff.ts** - Diff arrays with custom equality
- **object-diff.ts** - Deep object diffing (microdiff-style)
- **nested-objects.ts** - Nested object comparison

### Real-World Examples (`real-world/`)
- **testing.ts** - Using diffs in tests
- **api-validation.ts** - Validate API responses
- **config-diff.ts** - Configuration file comparison
- **code-review.ts** - Code change visualization
- **migration-check.ts** - Database migration validation

## Quick Start

The simplest example - comparing two strings:

```typescript
import { diffLines } from '@lpm.dev/neo.diff'

const oldText = 'line 1\nline 2\nline 3'
const newText = 'line 1\nmodified line 2\nline 3'

const changes = diffLines(oldText, newText)

for (const change of changes) {
  if (change.added) {
    console.log(`+ ${change.value}`)
  } else if (change.removed) {
    console.log(`- ${change.value}`)
  } else {
    console.log(`  ${change.value}`)
  }
}
```

## TypeScript Support

All examples are written in TypeScript and demonstrate the type-safe API:

```typescript
import { diffObjects } from '@lpm.dev/neo.diff'

const changes = diffObjects(
  { name: 'John', age: 30 },
  { name: 'John', age: 31 }
)

// TypeScript knows the shape of changes
for (const change of changes) {
  if (change.type === 'CHANGE') {
    console.log(`Changed ${change.path.join('.')}: ${change.oldValue} -> ${change.value}`)
  }
}
```

## Performance Examples

See `benchmarks/` in the test directory for detailed performance comparisons.
