/**
 * Sentence-based diff implementation
 *
 * Compares text sentence by sentence
 */

import { myersDiff } from '../core/myers.js'
import { patienceDiff } from '../core/patience.js'
import { normalizeText } from '../core/common.js'
import type { DiffResult, DiffOptions } from '../types.js'
import { tokenizeSentences } from './tokenize.js'

/**
 * Diff two texts sentence by sentence
 *
 * Useful for comparing paragraphs or documents where you want
 * to see which sentences changed.
 *
 * @param oldText - Original text
 * @param newText - New text
 * @param options - Diff options
 * @returns Array of diff changes
 *
 * @example
 * ```typescript
 * const diff = diffSentences(
 *   'First sentence. Second sentence.',
 *   'First sentence. New sentence.'
 * )
 * // => [
 * //   { value: 'First sentence.', count: 1 },
 * //   { value: ' Second sentence.', removed: true, count: 1 },
 * //   { value: ' New sentence.', added: true, count: 1 }
 * // ]
 * ```
 */
export function diffSentences(
  oldText: string,
  newText: string,
  options?: DiffOptions
): DiffResult {
  // Tokenize into sentences
  const oldSentences = tokenizeSentences(oldText)
  const newSentences = tokenizeSentences(newText)

  // Create equality function based on options
  const equals = (a: string, b: string): boolean => {
    let aCompare = a
    let bCompare = b

    if (options?.ignoreWhitespace) {
      aCompare = normalizeText(a, true, false)
      bCompare = normalizeText(b, true, false)
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
    return patienceDiff(oldSentences, newSentences, equals)
  }
  if (algorithm === 'histogram') {
    throw new Error(
      'Histogram diff algorithm is not yet implemented. Use "myers" or "patience" instead.'
    )
  }
  return myersDiff(oldSentences, newSentences, equals)
}
