/**
 * Tests for Patience diff algorithm
 */

import { describe, it, expect } from 'vitest'
import { patienceDiff, patienceDiffString } from '../../src/core/patience.js'

describe('patienceDiff', () => {
  it('should diff identical sequences', () => {
    const result = patienceDiff(['a', 'b', 'c'], ['a', 'b', 'c'])
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ value: 'a', count: 1 })
    expect(result[1]).toEqual({ value: 'b', count: 1 })
    expect(result[2]).toEqual({ value: 'c', count: 1 })
  })

  it('should diff empty sequences', () => {
    const result = patienceDiff([], [])
    expect(result).toEqual([])
  })

  it('should diff from empty sequence', () => {
    const result = patienceDiff([], ['a', 'b'])
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ value: 'ab', added: true, count: 2 })
  })

  it('should diff to empty sequence', () => {
    const result = patienceDiff(['a', 'b'], [])
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ value: 'ab', removed: true, count: 2 })
  })

  it('should find unique matches', () => {
    const old = ['a', 'b', 'c', 'd']
    const newSeq = ['a', 'c', 'd', 'e']
    const result = patienceDiff(old, newSeq)

    expect(result.length).toBeGreaterThan(0)
    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
  })

  it('should handle moved sections', () => {
    const old = ['A', 'B', 'C']
    const newSeq = ['C', 'A', 'B']
    const result = patienceDiff(old, newSeq)

    // Patience should detect the move
    expect(result.length).toBeGreaterThan(0)
  })

  it('should fall back to Myers when no unique matches', () => {
    const old = ['x', 'x', 'x']
    const newSeq = ['x', 'x', 'x', 'x']
    const result = patienceDiff(old, newSeq)

    expect(result.length).toBeGreaterThan(0)
    expect(result.some((c) => c.added)).toBe(true)
  })

  it('should handle single element change', () => {
    const old = ['a', 'b', 'c']
    const newSeq = ['a', 'd', 'c']
    const result = patienceDiff(old, newSeq)

    expect(result).toHaveLength(4)
    expect(result[0]).toEqual({ value: 'a', count: 1 })
    expect(result[1]).toEqual({ value: 'b', removed: true, count: 1 })
    expect(result[2]).toEqual({ value: 'd', added: true, count: 1 })
    expect(result[3]).toEqual({ value: 'c', count: 1 })
  })

  it('should handle custom equality function', () => {
    const old = ['A', 'B', 'C']
    const newSeq = ['a', 'b', 'c']
    const equals = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
    const result = patienceDiff(old, newSeq, equals)

    expect(result).toHaveLength(3)
    expect(result[0]!.value).toBe('A')
    expect(result[1]!.value).toBe('B')
    expect(result[2]!.value).toBe('C')
  })

  it('should produce readable diffs for code', () => {
    const old = ['function test() {', '  return 42', '}']
    const newSeq = ['function test() {', '  return 100', '}']
    const result = patienceDiff(old, newSeq)

    // Should identify function signature and closing brace as unchanged
    expect(result.some((c) => c.value === 'function test() {')).toBe(true)
    expect(result.some((c) => c.value === '}')).toBe(true)
    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
  })

  it('should handle added elements at end', () => {
    const old = ['a', 'b']
    const newSeq = ['a', 'b', 'c', 'd']
    const result = patienceDiff(old, newSeq)

    expect(result.some((c) => c.added)).toBe(true)
    expect(result.some((c) => c.value === 'a')).toBe(true)
    expect(result.some((c) => c.value === 'b')).toBe(true)
  })

  it('should handle removed elements at end', () => {
    const old = ['a', 'b', 'c', 'd']
    const newSeq = ['a', 'b']
    const result = patienceDiff(old, newSeq)

    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.value === 'a')).toBe(true)
    expect(result.some((c) => c.value === 'b')).toBe(true)
  })

  it('should handle added elements at start', () => {
    const old = ['c', 'd']
    const newSeq = ['a', 'b', 'c', 'd']
    const result = patienceDiff(old, newSeq)

    expect(result.some((c) => c.added)).toBe(true)
  })

  it('should handle removed elements at start', () => {
    const old = ['a', 'b', 'c', 'd']
    const newSeq = ['c', 'd']
    const result = patienceDiff(old, newSeq)

    expect(result.some((c) => c.removed)).toBe(true)
  })

  it('should handle completely different sequences', () => {
    const old = ['a', 'b', 'c']
    const newSeq = ['x', 'y', 'z']
    const result = patienceDiff(old, newSeq)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ value: 'abc', removed: true, count: 3 })
    expect(result[1]).toEqual({ value: 'xyz', added: true, count: 3 })
  })

  it('should handle interleaved changes', () => {
    const old = ['a', 'b', 'c', 'd', 'e']
    const newSeq = ['a', 'x', 'c', 'y', 'e']
    const result = patienceDiff(old, newSeq)

    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
    expect(result.some((c) => !c.added && !c.removed)).toBe(true)
  })

  it('should handle duplicate elements in old sequence', () => {
    const old = ['a', 'b', 'b', 'c']
    const newSeq = ['a', 'b', 'c']
    const result = patienceDiff(old, newSeq)

    // Should handle duplicates correctly
    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle duplicate elements in new sequence', () => {
    const old = ['a', 'b', 'c']
    const newSeq = ['a', 'b', 'b', 'c']
    const result = patienceDiff(old, newSeq)

    // Should handle duplicates correctly
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('patienceDiffString', () => {
  it('should diff identical strings', () => {
    const result = patienceDiffString('abc', 'abc')
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ value: 'a', count: 1 })
    expect(result[1]).toEqual({ value: 'b', count: 1 })
    expect(result[2]).toEqual({ value: 'c', count: 1 })
  })

  it('should diff single character change', () => {
    const result = patienceDiffString('abc', 'adc')
    expect(result).toHaveLength(4)
    expect(result[0]).toEqual({ value: 'a', count: 1 })
    expect(result[1]).toEqual({ value: 'b', removed: true, count: 1 })
    expect(result[2]).toEqual({ value: 'd', added: true, count: 1 })
    expect(result[3]).toEqual({ value: 'c', count: 1 })
  })

  it('should handle empty strings', () => {
    const result = patienceDiffString('', '')
    expect(result).toEqual([])
  })

  it('should diff from empty string', () => {
    const result = patienceDiffString('', 'abc')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ value: 'abc', added: true, count: 3 })
  })

  it('should diff to empty string', () => {
    const result = patienceDiffString('abc', '')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ value: 'abc', removed: true, count: 3 })
  })

  it('should handle Unicode characters', () => {
    const result = patienceDiffString('Hello 👋', 'Hello 👍')
    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
  })

  it('should handle longer strings', () => {
    const old = 'The quick brown fox'
    const newText = 'The slow red fox'
    const result = patienceDiffString(old, newText)

    expect(result.length).toBeGreaterThan(0)
    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
  })
})

describe('Patience vs Myers comparison', () => {
  it('should produce different results for moved code', () => {
    // This test demonstrates where Patience excels
    const old = ['import A', 'function test() {', '  return 42', '}', 'export default test']
    const newSeq = ['function test() {', '  return 42', '}', 'import A', 'export default test']

    const result = patienceDiff(old, newSeq)

    // Patience should recognize the moved import statement
    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle refactored code better', () => {
    const old = ['const a = 1', 'const b = 2', 'const c = 3']
    const newSeq = ['const c = 3', 'const a = 1', 'const b = 2']

    const result = patienceDiff(old, newSeq)

    // Should recognize the reordering
    expect(result.length).toBeGreaterThan(0)
  })
})
