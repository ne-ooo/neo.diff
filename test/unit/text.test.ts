/**
 * Tests for text diffing functions
 */

import { describe, it, expect } from 'vitest'
import {
  diffLines,
  diffLinesPatiently,
  diffLinesHistogram,
  diffWords,
  diffChars,
  diffSentences,
} from '../../src/text/index.js'

describe('diffLines', () => {
  it('should diff identical text', () => {
    const result = diffLines('line 1\nline 2', 'line 1\nline 2')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ value: 'line 1\nline 2', count: 2 })
  })

  it('should diff single line change', () => {
    const result = diffLines('line 1\nline 2', 'line 1\nline 3')
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ value: 'line 1\n', count: 1 })
    expect(result[1]).toEqual({ value: 'line 2', removed: true, count: 1 })
    expect(result[2]).toEqual({ value: 'line 3', added: true, count: 1 })
  })

  it('should diff added lines', () => {
    const result = diffLines('line 1', 'line 1\nline 2')
    expect(result.length).toBeGreaterThan(0)
    expect(result.some((c) => c.added)).toBe(true)
    // Verify the added content includes 'line 2'
    const addedContent = result.filter((c) => c.added).map((c) => c.value).join('')
    expect(addedContent).toContain('line 2')
  })

  it('should diff removed lines', () => {
    const result = diffLines('line 1\nline 2', 'line 1')
    expect(result.some((c) => c.removed)).toBe(true)
    // Verify the removed content includes 'line 2'
    const removedContent = result.filter((c) => c.removed).map((c) => c.value).join('')
    expect(removedContent).toContain('line 2')
  })

  it('should handle empty strings', () => {
    const result = diffLines('', '')
    expect(result).toEqual([])
  })

  it('should diff from empty', () => {
    const result = diffLines('', 'line 1')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ value: 'line 1', added: true, count: 1 })
  })

  it('should diff to empty', () => {
    const result = diffLines('line 1', '')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ value: 'line 1', removed: true, count: 1 })
  })

  it('should preserve line endings', () => {
    const result = diffLines('line 1\nline 2\n', 'line 1\nline 3\n')
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ value: 'line 1\n', count: 1 })
    expect(result[1]).toEqual({ value: 'line 2\n', removed: true, count: 1 })
    expect(result[2]).toEqual({ value: 'line 3\n', added: true, count: 1 })
  })

  it('should handle Windows line endings (normalized by default)', () => {
    const result = diffLines('line 1\r\nline 2', 'line 1\r\nline 3')
    expect(result).toHaveLength(3)
    // Line endings are normalized to \n by default
    expect(result[0]!.value).toBe('line 1\n')
    expect(result[1]!.removed).toBe(true)
    expect(result[2]!.added).toBe(true)
  })

  it('should preserve Windows line endings when normalizeLineEndings is false', () => {
    const result = diffLines('line 1\r\nline 2', 'line 1\r\nline 3', {
      normalizeLineEndings: false,
    })
    expect(result).toHaveLength(3)
    expect(result[0]!.value).toBe('line 1\r\n')
    expect(result[1]!.removed).toBe(true)
    expect(result[2]!.added).toBe(true)
  })

  it('should support ignoreWhitespace option', () => {
    const result = diffLines('line 1  ', 'line 1', { ignoreWhitespace: true })
    expect(result).toHaveLength(1)
    expect(result[0]!.count).toBe(1)
    expect(result[0]!.added).toBeUndefined()
    expect(result[0]!.removed).toBeUndefined()
  })

  it('should support ignoreCase option', () => {
    const result = diffLines('LINE 1', 'line 1', { ignoreCase: true })
    expect(result).toHaveLength(1)
    expect(result[0]!.count).toBe(1)
    expect(result[0]!.added).toBeUndefined()
    expect(result[0]!.removed).toBeUndefined()
  })

  it('should support both ignoreWhitespace and ignoreCase', () => {
    const result = diffLines('  LINE 1  ', 'line 1', {
      ignoreWhitespace: true,
      ignoreCase: true,
    })
    expect(result).toHaveLength(1)
    expect(result[0]!.count).toBe(1)
  })

  it('should diff multi-line changes', () => {
    const old = 'line 1\nline 2\nline 3'
    const newText = 'line 1\nmodified\nline 3'
    const result = diffLines(old, newText)

    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
    expect(result.some((c) => !c.added && !c.removed)).toBe(true)
  })

  it('should diff code blocks', () => {
    const old = 'function test() {\n  return 42\n}'
    const newText = 'function test() {\n  return 100\n}'
    const result = diffLines(old, newText)

    expect(result.some((c) => c.value.includes('function test()'))).toBe(true)
    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
    expect(result.some((c) => c.value === '}')).toBe(true)
  })
})

describe('diffLinesPatiently', () => {
  it('should produce readable diffs for moved code', () => {
    const old = 'A\nB\nC'
    const newText = 'B\nC\nA'
    const result = diffLinesPatiently(old, newText)

    // Patience should handle moved sections better
    expect(result.length).toBeGreaterThan(0)
    expect(result.some((c) => c.added || c.removed)).toBe(true)
  })

  it('should fall back to Myers when no unique matches', () => {
    const old = 'line\nline\nline'
    const newText = 'line\nline\nline\nline'
    const result = diffLinesPatiently(old, newText)

    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle empty strings', () => {
    const result = diffLinesPatiently('', '')
    expect(result).toEqual([])
  })

  it('should support options like diffLines', () => {
    const result = diffLinesPatiently('LINE 1', 'line 1', {
      ignoreCase: true,
    })
    expect(result).toHaveLength(1)
    expect(result[0]!.count).toBe(1)
  })
})

describe('diffWords', () => {
  it('should diff identical text', () => {
    const result = diffWords('hello world', 'hello world')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ value: 'hello world', count: 3 })
  })

  it('should diff single word change', () => {
    const result = diffWords('hello world', 'hello there')
    expect(result.some((c) => c.value.includes('hello'))).toBe(true)
    expect(result.some((c) => c.removed && c.value.includes('world'))).toBe(true)
    expect(result.some((c) => c.added && c.value.includes('there'))).toBe(true)
  })

  it('should preserve whitespace', () => {
    const result = diffWords('hello  world', 'hello world')
    expect(result.some((c) => c.value.includes(' '))).toBe(true)
  })

  it('should handle punctuation', () => {
    const result = diffWords('hello, world!', 'hello world')
    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
  })

  it('should handle empty strings', () => {
    const result = diffWords('', '')
    expect(result).toEqual([])
  })

  it('should diff from empty', () => {
    const result = diffWords('', 'hello')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ value: 'hello', added: true, count: 1 })
  })

  it('should diff to empty', () => {
    const result = diffWords('hello', '')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ value: 'hello', removed: true, count: 1 })
  })

  it('should support ignoreCase option', () => {
    const result = diffWords('HELLO world', 'hello world', {
      ignoreCase: true,
    })
    expect(result).toHaveLength(1)
    expect(result[0]!.count).toBe(3)
  })

  it('should handle multiple changes', () => {
    const old = 'the quick brown fox'
    const newText = 'the slow red fox'
    const result = diffWords(old, newText)

    expect(result.some((c) => c.value.includes('the'))).toBe(true)
    expect(result.some((c) => c.value.includes('fox'))).toBe(true)
    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
  })
})

describe('diffChars', () => {
  it('should diff identical text', () => {
    const result = diffChars('abc', 'abc')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ value: 'abc', count: 3 })
  })

  it('should diff single character change', () => {
    const result = diffChars('abc', 'adc')
    expect(result).toHaveLength(4)
    expect(result[0]).toEqual({ value: 'a', count: 1 })
    expect(result[1]).toEqual({ value: 'b', removed: true, count: 1 })
    expect(result[2]).toEqual({ value: 'd', added: true, count: 1 })
    expect(result[3]).toEqual({ value: 'c', count: 1 })
  })

  it('should handle empty strings', () => {
    const result = diffChars('', '')
    expect(result).toEqual([])
  })

  it('should diff from empty', () => {
    const result = diffChars('', 'abc')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ value: 'abc', added: true, count: 3 })
  })

  it('should diff to empty', () => {
    const result = diffChars('abc', '')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ value: 'abc', removed: true, count: 3 })
  })

  it('should handle Unicode characters', () => {
    const result = diffChars('Hello 👋', 'Hello 👍')
    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
  })

  it('should support ignoreCase option', () => {
    const result = diffChars('ABC', 'abc', { ignoreCase: true })
    expect(result).toHaveLength(1)
    expect(result[0]!.count).toBe(3)
  })

  it('should support ignoreWhitespace option', () => {
    const result = diffChars('a b c', 'abc', { ignoreWhitespace: true })
    expect(result).toHaveLength(1)
    expect(result[0]!.count).toBe(3)
  })

  it('should handle inserted characters', () => {
    const result = diffChars('ac', 'abc')
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ value: 'a', count: 1 })
    expect(result[1]).toEqual({ value: 'b', added: true, count: 1 })
    expect(result[2]).toEqual({ value: 'c', count: 1 })
  })

  it('should handle deleted characters', () => {
    const result = diffChars('abc', 'ac')
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ value: 'a', count: 1 })
    expect(result[1]).toEqual({ value: 'b', removed: true, count: 1 })
    expect(result[2]).toEqual({ value: 'c', count: 1 })
  })
})

describe('diffSentences', () => {
  it('should diff identical text', () => {
    const text = 'Hello. How are you?'
    const result = diffSentences(text, text)
    expect(result).toHaveLength(1)
    expect(result[0]!.count).toBe(2)
  })

  it('should diff single sentence change', () => {
    const old = 'Hello. How are you?'
    const newText = 'Hello. How are you doing?'
    const result = diffSentences(old, newText)

    expect(result.length).toBeGreaterThan(1)
    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
  })

  it('should handle multiple sentences', () => {
    const old = 'First. Second. Third.'
    const newText = 'First. Modified. Third.'
    const result = diffSentences(old, newText)

    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
  })

  it('should handle empty strings', () => {
    const result = diffSentences('', '')
    expect(result).toEqual([])
  })

  it('should handle exclamation and question marks', () => {
    const old = 'Hello! How are you?'
    const newText = 'Hi! How are you doing?'
    const result = diffSentences(old, newText)

    expect(result.length).toBeGreaterThan(0)
  })

  it('should support ignoreCase option', () => {
    const result = diffSentences('HELLO.', 'hello.', { ignoreCase: true })
    expect(result).toHaveLength(1)
    expect(result[0]!.count).toBe(1)
  })

  it('should diff added sentences', () => {
    const old = 'First.'
    const newText = 'First. Second.'
    const result = diffSentences(old, newText)

    expect(result.some((c) => c.added)).toBe(true)
  })

  it('should diff removed sentences', () => {
    const old = 'First. Second.'
    const newText = 'First.'
    const result = diffSentences(old, newText)

    expect(result.some((c) => c.removed)).toBe(true)
  })
})

describe('diffLinesHistogram', () => {
  // Histogram algorithm is not yet implemented — it now throws an explicit error.
  it('throws because histogram is not yet implemented', () => {
    expect(() => diffLinesHistogram('line 1', 'line 2')).toThrow(
      'Histogram diff algorithm is not yet implemented'
    )
  })
})
