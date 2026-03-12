/**
 * Array diff implementation
 *
 * Compares arrays element by element with custom equality
 */

import { myersDiff } from '../core/myers.js'
import type { DiffResult, EqualityFn } from '../types.js'

/**
 * Diff two arrays element by element
 *
 * Uses Myers algorithm to find the minimal edit script.
 * Supports custom equality function for complex element types.
 *
 * @param oldArray - Original array
 * @param newArray - New array
 * @param equals - Optional custom equality function
 * @returns Array of diff changes
 *
 * @example
 * ```typescript
 * const diff = diffArrays([1, 2, 3], [1, 2, 4])
 * // => [
 * //   { value: '1', count: 1 },
 * //   { value: '2', count: 1 },
 * //   { value: '3', removed: true, count: 1 },
 * //   { value: '4', added: true, count: 1 }
 * // ]
 * ```
 *
 * @example With custom equality
 * ```typescript
 * const users = [
 *   { id: 1, name: 'John' },
 *   { id: 2, name: 'Jane' }
 * ]
 * const newUsers = [
 *   { id: 1, name: 'John' },
 *   { id: 3, name: 'Bob' }
 * ]
 * const diff = diffArrays(users, newUsers, (a, b) => a.id === b.id)
 * ```
 */
export function diffArrays<T>(
  oldArray: T[],
  newArray: T[],
  equals?: EqualityFn<T>
): DiffResult {
  return myersDiff(oldArray, newArray, equals)
}

/**
 * Diff two arrays of primitives (shorthand)
 *
 * @param oldArray - Original array
 * @param newArray - New array
 * @returns Array of diff changes
 */
export function diffPrimitiveArrays<T extends string | number | boolean>(
  oldArray: T[],
  newArray: T[]
): DiffResult {
  return myersDiff(oldArray, newArray)
}
