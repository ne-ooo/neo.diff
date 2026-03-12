/**
 * Text tokenization utilities
 *
 * Functions for splitting text into lines, words, characters, and sentences
 */

/**
 * Tokenize text into lines
 *
 * Preserves line endings in the tokens for accurate reconstruction
 *
 * @param text - Text to tokenize
 * @returns Array of lines (with line endings)
 *
 * @example
 * ```typescript
 * tokenizeLines('line 1\nline 2\nline 3')
 * // => ['line 1\n', 'line 2\n', 'line 3']
 * ```
 */
export function tokenizeLines(text: string): string[] {
  if (!text) return []

  const lines: string[] = []
  let current = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!
    current += char

    // Check for line ending
    if (char === '\n') {
      lines.push(current)
      current = ''
    } else if (char === '\r') {
      // Handle \r\n (Windows) or just \r (old Mac)
      if (text[i + 1] === '\n') {
        current += '\n'
        i++ // Skip the \n
      }
      lines.push(current)
      current = ''
    }
  }

  // Don't forget the last line (if no trailing newline)
  if (current) {
    lines.push(current)
  }

  return lines
}

/**
 * Tokenize text into words
 *
 * Preserves whitespace as separate tokens for accurate reconstruction
 *
 * @param text - Text to tokenize
 * @returns Array of words and whitespace
 *
 * @example
 * ```typescript
 * tokenizeWords('Hello world')
 * // => ['Hello', ' ', 'world']
 * ```
 */
export function tokenizeWords(text: string): string[] {
  if (!text) return []

  // Match words (non-whitespace) and whitespace separately
  // This preserves the exact spacing
  const tokens = text.match(/\S+|\s+/g) || []
  return tokens
}

/**
 * Tokenize text into characters
 *
 * Handles Unicode properly using spread operator
 *
 * @param text - Text to tokenize
 * @returns Array of characters (including multi-byte Unicode)
 *
 * @example
 * ```typescript
 * tokenizeChars('abc')
 * // => ['a', 'b', 'c']
 *
 * tokenizeChars('👍🏻')
 * // => ['👍', '🏻'] (skin tone modifier is separate)
 * ```
 */
export function tokenizeChars(text: string): string[] {
  if (!text) return []

  // Use Intl.Segmenter for proper grapheme cluster splitting (Node 16+)
  // This correctly handles emoji with skin tones, ZWJ sequences, combining accents
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    return Array.from(segmenter.segment(text), (s) => s.segment)
  }

  // Fallback: spread operator handles surrogate pairs but not grapheme clusters
  return [...text]
}

/**
 * Tokenize text into sentences
 *
 * Splits on sentence-ending punctuation (., !, ?)
 *
 * @param text - Text to tokenize
 * @returns Array of sentences
 *
 * @example
 * ```typescript
 * tokenizeSentences('Hello. How are you?')
 * // => ['Hello.', ' How are you?']
 * ```
 */
export function tokenizeSentences(text: string): string[] {
  if (!text) return []

  // Split on sentence boundaries (. ! ?) followed by space or end
  // Keep the punctuation with the sentence
  const sentences: string[] = []
  let current = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!
    current += char

    // Check if this is a sentence ending
    if (char === '.' || char === '!' || char === '?') {
      // Look ahead: if followed by space or end, this is a sentence boundary
      const next = text[i + 1]
      if (!next || next === ' ' || next === '\n') {
        sentences.push(current)
        current = ''
      }
    }
  }

  // Don't forget remaining text
  if (current) {
    sentences.push(current)
  }

  return sentences.length > 0 ? sentences : [text]
}

/**
 * Remove trailing newline from a line
 *
 * Useful when you want to compare line content without line endings
 *
 * @param line - Line with possible newline
 * @returns Line without newline
 */
export function stripNewline(line: string): string {
  return line.replace(/\r?\n$/, '')
}

/**
 * Join tokens back into text
 *
 * Simple utility to reconstruct text from tokens
 *
 * @param tokens - Array of tokens
 * @returns Joined text
 */
export function joinTokens(tokens: string[]): string {
  return tokens.join('')
}
