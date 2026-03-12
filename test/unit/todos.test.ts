/**
 * Tests for all 15 TODOs implemented in the diff package
 */

import { describe, it, expect } from 'vitest'
import {
  diffLines,
  diffLinesPatiently,
  diffLinesHistogram,
  diffWords,
  diffChars,
  diffSentences,
  diffJson,
  diffJsonString,
  diffObjects,
  applyChanges,
  applyPatch,
  applyPatches,
  parsePatch,
} from '../../src/index.js'
import { tokenizeChars } from '../../src/text/tokenize.js'

// ─── TODO 1: structuredClone in applyChanges ──────────────────────────────

describe('TODO 1: structuredClone in applyChanges', () => {
  it('should not mutate the original object', () => {
    const original = { a: 1, nested: { b: 2 } }
    const changes = [
      { type: 'CHANGE' as const, path: ['nested', 'b'], oldValue: 2, value: 99 },
    ]

    const result = applyChanges(original, changes)

    expect(result.nested).toEqual({ b: 99 })
    expect((original.nested as any).b).toBe(2) // original untouched
  })

  it('should handle Date objects in cloning', () => {
    const date = new Date('2025-01-01')
    const original = { date }
    const changes = [
      { type: 'CREATE' as const, path: ['extra'], value: 'new' },
    ]

    const result = applyChanges(original, changes)

    expect((result as any).date).toBeInstanceOf(Date)
    expect((result as any).date.getTime()).toBe(date.getTime())
    expect((result as any).date).not.toBe(date) // different reference
  })
})

// ─── TODO 2: Circular reference detection ─────────────────────────────────

describe('TODO 2: Circular reference detection in diffObjects', () => {
  it('should not infinite loop on circular references', () => {
    const a: any = { name: 'a' }
    a.self = a

    const b: any = { name: 'b' }
    b.self = b

    // Should complete without hanging
    const changes = diffObjects(a, b)
    expect(changes.length).toBeGreaterThan(0)
  })

  it('should return no changes for same circular reference', () => {
    const obj: any = { value: 1 }
    obj.self = obj

    const changes = diffObjects(obj, obj)
    expect(changes).toHaveLength(0)
  })
})

// ─── TODO 3: Grapheme cluster tokenization ────────────────────────────────

describe('TODO 3: Grapheme cluster tokenization', () => {
  it('should tokenize basic ASCII correctly', () => {
    expect(tokenizeChars('abc')).toEqual(['a', 'b', 'c'])
  })

  it('should handle emoji with Intl.Segmenter', () => {
    const chars = tokenizeChars('👍🏻')
    // With Intl.Segmenter, skin tone emoji should be 1 grapheme cluster
    // (if the runtime supports it)
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      expect(chars).toHaveLength(1)
      expect(chars[0]).toBe('👍🏻')
    }
  })

  it('should handle empty string', () => {
    expect(tokenizeChars('')).toEqual([])
  })

  it('should handle surrogate pairs', () => {
    const chars = tokenizeChars('𝕳𝖊𝖑𝖑𝖔')
    expect(chars).toHaveLength(5)
  })
})

// ─── TODO 4: Handle non-serializable types in diffJson ────────────────────

describe('TODO 4: Handle non-serializable types in diffJson', () => {
  it('should handle functions without throwing', () => {
    const old = { fn: function hello() {} }
    const newObj = { fn: function world() {} }

    const result = diffJson(old, newObj)
    const text = result.map((c) => c.value).join('')
    expect(text).toContain('[Function:')
  })

  it('should handle undefined values', () => {
    const old = { a: undefined }
    const newObj = { a: 'defined' }

    const result = diffJson(old, newObj)
    expect(result.some((c) => c.removed || c.added)).toBe(true)
  })

  it('should handle symbols', () => {
    const old = { s: Symbol('test') }
    const newObj = { s: Symbol('other') }

    const result = diffJson(old, newObj)
    const text = result.map((c) => c.value).join('')
    expect(text).toContain('[Symbol:')
  })
})

// ─── TODO 5: Key-order-independent diffJson ───────────────────────────────

describe('TODO 5: Key-order-independent diffJson', () => {
  it('should treat different key orders as equal by default', () => {
    const old = { a: 1, b: 2 }
    const newObj = { b: 2, a: 1 }

    const result = diffJson(old, newObj)
    // All changes should be context (no added/removed)
    expect(result.every((c) => !c.added && !c.removed)).toBe(true)
  })

  it('should detect key order differences when sortKeys is false', () => {
    const old = { a: 1, b: 2 }
    const newObj = { b: 2, a: 1 }

    const result = diffJson(old, newObj, { sortKeys: false })
    // With sortKeys: false, different key order produces a diff
    expect(result.some((c) => c.added || c.removed)).toBe(true)
  })
})

// ─── TODO 6: BigInt handling in diffJson ──────────────────────────────────

describe('TODO 6: BigInt handling in diffJson', () => {
  it('should not throw on BigInt values', () => {
    const old = { n: BigInt(123) }
    const newObj = { n: BigInt(456) }

    const result = diffJson(old, newObj)
    const text = result.map((c) => c.value).join('')
    expect(text).toContain('[BigInt: 123]')
    expect(text).toContain('[BigInt: 456]')
  })

  it('should show no diff for same BigInt', () => {
    const old = { n: BigInt(42) }
    const newObj = { n: BigInt(42) }

    const result = diffJson(old, newObj)
    expect(result.every((c) => !c.added && !c.removed)).toBe(true)
  })
})

// ─── TODO 7: Strict mode for diffJsonString ───────────────────────────────

describe('TODO 7: Strict mode for diffJsonString', () => {
  it('should fall back to string diff on invalid JSON by default', () => {
    const result = diffJsonString('{invalid', '{also invalid')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should throw on invalid JSON in strict mode', () => {
    expect(() =>
      diffJsonString('{invalid', '{}', { strict: true })
    ).toThrow('Invalid JSON input')
  })

  it('should work normally with valid JSON in strict mode', () => {
    const result = diffJsonString('{"a":1}', '{"a":2}', { strict: true })
    expect(result.some((c) => c.added || c.removed)).toBe(true)
  })
})

// ─── TODO 8: Myers-based array diffing in diffObjects ─────────────────────

describe('TODO 8: Myers-based array diffing in diffObjects', () => {
  it('should detect insertions in primitive arrays', () => {
    const old = { items: [1, 2, 3] }
    const newObj = { items: [1, 2, 2.5, 3] }
    const changes = diffObjects(old, newObj)

    expect(changes.some((c) => c.type === 'CREATE')).toBe(true)
  })

  it('should detect removals in primitive arrays', () => {
    const old = { items: ['a', 'b', 'c'] }
    const newObj = { items: ['a', 'c'] }
    const changes = diffObjects(old, newObj)

    expect(changes.some((c) => c.type === 'REMOVE')).toBe(true)
  })

  it('should still diff object arrays index-by-index', () => {
    const old = { items: [{ id: 1 }, { id: 2 }] }
    const newObj = { items: [{ id: 1 }, { id: 3 }] }
    const changes = diffObjects(old, newObj)

    expect(changes.length).toBeGreaterThan(0)
    expect(changes[0]!.path).toContain('items')
  })
})

// ─── TODO 9: Diagnostic failure info from applyPatch ──────────────────────

describe('TODO 9: Diagnostic failure info from applyPatch', () => {
  it('should return PatchResult with success: true on successful apply', () => {
    const source = 'line 1\nline 2\nline 3'
    const patchStr = `--- file.txt
+++ file.txt
@@ -1,3 +1,3 @@
 line 1
-line 2
+modified
 line 3`

    const result = applyPatch(source, patchStr)

    expect(result.success).toBe(true)
    expect(result.content).toBe('line 1\nmodified\nline 3')
    expect(result.appliedHunks).toBe(1)
    expect(result.totalHunks).toBe(1)
    expect(result.rejected).toBeUndefined()
  })

  it('should return PatchResult with rejected hunks on failure', () => {
    const source = 'completely different content'
    const patchStr = `--- file.txt
+++ file.txt
@@ -1,3 +1,3 @@
 line 1
-line 2
+modified
 line 3`

    const result = applyPatch(source, patchStr)

    expect(result.success).toBe(false)
    expect(result.rejected).toBeDefined()
    expect(result.rejected!.length).toBeGreaterThan(0)
    expect(result.rejected![0]).toContain('Hunk')
  })

  it('should return empty result for no valid patch', () => {
    const result = applyPatch('source', '')

    expect(result.success).toBe(false)
    expect(result.totalHunks).toBe(0)
  })
})

// ─── TODO 10: Separate fuzzFactor concerns ────────────────────────────────

describe('TODO 10: Separate fuzzFactor concerns', () => {
  it('should apply fuzzFactor as shorthand for maxOffset and maxContextMismatch', () => {
    const source = 'header\nline 1\nline 2\nline 3\nfooter'
    // Patch expects line 2 at position 1, but it's at position 2
    const patchStr = `--- file.txt
+++ file.txt
@@ -1,3 +1,3 @@
 line 1
-line 2
+modified
 line 3`

    // Without fuzz, this should fail (content at wrong position)
    const result = applyPatch(source, patchStr, { fuzzFactor: 2 })

    // With fuzzFactor: 2, should find the hunk at offset 1
    expect(result.success).toBe(true)
  })

  it('should allow separate maxOffset and maxContextMismatch', () => {
    const source = 'line 1\nline 2\nline 3'
    const patchStr = `--- file.txt
+++ file.txt
@@ -1,3 +1,3 @@
 line 1
-line 2
+modified
 line 3`

    const result = applyPatch(source, patchStr, {
      maxOffset: 0,
      maxContextMismatch: 0,
    })

    expect(result.success).toBe(true)
  })
})

// ─── TODO 11: Strict mode for parsePatch ──────────────────────────────────

describe('TODO 11: Strict mode for parsePatch', () => {
  it('should ignore unexpected lines in non-strict mode', () => {
    const patchStr = `--- file.txt
+++ file.txt
@@ -1,2 +1,2 @@
 line 1
GARBAGE LINE
-line 2
+modified`

    // Non-strict: should not throw
    const patches = parsePatch(patchStr)
    expect(patches).toHaveLength(1)
  })

  it('should throw on unexpected lines in strict mode', () => {
    const patchStr = `--- file.txt
+++ file.txt
@@ -1,2 +1,2 @@
 line 1
GARBAGE LINE
-line 2
+modified`

    expect(() => parsePatch(patchStr, { strict: true })).toThrow('Unexpected line format')
  })

  it('should parse valid patches in strict mode', () => {
    const patchStr = `--- file.txt
+++ file.txt
@@ -1,3 +1,3 @@
 line 1
-line 2
+modified
 line 3`

    const patches = parsePatch(patchStr, { strict: true })
    expect(patches).toHaveLength(1)
    expect(patches[0]!.hunks).toHaveLength(1)
  })
})

// ─── TODO 12: Wire DiffOptions.algorithm to text diff functions ───────────

describe('TODO 12: Algorithm dispatch in text diff functions', () => {
  const oldText = 'line 1\nline 2\nline 3'
  const newText = 'line 1\nmodified\nline 3'

  it('diffLines should use myers by default', () => {
    const result = diffLines(oldText, newText)
    expect(result.length).toBeGreaterThan(0)
  })

  it('diffLines should accept algorithm: patience', () => {
    const result = diffLines(oldText, newText, { algorithm: 'patience' })
    expect(result.length).toBeGreaterThan(0)
    expect(result.some((c) => c.added || c.removed)).toBe(true)
  })

  it('diffWords should accept algorithm: patience', () => {
    const result = diffWords('hello world', 'hello there', {
      algorithm: 'patience',
    })
    expect(result.length).toBeGreaterThan(0)
  })

  it('diffChars should accept algorithm: patience', () => {
    const result = diffChars('abc', 'adc', { algorithm: 'patience' })
    expect(result.length).toBeGreaterThan(0)
  })

  it('diffSentences should accept algorithm: patience', () => {
    const result = diffSentences(
      'First sentence. Second sentence.',
      'First sentence. New sentence.',
      { algorithm: 'patience' }
    )
    expect(result.length).toBeGreaterThan(0)
  })

  it('diffLinesPatiently should delegate to patience', () => {
    const result = diffLinesPatiently(oldText, newText)
    expect(result.length).toBeGreaterThan(0)
    expect(result.some((c) => c.added || c.removed)).toBe(true)
  })
})

// ─── TODO 13: Histogram algorithm throws ──────────────────────────────────

describe('TODO 13: Histogram algorithm throws', () => {
  it('diffLines should throw for algorithm: histogram', () => {
    expect(() =>
      diffLines('a', 'b', { algorithm: 'histogram' })
    ).toThrow('Histogram diff algorithm is not yet implemented')
  })

  it('diffWords should throw for algorithm: histogram', () => {
    expect(() =>
      diffWords('a', 'b', { algorithm: 'histogram' })
    ).toThrow('Histogram diff algorithm is not yet implemented')
  })

  it('diffChars should throw for algorithm: histogram', () => {
    expect(() =>
      diffChars('a', 'b', { algorithm: 'histogram' })
    ).toThrow('Histogram diff algorithm is not yet implemented')
  })

  it('diffSentences should throw for algorithm: histogram', () => {
    expect(() =>
      diffSentences('a.', 'b.', { algorithm: 'histogram' })
    ).toThrow('Histogram diff algorithm is not yet implemented')
  })

  it('diffLinesHistogram should throw', () => {
    expect(() => diffLinesHistogram('a', 'b')).toThrow(
      'Histogram diff algorithm is not yet implemented'
    )
  })
})

// ─── TODO 14: normalizeLineEndings option ─────────────────────────────────

describe('TODO 14: normalizeLineEndings option', () => {
  it('should normalize \\r\\n to \\n by default', () => {
    const old = 'line 1\r\nline 2\r\nline 3'
    const newText = 'line 1\nline 2\nline 3'

    const result = diffLines(old, newText)
    // After normalization, these should be identical
    expect(result.every((c) => !c.added && !c.removed)).toBe(true)
  })

  it('should preserve line endings when normalizeLineEndings is false', () => {
    const old = 'line 1\r\nline 2'
    const newText = 'line 1\nline 2'

    const result = diffLines(old, newText, { normalizeLineEndings: false })
    // Different line endings should produce a diff
    expect(result.some((c) => c.added || c.removed)).toBe(true)
  })

  it('should normalize lone \\r to \\n', () => {
    const old = 'line 1\rline 2'
    const newText = 'line 1\nline 2'

    const result = diffLines(old, newText)
    expect(result.every((c) => !c.added && !c.removed)).toBe(true)
  })
})

// ─── TODO 15: Map/Set support in diffObjects ──────────────────────────────

describe('TODO 15: Map/Set support in diffObjects', () => {
  it('should detect changes in Map values', () => {
    const old = {
      data: new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
      ]),
    }
    const newObj = {
      data: new Map([
        ['key1', 'value1'],
        ['key2', 'changed'],
      ]),
    }

    const changes = diffObjects(
      old as Record<string, unknown>,
      newObj as Record<string, unknown>
    )
    expect(changes.length).toBeGreaterThan(0)
    expect(changes.some((c) => c.type === 'CHANGE')).toBe(true)
  })

  it('should detect added Map entries', () => {
    const old = {
      data: new Map([['key1', 'value1']]),
    }
    const newObj = {
      data: new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
      ]),
    }

    const changes = diffObjects(
      old as Record<string, unknown>,
      newObj as Record<string, unknown>
    )
    expect(changes.some((c) => c.type === 'CREATE')).toBe(true)
  })

  it('should detect removed Map entries', () => {
    const old = {
      data: new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
      ]),
    }
    const newObj = {
      data: new Map([['key1', 'value1']]),
    }

    const changes = diffObjects(
      old as Record<string, unknown>,
      newObj as Record<string, unknown>
    )
    expect(changes.some((c) => c.type === 'REMOVE')).toBe(true)
  })

  it('should detect Set changes', () => {
    const old = { tags: new Set([1, 2, 3]) }
    const newObj = { tags: new Set([1, 2, 4]) }

    const changes = diffObjects(
      old as Record<string, unknown>,
      newObj as Record<string, unknown>
    )
    expect(changes).toHaveLength(1)
    expect(changes[0]!.type).toBe('CHANGE')
    expect(changes[0]!.path).toEqual(['tags'])
  })

  it('should report no changes for equal Sets', () => {
    const old = { tags: new Set([1, 2, 3]) }
    const newObj = { tags: new Set([1, 2, 3]) }

    const changes = diffObjects(
      old as Record<string, unknown>,
      newObj as Record<string, unknown>
    )
    expect(changes).toHaveLength(0)
  })

  it('should report no changes for equal Maps', () => {
    const old = {
      data: new Map([
        ['a', 1],
        ['b', 2],
      ]),
    }
    const newObj = {
      data: new Map([
        ['a', 1],
        ['b', 2],
      ]),
    }

    const changes = diffObjects(
      old as Record<string, unknown>,
      newObj as Record<string, unknown>
    )
    expect(changes).toHaveLength(0)
  })
})
