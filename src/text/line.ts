/**
 * Line-based diff implementation
 *
 * Most common diff operation - comparing text line by line
 */

import { myersDiff } from '../core/myers.js'
import { patienceDiff } from '../core/patience.js'
import { normalizeText } from '../core/common.js'
import type { DiffResult, DiffOptions } from '../types.js'
import { tokenizeLines } from './tokenize.js'

/**
 * Diff two texts line by line
 *
 * This is the most commonly used diff function, comparing text line-by-line.
 * Used by Git, testing frameworks, and most diff tools.
 *
 * @param oldText - Original text
 * @param newText - New text
 * @param options - Diff options
 * @returns Array of diff changes
 *
 * @example
 * ```typescript
 * const diff = diffLines('line 1\nline 2', 'line 1\nline 3')
 * // => [
 * //   { value: 'line 1\n', count: 1 },
 * //   { value: 'line 2', removed: true, count: 1 },
 * //   { value: 'line 3', added: true, count: 1 }
 * // ]
 * ```
 */
export function diffLines(
  oldText: string,
  newText: string,
  options?: DiffOptions
): DiffResult {
  // Normalize line endings if requested (\r\n and \r → \n)
  let oldProcessed = oldText
  let newProcessed = newText
  if (options?.normalizeLineEndings !== false) {
    oldProcessed = oldProcessed.replace(/\r\n?/g, '\n')
    newProcessed = newProcessed.replace(/\r\n?/g, '\n')
  }

  // Tokenize into lines
  const oldLines = tokenizeLines(oldProcessed)
  const newLines = tokenizeLines(newProcessed)

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
    return patienceDiff(oldLines, newLines, equals)
  }
  if (algorithm === 'histogram') {
    throw new Error(
      'Histogram diff algorithm is not yet implemented. Use "myers" or "patience" instead.'
    )
  }
  return myersDiff(oldLines, newLines, equals)
}

/**
 * Diff two texts line by line using Patience algorithm
 *
 * Produces more readable diffs, especially for code with moved sections
 *
 * @param oldText - Original text
 * @param newText - New text
 * @param options - Diff options
 * @returns Array of diff changes
 *
 * @example
 * ```typescript
 * const diff = diffLinesPatiently('line 1\nline 2', 'line 1\nline 3')
 * // More readable output for code with moved blocks
 * ```
 */
export function diffLinesPatiently(
  oldText: string,
  newText: string,
  options?: DiffOptions
): DiffResult {
  return diffLines(oldText, newText, { ...options, algorithm: 'patience' })
}

/**
 * Diff two texts line by line using Histogram algorithm
 *
 * @throws Error — histogram is not yet implemented
 */
export function diffLinesHistogram(
  oldText: string,
  newText: string,
  options?: DiffOptions
): DiffResult {
  return diffLines(oldText, newText, { ...options, algorithm: 'histogram' })
}
