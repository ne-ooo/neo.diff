/**
 * Tests for Myers diff algorithm
 */

import { describe, it, expect } from 'vitest'
import { myersDiff, myersDiffString } from '../../src/core/myers.js'

describe('myersDiff', () => {
  describe('Edge cases', () => {
    it('should handle empty sequences', () => {
      const result = myersDiff([], [])
      expect(result).toEqual([])
    })

    it('should handle empty old sequence', () => {
      const result = myersDiff([], ['a', 'b', 'c'])
      expect(result).toEqual([
        {
          value: 'abc',
          added: true,
          count: 3,
        },
      ])
    })

    it('should handle empty new sequence', () => {
      const result = myersDiff(['a', 'b', 'c'], [])
      expect(result).toEqual([
        {
          value: 'abc',
          removed: true,
          count: 3,
        },
      ])
    })

    it('should handle identical sequences', () => {
      const result = myersDiff(['a', 'b', 'c'], ['a', 'b', 'c'])
      expect(result).toEqual([
        {
          value: 'abc',
          count: 3,
        },
      ])
    })
  })

  describe('Simple changes', () => {
    it('should detect single insertion', () => {
      const result = myersDiff(['a', 'b'], ['a', 'b', 'c'])
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ value: 'ab', count: 2 })
      expect(result[1]).toEqual({ value: 'c', added: true, count: 1 })
    })

    it('should detect single deletion', () => {
      const result = myersDiff(['a', 'b', 'c'], ['a', 'b'])
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ value: 'ab', count: 2 })
      expect(result[1]).toEqual({ value: 'c', removed: true, count: 1 })
    })

    it('should detect single substitution', () => {
      const result = myersDiff(['a', 'b', 'c'], ['a', 'd', 'c'])
      expect(result).toHaveLength(4)
      expect(result[0]).toEqual({ value: 'a', count: 1 })
      expect(result[1]).toEqual({ value: 'b', removed: true, count: 1 })
      expect(result[2]).toEqual({ value: 'd', added: true, count: 1 })
      expect(result[3]).toEqual({ value: 'c', count: 1 })
    })
  })

  describe('Complex changes', () => {
    it('should handle multiple insertions and deletions', () => {
      const result = myersDiff(['a', 'b', 'c', 'd'], ['a', 'x', 'c', 'y'])
      expect(result).toHaveLength(6)
      expect(result[0]).toEqual({ value: 'a', count: 1 })
      expect(result[1]).toEqual({ value: 'b', removed: true, count: 1 })
      expect(result[2]).toEqual({ value: 'x', added: true, count: 1 })
      expect(result[3]).toEqual({ value: 'c', count: 1 })
      expect(result[4]).toEqual({ value: 'd', removed: true, count: 1 })
      expect(result[5]).toEqual({ value: 'y', added: true, count: 1 })
    })

    it('should handle reordering', () => {
      const result = myersDiff(['a', 'b', 'c'], ['c', 'b', 'a'])
      // Order changes result in delete + insert pairs
      expect(result.some(c => c.removed)).toBe(true)
      expect(result.some(c => c.added)).toBe(true)
    })

    it('should handle complete replacement', () => {
      const result = myersDiff(['a', 'b', 'c'], ['x', 'y', 'z'])
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ value: 'abc', removed: true, count: 3 })
      expect(result[1]).toEqual({ value: 'xyz', added: true, count: 3 })
    })
  })

  describe('Custom equality function', () => {
    it('should use custom equality function', () => {
      const equals = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
      const result = myersDiff(['a', 'B', 'c'], ['A', 'b', 'C'], equals)
      expect(result).toEqual([
        {
          value: 'aBc',
          count: 3,
        },
      ])
    })

    it('should work with objects using custom equality', () => {
      interface Item {
        id: number
        name: string
      }

      const equals = (a: Item, b: Item) => a.id === b.id

      const result = myersDiff(
        [
          { id: 1, name: 'old' },
          { id: 2, name: 'same' },
        ],
        [
          { id: 1, name: 'new' },
          { id: 2, name: 'same' },
        ],
        equals
      )

      // Should treat items with same ID as equal
      expect(result).toHaveLength(1)
      expect(result[0]?.count).toBe(2)
    })
  })

  describe('Real-world examples', () => {
    it('should diff code lines', () => {
      const oldCode = ['function foo() {', '  return 1', '}']
      const newCode = ['function foo() {', '  return 2', '}']

      const result = myersDiff(oldCode, newCode)
      expect(result).toHaveLength(4)
      expect(result[0]).toEqual({ value: 'function foo() {', count: 1 })
      expect(result[1]).toEqual({ value: '  return 1', removed: true, count: 1 })
      expect(result[2]).toEqual({ value: '  return 2', added: true, count: 1 })
      expect(result[3]).toEqual({ value: '}', count: 1 })
    })

    it('should diff file changes', () => {
      const oldLines = [
        'line 1',
        'line 2',
        'line 3',
        'line 4',
      ]
      const newLines = [
        'line 1',
        'line 2 modified',
        'line 3',
        'line 4',
      ]

      const result = myersDiff(oldLines, newLines)
      expect(result.some(c => c.removed)).toBe(true)
      expect(result.some(c => c.added)).toBe(true)
    })
  })
})

describe('myersDiffString', () => {
  it('should diff single characters', () => {
    const result = myersDiffString('abc', 'adc')
    expect(result).toHaveLength(4)
    expect(result[0]).toEqual({ value: 'a', count: 1 })
    expect(result[1]).toEqual({ value: 'b', removed: true, count: 1 })
    expect(result[2]).toEqual({ value: 'd', added: true, count: 1 })
    expect(result[3]).toEqual({ value: 'c', count: 1 })
  })

  it('should handle empty strings', () => {
    expect(myersDiffString('', '')).toEqual([])
    expect(myersDiffString('', 'abc')).toEqual([
      { value: 'abc', added: true, count: 3 },
    ])
    expect(myersDiffString('abc', '')).toEqual([
      { value: 'abc', removed: true, count: 3 },
    ])
  })

  it('should handle identical strings', () => {
    const result = myersDiffString('hello', 'hello')
    expect(result).toEqual([
      { value: 'hello', count: 5 },
    ])
  })

  it('should handle complete difference', () => {
    const result = myersDiffString('abc', 'xyz')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ value: 'abc', removed: true, count: 3 })
    expect(result[1]).toEqual({ value: 'xyz', added: true, count: 3 })
  })

  it('should handle long strings', () => {
    const oldStr = 'The quick brown fox jumps over the lazy dog'
    const newStr = 'The quick red fox jumps over the sleepy dog'

    const result = myersDiffString(oldStr, newStr)
    // The diff operates on individual characters, so words won't be in single changes
    // Instead, check that we have both additions and removals
    expect(result.some(c => c.removed)).toBe(true)
    expect(result.some(c => c.added)).toBe(true)
    // Check that some parts are kept (like common characters)
    expect(result.some(c => !c.added && !c.removed)).toBe(true)
  })
})
