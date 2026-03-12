/**
 * Patience diff algorithm implementation
 *
 * The Patience algorithm is a preprocessing step that finds unique matching
 * lines first, then recursively applies Myers to the remaining regions.
 *
 * Benefits:
 * - Produces more intuitive/readable diffs
 * - Better for code with moved sections
 * - Handles common "gotchas" better than pure Myers
 *
 * Trade-offs:
 * - Slightly slower than Myers (but still fast)
 * - More complex implementation
 *
 * @see https://blog.jcoglan.com/2017/09/19/the-patience-diff-algorithm/
 */

import { myersDiff } from './myers.js'
import type { DiffResult, EqualityFn } from '../types.js'

/**
 * Patience diff algorithm for sequences
 *
 * @param oldSeq - Old sequence
 * @param newSeq - New sequence
 * @param equals - Equality comparison function
 * @returns Array of diff changes
 *
 * @example
 * ```typescript
 * const diff = patienceDiff(['a', 'b', 'c'], ['a', 'd', 'c'])
 * // Produces more readable output for code
 * ```
 */
export function patienceDiff<T>(
  oldSeq: T[],
  newSeq: T[],
  equals: EqualityFn<T> = (a, b) => a === b
): DiffResult {
  // Handle edge cases
  if (oldSeq.length === 0 && newSeq.length === 0) return []
  if (oldSeq.length === 0) {
    return [
      {
        value: newSeq.map(String).join(''),
        added: true,
        count: newSeq.length,
      },
    ]
  }
  if (newSeq.length === 0) {
    return [
      {
        value: oldSeq.map(String).join(''),
        removed: true,
        count: oldSeq.length,
      },
    ]
  }

  // Step 1: Find unique matching elements
  const uniqueMatches = findUniqueMatches(oldSeq, newSeq, equals)

  if (uniqueMatches.length === 0) {
    // No unique matches, fall back to Myers
    return myersDiff(oldSeq, newSeq, equals)
  }

  // Step 2: Find LCS of unique matches (using dynamic programming)
  const lcsMatches = findLCSOfMatches(uniqueMatches)

  // Step 3: Recursively diff regions between matches
  const changes: DiffResult = []
  let oldPos = 0
  let newPos = 0

  for (const match of lcsMatches) {
    // Diff the region before this match
    if (oldPos < match.oldIndex || newPos < match.newIndex) {
      const oldRegion = oldSeq.slice(oldPos, match.oldIndex)
      const newRegion = newSeq.slice(newPos, match.newIndex)

      // Recursively apply Myers to this region
      const regionDiff = myersDiff(oldRegion, newRegion, equals)
      changes.push(...regionDiff)
    }

    // Add the match itself (unchanged)
    changes.push({
      value: String(oldSeq[match.oldIndex]),
      count: 1,
    })

    oldPos = match.oldIndex + 1
    newPos = match.newIndex + 1
  }

  // Diff remaining region after last match
  if (oldPos < oldSeq.length || newPos < newSeq.length) {
    const oldRegion = oldSeq.slice(oldPos)
    const newRegion = newSeq.slice(newPos)
    const regionDiff = myersDiff(oldRegion, newRegion, equals)
    changes.push(...regionDiff)
  }

  return changes
}

/**
 * Find unique matching elements between two sequences
 *
 * An element is "unique" if it appears exactly once in each sequence.
 * These are the anchors for patience diff.
 *
 * @param oldSeq - Old sequence
 * @param newSeq - New sequence
 * @param equals - Equality comparison function
 * @returns Array of matching indices
 */
function findUniqueMatches<T>(
  oldSeq: T[],
  newSeq: T[],
  equals: EqualityFn<T>
): Array<{ oldIndex: number; newIndex: number; value: T }> {
  // Count occurrences in each sequence
  // Note: We use a simple array scan since we can't use Map with custom equality
  const oldCounts: Array<{ value: T; count: number }> = []
  const newCounts: Array<{ value: T; count: number }> = []

  // Count in old sequence
  for (const item of oldSeq) {
    const existing = oldCounts.find(c => equals(c.value, item))
    if (existing) {
      existing.count++
    } else {
      oldCounts.push({ value: item, count: 1 })
    }
  }

  // Count in new sequence
  for (const item of newSeq) {
    const existing = newCounts.find(c => equals(c.value, item))
    if (existing) {
      existing.count++
    } else {
      newCounts.push({ value: item, count: 1 })
    }
  }

  // Find unique matches (appears exactly once in each)
  const matches: Array<{ oldIndex: number; newIndex: number; value: T }> = []

  for (let i = 0; i < oldSeq.length; i++) {
    const item = oldSeq[i]!
    const oldCount = oldCounts.find(c => equals(c.value, item))
    const newCount = newCounts.find(c => equals(c.value, item))

    if (oldCount?.count === 1 && newCount?.count === 1) {
      // This item appears exactly once in each sequence
      const newIndex = newSeq.findIndex(x => equals(x, item))
      if (newIndex !== -1) {
        matches.push({ oldIndex: i, newIndex, value: item })
      }
    }
  }

  return matches
}

/**
 * Find LCS of matching indices
 *
 * Given unique matches, find the longest common subsequence of these matches
 * that maintains order in both sequences.
 *
 * @param matches - Array of unique matches
 * @returns LCS of matches
 */
function findLCSOfMatches(
  matches: Array<{ oldIndex: number; newIndex: number; value: any }>
): Array<{ oldIndex: number; newIndex: number }> {
  if (matches.length === 0) return []
  if (matches.length === 1) {
    return [{ oldIndex: matches[0]!.oldIndex, newIndex: matches[0]!.newIndex }]
  }

  // Use dynamic programming to find LCS
  // We want matches that are increasing in both oldIndex and newIndex
  const n = matches.length
  const dp: number[] = new Array(n).fill(1)
  const parent: number[] = new Array(n).fill(-1)

  // For each match, find the longest increasing subsequence ending at that match
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      // Check if match[i] can extend the sequence ending at match[j]
      if (
        matches[j]!.oldIndex < matches[i]!.oldIndex &&
        matches[j]!.newIndex < matches[i]!.newIndex
      ) {
        if (dp[j]! + 1 > dp[i]!) {
          dp[i] = dp[j]! + 1
          parent[i] = j
        }
      }
    }
  }

  // Find the longest sequence
  let maxLength = 0
  let maxIndex = 0
  for (let i = 0; i < n; i++) {
    if (dp[i]! > maxLength) {
      maxLength = dp[i]!
      maxIndex = i
    }
  }

  // Backtrack to build the sequence
  const lcs: Array<{ oldIndex: number; newIndex: number }> = []
  let current = maxIndex
  while (current !== -1) {
    lcs.unshift({
      oldIndex: matches[current]!.oldIndex,
      newIndex: matches[current]!.newIndex,
    })
    current = parent[current]!
  }

  return lcs
}

/**
 * Patience diff for strings
 *
 * Convenience function that operates on strings instead of arrays
 *
 * @param oldStr - Old string
 * @param newStr - New string
 * @returns Array of diff changes
 */
export function patienceDiffString(oldStr: string, newStr: string): DiffResult {
  return patienceDiff([...oldStr], [...newStr])
}
