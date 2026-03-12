/**
 * Myers diff algorithm implementation
 *
 * Based on "An O(ND) Difference Algorithm and Its Variations" (Eugene W. Myers, 1986)
 *
 * This is the most widely used diff algorithm, implemented in Git and many other tools.
 * It finds the shortest edit script (SES) to transform one sequence into another.
 *
 * Time complexity: O((N+M)D) where N and M are input lengths, D is edit distance
 * Space complexity: O(N+M)
 *
 * @see http://www.xmailserver.org/diff2.pdf
 */

import type { DiffChange, DiffResult, EqualityFn } from '../types.js'

/**
 * Myers diff algorithm for sequences
 *
 * Finds the shortest edit script to transform oldSeq into newSeq.
 *
 * @param oldSeq - Old sequence
 * @param newSeq - New sequence
 * @param equals - Equality comparison function
 * @returns Array of diff changes
 *
 * @example
 * ```typescript
 * const diff = myersDiff(['a', 'b', 'c'], ['a', 'd', 'c'])
 * // => [
 * //   { value: 'a', count: 1 },
 * //   { value: 'b', removed: true, count: 1 },
 * //   { value: 'd', added: true, count: 1 },
 * //   { value: 'c', count: 1 }
 * // ]
 * ```
 */
export function myersDiff<T>(
  oldSeq: T[],
  newSeq: T[],
  equals: EqualityFn<T> = (a, b) => a === b
): DiffResult {
  const n = oldSeq.length
  const m = newSeq.length

  // Handle edge cases
  if (n === 0 && m === 0) return []
  if (n === 0) {
    return [
      {
        value: newSeq.map(String).join(''),
        added: true,
        count: m,
      },
    ]
  }
  if (m === 0) {
    return [
      {
        value: oldSeq.map(String).join(''),
        removed: true,
        count: n,
      },
    ]
  }

  const max = n + m
  const vForward: number[] = new Array(2 * max + 1)
  const vReverse: number[] = new Array(2 * max + 1)
  vForward[max + 1] = 0
  vReverse[max + 1] = 0

  // Trace stores the V arrays for each iteration
  const trace: number[][] = []

  // Find the shortest edit script
  for (let d = 0; d <= max; d++) {
    // Store V for this iteration
    trace.push([...vForward])

    // Forward search
    for (let k = -d; k <= d; k += 2) {
      let x: number

      // Decide whether to move down (insert) or right (delete)
      if (k === -d || (k !== d && vForward[max + k - 1]! < vForward[max + k + 1]!)) {
        // Move right (delete from old)
        x = vForward[max + k + 1]!
      } else {
        // Move down (insert from new)
        x = vForward[max + k - 1]! + 1
      }

      let y = x - k

      // Follow diagonal as far as possible (matching elements)
      while (x < n && y < m && equals(oldSeq[x]!, newSeq[y]!)) {
        x++
        y++
      }

      vForward[max + k] = x

      // Check if we've reached the end
      if (x >= n && y >= m) {
        return buildPath(trace, oldSeq, newSeq)
      }
    }
  }

  // Should never reach here for valid inputs
  return []
}

/**
 * Build diff path from Myers trace
 *
 * Backtrack through the trace to reconstruct the edit script.
 *
 * @param trace - Array of V vectors from forward search
 * @param oldSeq - Old sequence
 * @param newSeq - New sequence
 * @returns Array of diff changes
 */
function buildPath<T>(
  trace: number[][],
  oldSeq: T[],
  newSeq: T[]
): DiffResult {
  const n = oldSeq.length
  const m = newSeq.length
  const max = n + m

  let x = n
  let y = m

  const path: Array<{ x: number; y: number; type: 'keep' | 'insert' | 'delete' }> = []

  // Backtrack through trace
  for (let d = trace.length - 1; d >= 0; d--) {
    const v = trace[d]!
    const k = x - y

    let prevK: number
    if (k === -d || (k !== d && v[max + k - 1]! < v[max + k + 1]!)) {
      prevK = k + 1
    } else {
      prevK = k - 1
    }

    const prevX = v[max + prevK]!
    const prevY = prevX - prevK

    // Follow diagonal back
    while (x > prevX && y > prevY) {
      path.unshift({ x: x - 1, y: y - 1, type: 'keep' })
      x--
      y--
    }

    // Record the edit operation
    if (d > 0) {
      if (x > prevX) {
        path.unshift({ x: prevX, y: prevY, type: 'delete' })
      } else {
        path.unshift({ x: prevX, y: prevY, type: 'insert' })
      }
      x = prevX
      y = prevY
    }
  }

  // Convert path to diff changes
  return pathToChanges(path, oldSeq, newSeq)
}

/**
 * Convert edit path to DiffChange array
 *
 * Merges consecutive operations of the same type
 *
 * @param path - Edit path from backtracking
 * @param oldSeq - Old sequence
 * @param newSeq - New sequence
 * @returns Array of diff changes
 */
function pathToChanges<T>(
  path: Array<{ x: number; y: number; type: 'keep' | 'insert' | 'delete' }>,
  oldSeq: T[],
  newSeq: T[]
): DiffResult {
  const changes: DiffChange[] = []
  let i = 0

  while (i < path.length) {
    const op = path[i]!
    let count = 0
    const values: string[] = []

    if (op.type === 'keep') {
      // Collect all consecutive keeps
      while (i < path.length && path[i]!.type === 'keep') {
        values.push(String(oldSeq[path[i]!.x]))
        count++
        i++
      }
      changes.push({
        value: values.join(''),
        count,
      })
    } else if (op.type === 'delete') {
      // Collect all consecutive deletes
      while (i < path.length && path[i]!.type === 'delete') {
        values.push(String(oldSeq[path[i]!.x]))
        count++
        i++
      }
      changes.push({
        value: values.join(''),
        removed: true,
        count,
      })
    } else if (op.type === 'insert') {
      // Collect all consecutive inserts
      while (i < path.length && path[i]!.type === 'insert') {
        values.push(String(newSeq[path[i]!.y]))
        count++
        i++
      }
      changes.push({
        value: values.join(''),
        added: true,
        count,
      })
    }
  }

  return changes
}

/**
 * Myers diff for strings
 *
 * Convenience function that operates on strings instead of arrays.
 *
 * @param oldStr - Old string
 * @param newStr - New string
 * @returns Array of diff changes
 *
 * @example
 * ```typescript
 * const diff = myersDiffString('abc', 'adc')
 * // => [
 * //   { value: 'a', count: 1 },
 * //   { value: 'b', removed: true, count: 1 },
 * //   { value: 'd', added: true, count: 1 },
 * //   { value: 'c', count: 1 }
 * // ]
 * ```
 */
export function myersDiffString(oldStr: string, newStr: string): DiffResult {
  return myersDiff([...oldStr], [...newStr])
}
