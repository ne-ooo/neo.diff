---
name: anti-patterns
description: Common mistakes when using neo.diff — histogram throws not falls back, applyPatch returns PatchResult not string, diffJson key sorting hides order changes, object array index-by-index diffing, fuzzFactor conflating offset and context, diffWords whitespace tokens, tokenizeChars grapheme fallback
version: "1.0.0"
globs:
  - "**/*.ts"
  - "**/*.js"
---

# Anti-Patterns for @lpm.dev/neo.diff

### [CRITICAL] Using `{ algorithm: 'histogram' }` or `diffLinesHistogram()`

Wrong:

```typescript
// AI assumes histogram is available (it's in the types)
const result = diffLines(oldCode, newCode, { algorithm: 'histogram' })
// Throws: "Histogram diff algorithm is not yet implemented."

diffLinesHistogram(oldCode, newCode)
// Also throws — it delegates to diffLines with algorithm: 'histogram'
```

Correct:

```typescript
// Use Myers (default) or Patience
const result = diffLines(oldCode, newCode)                          // Myers
const result = diffLines(oldCode, newCode, { algorithm: 'patience' }) // Patience
const result = diffLinesPatiently(oldCode, newCode)                  // Patience shorthand
```

The `algorithm: 'histogram'` option exists in the TypeScript types and `diffLinesHistogram()` is exported, but both throw at runtime. This applies to all text diff functions (`diffWords`, `diffChars`, `diffSentences` too).

Source: `src/text/line.ts:69-79` — explicit `throw new Error`

### [CRITICAL] Checking `applyPatch` result as `null`, `false`, or with truthiness

Wrong:

```typescript
// npm diff habit — returns false on failure
const result = applyPatch(source, patch)
if (result === false) { /* never reached */ }

// Old neo.diff habit — returned null
if (result === null) { /* never reached */ }

// Truthy check — objects are always truthy
if (!result) { /* never reached */ }
```

Correct:

```typescript
const result = applyPatch(source, patch)

if (!result.success) {
  console.log('Failed hunks:', result.rejected)
  console.log(`Applied ${result.appliedHunks}/${result.totalHunks}`)
}

// Content is always available — even on partial failure
const text = result.content
```

`applyPatch` returns a `PatchResult` object with `{ success, content, rejected?, appliedHunks?, totalHunks? }`. It never returns `null`, `false`, or a plain string. On partial failure, `content` contains the partially-patched text with successful hunks applied and failed ones skipped.

Source: `src/patch/apply.ts:46-109` — always returns `PatchResult`

### [HIGH] Expecting `diffJson` to detect key ordering differences

Wrong:

```typescript
// AI expects a diff because keys are in different order
const result = diffJson(
  { b: 2, a: 1 },
  { a: 1, b: 2 }
)
// result has NO changes — keys are sorted before comparison
```

Correct:

```typescript
// Default: key-order-independent (keys sorted before stringify)
diffJson({ b: 2, a: 1 }, { a: 1, b: 2 })
// No diff

// To detect key ordering changes, disable sorting
diffJson({ b: 2, a: 1 }, { a: 1, b: 2 }, { sortKeys: false })
// Shows diff: "b" and "a" lines reordered
```

`diffJson` sorts object keys recursively by default via `sortObjectKeys()`. This makes diffing order-independent — which is usually what you want for config/data comparison. But if key order is semantically meaningful (e.g., JSON Schema `properties`), disable with `{ sortKeys: false }`.

Source: `src/structured/json.ts:43-61` — `sortObjectKeys` recursive sort, `src/structured/json.ts:101` — `sortKeys !== false`

### [HIGH] Expecting `diffJson` to silently drop functions/undefined/BigInt

Wrong:

```typescript
// AI assumes JSON.stringify behavior — functions are silently dropped
diffJson(
  { handler: function hello() {}, name: 'test' },
  { handler: function world() {}, name: 'test' }
)
// Expected: no diff (functions dropped)
// Actual: diff shows "[Function: hello]" → "[Function: world]"
```

Correct:

```typescript
// neo.diff uses smartReplacer — non-serializable types are preserved as tagged strings:
// BigInt(123)       → "[BigInt: 123]"
// function hello()  → "[Function: hello]"
// Symbol('test')    → "[Symbol: test]"
// undefined         → "[undefined]"

// This means functions, BigInts, Symbols, and undefined values
// produce real diffs when they change — they are NOT silently dropped
```

Unlike standard `JSON.stringify` which omits functions and throws on BigInt, neo.diff's `smartReplacer` converts non-serializable types to descriptive tagged strings. This is intentional — it surfaces differences that `JSON.stringify` would hide.

Source: `src/structured/json.ts:24-38` — `smartReplacer` function

### [HIGH] Object arrays in `diffObjects` — index shift cascades changes

Wrong:

```typescript
// AI expects a single REMOVE operation
diffObjects(
  { items: [{ id: 1 }, { id: 2 }, { id: 3 }] },
  { items: [{ id: 2 }, { id: 3 }] }
)
// Expected: [{ type: 'REMOVE', path: ['items', 0] }]
// Actual: THREE changes:
//   CHANGE at ['items', 0, 'id']: 1 → 2
//   CHANGE at ['items', 1, 'id']: 2 → 3
//   REMOVE at ['items', 2]
```

Correct:

```typescript
// Object arrays use index-by-index comparison — removing the first
// element shifts every index, generating CHANGE for each position.

// For optimal diffs on object arrays, use diffArrays with custom equality:
import { diffArrays } from '@lpm.dev/neo.diff'

diffArrays(
  [{ id: 1 }, { id: 2 }, { id: 3 }],
  [{ id: 2 }, { id: 3 }],
  (a, b) => a.id === b.id
)
// Correct: single removal of { id: 1 }

// Note: PRIMITIVE arrays in diffObjects DO use Myers (optimal edits):
diffObjects({ tags: ['a', 'b', 'c'] }, { tags: ['b', 'c'] })
// Returns: [{ type: 'REMOVE', path: ['tags', 0], oldValue: 'a' }]
```

`diffObjects` has two code paths for arrays: primitive arrays use Myers algorithm (optimal minimal edits), but object arrays use index-by-index comparison because Myers requires string conversion and can't meaningfully compare object identity.

Source: `src/structured/object.ts:136-190` — `allPrimitive` check, `diffPrimitiveArray` vs index-by-index

### [HIGH] Using high `fuzzFactor` without understanding the three-level system

Wrong:

```typescript
// AI uses fuzzFactor: 3 expecting "be lenient"
const result = applyPatch(source, patch, { fuzzFactor: 3 })
// This allows BOTH:
// - Hunk to be 3 lines away from expected position
// - 3 context lines to be mismatched
// → Can silently apply changes at the wrong location
```

Correct:

```typescript
// Separate the two concerns:

// Allow position drift (lines were added/removed above), but context must match exactly
applyPatch(source, patch, { maxOffset: 5, maxContextMismatch: 0 })

// Hunk must be at expected position, but tolerate edited context lines
applyPatch(source, patch, { maxOffset: 0, maxContextMismatch: 2 })

// Start with no fuzz, then loosen one dimension at a time
const result = applyPatch(source, patch)
if (!result.success) {
  const retry = applyPatch(source, patch, { maxOffset: 3, maxContextMismatch: 0 })
}
```

`fuzzFactor` is a shorthand that sets both `maxOffset` and `maxContextMismatch` to the same value. The old single-number approach conflates two different failure modes: position drift (new lines shifted the hunk) and context mutation (someone edited a context line). Separating them gives precise control and avoids false-positive matches.

Source: `src/patch/apply.ts:51-53` — `maxOffset ?? fuzz`, `maxContextMismatch ?? fuzz`

### [MEDIUM] `diffWords` treating whitespace changes as real diffs

Wrong:

```typescript
// AI expects "no meaningful changes"
const result = diffWords('Hello world', 'Hello  world')
// Returns a diff: ' ' removed, '  ' added
// The actual words are identical — only spacing changed!
```

Correct:

```typescript
// Use ignoreWhitespace to suppress whitespace-only changes
const result = diffWords('Hello world', 'Hello  world', { ignoreWhitespace: true })
// No changes — whitespace tokens are treated as equal

// Be aware: whitespace tokens still appear in the output, just not marked as changes
```

`tokenizeWords` uses `/\S+|\s+/g` which produces alternating word and whitespace tokens. Double spaces, tabs, and other whitespace variations are their own tokens. Without `ignoreWhitespace`, any spacing change produces a diff even if the words are identical.

Source: `src/text/tokenize.ts:68-75` — `/\S+|\s+/g` regex

### [MEDIUM] Expecting `tokenizeChars` to always split emoji the same way

Wrong:

```typescript
// AI assumes consistent behavior across runtimes
tokenizeChars('👍🏻')
// On modern runtimes (Intl.Segmenter): ['👍🏻']  (one grapheme cluster)
// On old runtimes (fallback):          ['👍', '🏻']  (two code points)
```

Correct:

```typescript
// Check if Intl.Segmenter is available for consistent behavior
if (typeof Intl !== 'undefined' && Intl.Segmenter) {
  // Grapheme clusters — emoji with skin tones, ZWJ sequences treated as single chars
  tokenizeChars('👨‍👩‍👧‍👦')  // ['👨‍👩‍👧‍👦']
} else {
  // Code point splitting — combined emoji split into components
  tokenizeChars('👨‍👩‍👧‍👦')  // ['👨', '‍', '👩', '‍', '👧', '‍', '👦']
}

// This affects diffChars output for emoji-heavy text
// Modern runtimes: fewer, larger changes
// Old runtimes: many tiny code-point-level changes
```

`tokenizeChars` uses `Intl.Segmenter` (Node 16+, modern browsers) for proper grapheme cluster segmentation. The fallback uses the spread operator `[...text]` which splits on Unicode code points. This means `diffChars` produces different results depending on runtime support.

Source: `src/text/tokenize.ts:94-106` — `Intl.Segmenter` check with fallback
