/**
 * Character-based diff implementation
 *
 * Finest-grained diff - compares character by character
 */

import { myersDiff, myersDiffString } from '../core/myers.js'
import { patienceDiff } from '../core/patience.js'
import { normalizeText } from '../core/common.js'
import type { DiffResult, DiffOptions } from '../types.js'
import { tokenizeChars } from './tokenize.js'

/**
 * Diff two texts character by character
 *
 * Finest-grained diff showing exactly which characters changed.
 * Most useful for short strings or when you need precise differences.
 *
 * @param oldText - Original text
 * @param newText - New text
 * @param options - Diff options
 * @returns Array of diff changes
 *
 * @example
 * ```typescript
 * const diff = diffChars('abc', 'adc')
 * // => [
 * //   { value: 'a', count: 1 },
 * //   { value: 'b', removed: true, count: 1 },
 * //   { value: 'd', added: true, count: 1 },
 * //   { value: 'c', count: 1 }
 * // ]
 * ```
 */
export function diffChars(
  oldText: string,
  newText: string,
  options?: DiffOptions
): DiffResult {
  // Apply options to text before diffing
  let oldProcessed = oldText
  let newProcessed = newText

  if (options?.ignoreWhitespace) {
    oldProcessed = normalizeText(oldProcessed, true, false)
    newProcessed = normalizeText(newProcessed, true, false)
  }

  if (options?.ignoreCase) {
    oldProcessed = normalizeText(oldProcessed, false, true)
    newProcessed = normalizeText(newProcessed, false, true)
  }

  // Dispatch to selected algorithm
  const algorithm = options?.algorithm ?? 'myers'
  if (algorithm === 'patience') {
    const oldChars = tokenizeChars(oldProcessed)
    const newChars = tokenizeChars(newProcessed)
    return patienceDiff(oldChars, newChars)
  }
  if (algorithm === 'histogram') {
    throw new Error(
      'Histogram diff algorithm is not yet implemented. Use "myers" or "patience" instead.'
    )
  }
  // Use the optimized string diff from Myers
  return myersDiffString(oldProcessed, newProcessed)
}
