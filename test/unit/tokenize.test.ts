/**
 * Tests for text tokenization utilities
 *
 * These 6 functions are exported from src/text/index.ts but previously had
 * zero direct test coverage (only exercised indirectly through higher-level functions).
 */

import { describe, it, expect } from 'vitest'
import {
  tokenizeLines,
  tokenizeWords,
  tokenizeChars,
  tokenizeSentences,
  stripNewline,
  joinTokens,
} from '../../src/text/index.js'

// ─── tokenizeLines ──────────────────────────────────────────────────────────

describe('tokenizeLines', () => {
  it('returns empty array for empty string', () => {
    expect(tokenizeLines('')).toEqual([])
  })

  it('splits on LF and preserves newlines in tokens', () => {
    expect(tokenizeLines('a\nb\nc')).toEqual(['a\n', 'b\n', 'c'])
  })

  it('handles trailing newline', () => {
    expect(tokenizeLines('a\nb\n')).toEqual(['a\n', 'b\n'])
  })

  it('handles CRLF (Windows line endings)', () => {
    expect(tokenizeLines('a\r\nb\r\nc')).toEqual(['a\r\n', 'b\r\n', 'c'])
  })

  it('handles bare CR (old Mac line endings)', () => {
    expect(tokenizeLines('a\rb\rc')).toEqual(['a\r', 'b\r', 'c'])
  })

  it('handles single line without newline', () => {
    expect(tokenizeLines('hello')).toEqual(['hello'])
  })

  it('handles mixed line endings', () => {
    expect(tokenizeLines('a\nb\r\nc\rd')).toEqual(['a\n', 'b\r\n', 'c\r', 'd'])
  })
})

// ─── tokenizeWords ──────────────────────────────────────────────────────────

describe('tokenizeWords', () => {
  it('returns empty array for empty string', () => {
    expect(tokenizeWords('')).toEqual([])
  })

  it('splits words and preserves whitespace as separate tokens', () => {
    expect(tokenizeWords('Hello world')).toEqual(['Hello', ' ', 'world'])
  })

  it('handles multiple spaces between words', () => {
    expect(tokenizeWords('a  b')).toEqual(['a', '  ', 'b'])
  })

  it('handles leading and trailing whitespace', () => {
    expect(tokenizeWords(' hi ')).toEqual([' ', 'hi', ' '])
  })

  it('handles tabs and mixed whitespace', () => {
    expect(tokenizeWords('a\tb')).toEqual(['a', '\t', 'b'])
  })

  it('handles single word', () => {
    expect(tokenizeWords('hello')).toEqual(['hello'])
  })
})

// ─── tokenizeChars ──────────────────────────────────────────────────────────

describe('tokenizeChars', () => {
  it('returns empty array for empty string', () => {
    expect(tokenizeChars('')).toEqual([])
  })

  it('splits ASCII text into individual characters', () => {
    expect(tokenizeChars('abc')).toEqual(['a', 'b', 'c'])
  })

  it('handles Unicode multi-byte characters (surrogate pairs)', () => {
    const result = tokenizeChars('A😀B')
    expect(result).toEqual(['A', '😀', 'B'])
  })

  it('preserves whitespace as character tokens', () => {
    expect(tokenizeChars('a b')).toEqual(['a', ' ', 'b'])
  })

  it('handles single character', () => {
    expect(tokenizeChars('x')).toEqual(['x'])
  })
})

// ─── tokenizeSentences ─────────────────────────────────────────────────────

describe('tokenizeSentences', () => {
  it('returns empty array for empty string', () => {
    expect(tokenizeSentences('')).toEqual([])
  })

  it('splits on period followed by space', () => {
    expect(tokenizeSentences('Hello. World.')).toEqual(['Hello.', ' World.'])
  })

  it('splits on exclamation mark', () => {
    expect(tokenizeSentences('Wow! Cool!')).toEqual(['Wow!', ' Cool!'])
  })

  it('splits on question mark', () => {
    expect(tokenizeSentences('Why? Because.')).toEqual(['Why?', ' Because.'])
  })

  it('keeps single sentence intact', () => {
    expect(tokenizeSentences('Hello world')).toEqual(['Hello world'])
  })

  it('handles period at end of string (no trailing space)', () => {
    expect(tokenizeSentences('Done.')).toEqual(['Done.'])
  })

  it('does not split on period without trailing space (e.g. abbreviation)', () => {
    expect(tokenizeSentences('Dr.Smith is here.')).toEqual(['Dr.Smith is here.'])
  })
})

// ─── stripNewline ───────────────────────────────────────────────────────────

describe('stripNewline', () => {
  it('removes trailing LF', () => {
    expect(stripNewline('hello\n')).toBe('hello')
  })

  it('removes trailing CRLF', () => {
    expect(stripNewline('hello\r\n')).toBe('hello')
  })

  it('does not modify string without trailing newline', () => {
    expect(stripNewline('hello')).toBe('hello')
  })

  it('does not remove newlines in the middle', () => {
    expect(stripNewline('a\nb\n')).toBe('a\nb')
  })

  it('handles empty string', () => {
    expect(stripNewline('')).toBe('')
  })
})

// ─── joinTokens ─────────────────────────────────────────────────────────────

describe('joinTokens', () => {
  it('joins tokens back into original text', () => {
    expect(joinTokens(['Hello', ' ', 'world'])).toBe('Hello world')
  })

  it('handles empty array', () => {
    expect(joinTokens([])).toBe('')
  })

  it('handles single token', () => {
    expect(joinTokens(['hello'])).toBe('hello')
  })

  it('round-trips with tokenizeLines', () => {
    const text = 'line 1\nline 2\nline 3'
    expect(joinTokens(tokenizeLines(text))).toBe(text)
  })

  it('round-trips with tokenizeWords', () => {
    const text = 'Hello  beautiful  world'
    expect(joinTokens(tokenizeWords(text))).toBe(text)
  })

  it('round-trips with tokenizeChars', () => {
    const text = 'abc😀def'
    expect(joinTokens(tokenizeChars(text))).toBe(text)
  })
})
