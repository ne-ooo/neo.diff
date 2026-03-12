/**
 * Tests for common diff utilities
 */

import { describe, it, expect } from 'vitest'
import {
  computeLCS,
  backtrackLCS,
  buildChangesFromMatches,
  editDistance,
  similarity,
  normalizeText,
  mergeConsecutiveChanges,
} from '../../src/core/common.js'
import type { DiffChange } from '../../src/types.js'

describe('computeLCS', () => {
  it('should compute LCS for identical sequences', () => {
    const dp = computeLCS(['a', 'b', 'c'], ['a', 'b', 'c'])
    expect(dp[3]![3]).toBe(3) // LCS length is 3
  })

  it('should compute LCS for completely different sequences', () => {
    const dp = computeLCS(['a', 'b', 'c'], ['x', 'y', 'z'])
    expect(dp[3]![3]).toBe(0) // LCS length is 0
  })

  it('should compute LCS for partially matching sequences', () => {
    const dp = computeLCS(['a', 'b', 'c'], ['a', 'd', 'c'])
    expect(dp[3]![3]).toBe(2) // LCS is 'ac' (length 2)
  })

  it('should handle empty sequences', () => {
    const dp1 = computeLCS([], ['a', 'b'])
    expect(dp1[0]![2]).toBe(0)

    const dp2 = computeLCS(['a', 'b'], [])
    expect(dp2[2]![0]).toBe(0)
  })
})

describe('backtrackLCS', () => {
  it('should find matching indices', () => {
    const seq1 = ['a', 'b', 'c']
    const seq2 = ['a', 'd', 'c']
    const dp = computeLCS(seq1, seq2)
    const matches = backtrackLCS(dp, seq1, seq2)

    expect(matches).toHaveLength(2)
    expect(matches[0]).toEqual({ oldIndex: 0, newIndex: 0 }) // 'a'
    expect(matches[1]).toEqual({ oldIndex: 2, newIndex: 2 }) // 'c'
  })

  it('should handle no matches', () => {
    const seq1 = ['a', 'b']
    const seq2 = ['x', 'y']
    const dp = computeLCS(seq1, seq2)
    const matches = backtrackLCS(dp, seq1, seq2)

    expect(matches).toHaveLength(0)
  })

  it('should handle all matches', () => {
    const seq1 = ['a', 'b', 'c']
    const seq2 = ['a', 'b', 'c']
    const dp = computeLCS(seq1, seq2)
    const matches = backtrackLCS(dp, seq1, seq2)

    expect(matches).toHaveLength(3)
  })
})

describe('editDistance', () => {
  it('should return 0 for identical strings', () => {
    expect(editDistance('hello', 'hello')).toBe(0)
  })

  it('should return correct distance for single char difference', () => {
    expect(editDistance('hello', 'hallo')).toBe(1) // e->a substitution
  })

  it('should return correct distance for insertion', () => {
    expect(editDistance('hello', 'helllo')).toBe(1) // insert l
  })

  it('should return correct distance for deletion', () => {
    expect(editDistance('hello', 'helo')).toBe(1) // delete l
  })

  it('should handle completely different strings', () => {
    expect(editDistance('abc', 'xyz')).toBe(3)
  })

  it('should handle empty strings', () => {
    expect(editDistance('', '')).toBe(0)
    expect(editDistance('abc', '')).toBe(3)
    expect(editDistance('', 'abc')).toBe(3)
  })

  it('should be symmetric', () => {
    expect(editDistance('hello', 'world')).toBe(editDistance('world', 'hello'))
  })
})

describe('similarity', () => {
  it('should return 1 for identical strings', () => {
    expect(similarity('hello', 'hello')).toBe(1)
  })

  it('should return 0 for completely different strings', () => {
    expect(similarity('abc', 'xyz')).toBe(0)
  })

  it('should return intermediate values for similar strings', () => {
    const sim = similarity('hello', 'hallo')
    expect(sim).toBeGreaterThan(0)
    expect(sim).toBeLessThan(1)
    expect(sim).toBeCloseTo(0.8, 1) // 1 change in 5 chars = 0.8
  })

  it('should handle empty strings', () => {
    expect(similarity('', '')).toBe(1) // Both empty = identical
  })

  it('should be symmetric', () => {
    expect(similarity('hello', 'world')).toBe(similarity('world', 'hello'))
  })
})

describe('normalizeText', () => {
  it('should not change text with no options', () => {
    expect(normalizeText('Hello World')).toBe('Hello World')
  })

  it('should remove whitespace when specified', () => {
    expect(normalizeText('Hello World', true, false)).toBe('HelloWorld')
    expect(normalizeText('  Hello  \t World  ', true, false)).toBe('HelloWorld')
  })

  it('should convert to lowercase when specified', () => {
    expect(normalizeText('Hello World', false, true)).toBe('hello world')
  })

  it('should apply both transformations', () => {
    expect(normalizeText('Hello World', true, true)).toBe('helloworld')
  })
})

describe('mergeConsecutiveChanges', () => {
  it('should merge consecutive additions', () => {
    const changes: DiffChange[] = [
      { value: 'a', added: true, count: 1 },
      { value: 'b', added: true, count: 1 },
      { value: 'c', added: true, count: 1 },
    ]

    const merged = mergeConsecutiveChanges(changes)
    expect(merged).toHaveLength(1)
    expect(merged[0]).toEqual({ value: 'abc', added: true, count: 3 })
  })

  it('should merge consecutive deletions', () => {
    const changes: DiffChange[] = [
      { value: 'a', removed: true, count: 1 },
      { value: 'b', removed: true, count: 1 },
      { value: 'c', removed: true, count: 1 },
    ]

    const merged = mergeConsecutiveChanges(changes)
    expect(merged).toHaveLength(1)
    expect(merged[0]).toEqual({ value: 'abc', removed: true, count: 3 })
  })

  it('should merge consecutive unchanged', () => {
    const changes: DiffChange[] = [
      { value: 'a', count: 1 },
      { value: 'b', count: 1 },
      { value: 'c', count: 1 },
    ]

    const merged = mergeConsecutiveChanges(changes)
    expect(merged).toHaveLength(1)
    expect(merged[0]).toEqual({ value: 'abc', count: 3 })
  })

  it('should not merge different types', () => {
    const changes: DiffChange[] = [
      { value: 'a', added: true, count: 1 },
      { value: 'b', removed: true, count: 1 },
      { value: 'c', added: true, count: 1 },
    ]

    const merged = mergeConsecutiveChanges(changes)
    expect(merged).toHaveLength(3)
  })

  it('should handle mixed consecutive and non-consecutive', () => {
    const changes: DiffChange[] = [
      { value: 'a', count: 1 },
      { value: 'b', count: 1 },
      { value: 'c', removed: true, count: 1 },
      { value: 'd', removed: true, count: 1 },
      { value: 'e', added: true, count: 1 },
    ]

    const merged = mergeConsecutiveChanges(changes)
    expect(merged).toHaveLength(3)
    expect(merged[0]).toEqual({ value: 'ab', count: 2 })
    expect(merged[1]).toEqual({ value: 'cd', removed: true, count: 2 })
    expect(merged[2]).toEqual({ value: 'e', added: true, count: 1 })
  })

  it('should handle empty array', () => {
    const merged = mergeConsecutiveChanges([])
    expect(merged).toEqual([])
  })

  it('should handle single change', () => {
    const changes: DiffChange[] = [{ value: 'a', count: 1 }]
    const merged = mergeConsecutiveChanges(changes)
    expect(merged).toEqual(changes)
  })
})

describe('buildChangesFromMatches', () => {
  it('returns empty array when both sequences are empty', () => {
    const result = buildChangesFromMatches([], [], [])
    expect(result).toEqual([])
  })

  it('builds unchanged changes for all-match sequences', () => {
    const seq = ['a', 'b', 'c']
    const matches = [
      { oldIndex: 0, newIndex: 0 },
      { oldIndex: 1, newIndex: 1 },
      { oldIndex: 2, newIndex: 2 },
    ]
    const result = buildChangesFromMatches(seq, seq, matches)
    // Each match produces one unchanged change
    expect(result.length).toBe(3)
    result.forEach((c) => {
      expect(c.added).toBeUndefined()
      expect(c.removed).toBeUndefined()
    })
  })

  it('builds a deletion change for old elements before first match', () => {
    const oldSeq = ['x', 'a']
    const newSeq = ['a']
    const matches = [{ oldIndex: 1, newIndex: 0 }]
    const result = buildChangesFromMatches(oldSeq, newSeq, matches)

    const deleted = result.find((c) => c.removed)
    expect(deleted).toBeDefined()
    expect(deleted!.value).toBe('x')
  })

  it('builds an insertion change for new elements before first match', () => {
    const oldSeq = ['a']
    const newSeq = ['x', 'a']
    const matches = [{ oldIndex: 0, newIndex: 1 }]
    const result = buildChangesFromMatches(oldSeq, newSeq, matches)

    const inserted = result.find((c) => c.added)
    expect(inserted).toBeDefined()
    expect(inserted!.value).toBe('x')
  })

  it('builds remaining deletion for old elements after last match', () => {
    const oldSeq = ['a', 'x']
    const newSeq = ['a']
    const matches = [{ oldIndex: 0, newIndex: 0 }]
    const result = buildChangesFromMatches(oldSeq, newSeq, matches)

    const deleted = result.find((c) => c.removed)
    expect(deleted).toBeDefined()
    expect(deleted!.value).toBe('x')
  })

  it('builds remaining insertion for new elements after last match', () => {
    const oldSeq = ['a']
    const newSeq = ['a', 'x']
    const matches = [{ oldIndex: 0, newIndex: 0 }]
    const result = buildChangesFromMatches(oldSeq, newSeq, matches)

    const inserted = result.find((c) => c.added)
    expect(inserted).toBeDefined()
    expect(inserted!.value).toBe('x')
  })

  it('handles no matches — pure replacement', () => {
    const oldSeq = ['a', 'b']
    const newSeq = ['x', 'y']
    const result = buildChangesFromMatches(oldSeq, newSeq, [])

    expect(result.find((c) => c.removed)?.value).toBe('ab')
    expect(result.find((c) => c.added)?.value).toBe('xy')
  })
})
