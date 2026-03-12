/**
 * Word-based diff implementation
 *
 * Compares text word by word
 */

import { myersDiff } from '../core/myers.js'
import { patienceDiff } from '../core/patience.js'
import { normalizeText } from '../core/common.js'
import type { DiffResult, DiffOptions } from '../types.js'
import { tokenizeWords } from './tokenize.js'

/**
 * Diff two texts word by word
 *
 * Useful for comparing sentences or paragraphs where you want
 * to see which words changed, not which characters.
 *
 * @param oldText - Original text
 * @param newText - New text
 * @param options - Diff options
 * @returns Array of diff changes
 *
 * @example
 * ```typescript
 * const diff = diffWords('Hello world', 'Hello there')
 * // => [
 * //   { value: 'Hello', count: 1 },
 * //   { value: ' ', count: 1 },
 * //   { value: 'world', removed: true, count: 1 },
 * //   { value: 'there', added: true, count: 1 }
 * // ]
 * ```
 */
export function diffWords(
  oldText: string,
  newText: string,
  options?: DiffOptions
): DiffResult {
  // Tokenize into words
  const oldWords = tokenizeWords(oldText)
  const newWords = tokenizeWords(newText)

  // Create equality function based on options
  const equals = (a: string, b: string): boolean => {
    let aCompare = a
    let bCompare = b

    if (options?.ignoreWhitespace) {
      aCompare = normalizeText(a, true, false)
      bCompare = normalizeText(b, true, false)
      // If both are empty after stripping whitespace, consider them equal
      if (!aCompare && !bCompare) return true
    }

    if (options?.ignoreCase) {
      aCompare = normalizeText(aCompare, false, true)
      bCompare = normalizeText(bCompare, false, true)
    }

    return aCompare === bCompare
  }

  // Dispatch to selected algorithm
  const algorithm = options?.algorithm ?? 'myers'
  if (algorithm === 'patience') {
    return patienceDiff(oldWords, newWords, equals)
  }
  if (algorithm === 'histogram') {
    throw new Error(
      'Histogram diff algorithm is not yet implemented. Use "myers" or "patience" instead.'
    )
  }
  return myersDiff(oldWords, newWords, equals)
}
