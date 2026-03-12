/**
 * JSON diff implementation
 *
 * Compares JSON objects by stringifying and diffing line by line
 */

import { diffLines } from '../text/line.js'
import type { DiffResult, DiffOptions } from '../types.js'

/**
 * Options for JSON diffing
 */
export interface JsonDiffOptions extends DiffOptions {
  /**
   * Sort object keys before comparison (default: true)
   * When true, `{a:1, b:2}` and `{b:2, a:1}` are considered equal.
   */
  sortKeys?: boolean
}

/**
 * Custom JSON replacer that handles non-serializable types
 */
function smartReplacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') {
    return `[BigInt: ${value.toString()}]`
  }
  if (typeof value === 'function') {
    return `[Function: ${value.name || 'anonymous'}]`
  }
  if (typeof value === 'symbol') {
    return `[Symbol: ${value.description ?? ''}]`
  }
  if (typeof value === 'undefined') {
    return '[undefined]'
  }
  return value
}

/**
 * Recursively sort object keys for order-independent comparison
 */
function sortObjectKeys(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(sortObjectKeys)
  }

  if (value instanceof Date || value instanceof RegExp) {
    return value
  }

  const sorted: Record<string, unknown> = {}
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = sortObjectKeys((value as Record<string, unknown>)[key])
  }
  return sorted
}

/**
 * Stringify a value for diffing with smart handling
 */
function smartStringify(value: unknown, sortKeys: boolean): string {
  const processed = sortKeys ? sortObjectKeys(value) : value
  return JSON.stringify(processed, smartReplacer, 2)
}

/**
 * Diff two JSON-serializable values
 *
 * Stringifies the values with pretty-printing and diffs line by line.
 * Useful for comparing configuration objects, API responses, etc.
 *
 * Handles non-serializable types (functions, undefined, symbols, BigInt)
 * by converting them to tagged strings instead of silently dropping them.
 *
 * Object keys are sorted by default for order-independent comparison.
 *
 * @param oldValue - Original value
 * @param newValue - New value
 * @param options - Diff options (extends DiffOptions with sortKeys)
 * @returns Array of diff changes
 *
 * @example
 * ```typescript
 * const diff = diffJson(
 *   { name: 'John', age: 30 },
 *   { name: 'John', age: 31 }
 * )
 * // Shows which JSON lines changed
 * ```
 */
export function diffJson(
  oldValue: unknown,
  newValue: unknown,
  options?: JsonDiffOptions
): DiffResult {
  const sortKeys = options?.sortKeys !== false

  // Stringify with smart replacer and optional key sorting
  const oldText = smartStringify(oldValue, sortKeys)
  const newText = smartStringify(newValue, sortKeys)

  // Diff the stringified JSON line by line
  return diffLines(oldText, newText, options)
}

/**
 * Options for JSON string diffing
 */
export interface JsonStringDiffOptions extends JsonDiffOptions {
  /**
   * When true, throw on invalid JSON instead of falling back to string diff (default: false)
   */
  strict?: boolean
}

/**
 * Diff two JSON strings
 *
 * Parses the JSON strings and diffs them.
 *
 * @param oldJson - Original JSON string
 * @param newJson - New JSON string
 * @param options - Diff options (extends JsonDiffOptions with strict)
 * @returns Array of diff changes
 *
 * @example
 * ```typescript
 * const diff = diffJsonString(
 *   '{"name":"John","age":30}',
 *   '{"name":"John","age":31}'
 * )
 * ```
 */
export function diffJsonString(
  oldJson: string,
  newJson: string,
  options?: JsonStringDiffOptions
): DiffResult {
  try {
    const oldValue = JSON.parse(oldJson)
    const newValue = JSON.parse(newJson)
    return diffJson(oldValue, newValue, options)
  } catch (error) {
    if (options?.strict) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Invalid JSON input: ${message}`)
    }
    // If parsing fails, fall back to string diff
    return diffLines(oldJson, newJson, options)
  }
}
