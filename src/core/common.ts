/**
 * Common diff utilities
 *
 * Shared functions used across different diff algorithms
 */

import type { EqualityFn, DiffChange } from '../types.js'

/**
 * Longest Common Subsequence (LCS) using dynamic programming
 *
 * Time complexity: O(n * m)
 * Space complexity: O(n * m)
 *
 * @param oldSeq - Old sequence
 * @param newSeq - New sequence
 * @param equals - Equality comparison function
 * @returns Length matrix for backtracking
 */
export function computeLCS<T>(
  oldSeq: T[],
  newSeq: T[],
  equals: EqualityFn<T> = (a, b) => a === b
): number[][] {
  const n = oldSeq.length
  const m = newSeq.length

  // Create DP table
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(0)
  )

  // Fill DP table
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (equals(oldSeq[i - 1]!, newSeq[j - 1]!)) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!)
      }
    }
  }

  return dp
}

/**
 * Backtrack LCS to find actual common subsequence
 *
 * @param dp - DP table from computeLCS
 * @param oldSeq - Old sequence
 * @param newSeq - New sequence
 * @param equals - Equality comparison function
 * @returns Indices of matching elements in old and new sequences
 */
export function backtrackLCS<T>(
  dp: number[][],
  oldSeq: T[],
  newSeq: T[],
  equals: EqualityFn<T> = (a, b) => a === b
): Array<{ oldIndex: number; newIndex: number }> {
  const matches: Array<{ oldIndex: number; newIndex: number }> = []
  let i = oldSeq.length
  let j = newSeq.length

  while (i > 0 && j > 0) {
    if (equals(oldSeq[i - 1]!, newSeq[j - 1]!)) {
      matches.unshift({ oldIndex: i - 1, newIndex: j - 1 })
      i--
      j--
    } else if (dp[i - 1]![j]! > dp[i]![j - 1]!) {
      i--
    } else {
      j--
    }
  }

  return matches
}

/**
 * Convert edit operations to DiffChange array
 *
 * Merges consecutive operations of the same type into single changes
 *
 * @param oldSeq - Old sequence
 * @param newSeq - New sequence
 * @param matches - Matching indices from LCS
 * @returns Array of diff changes
 */
export function buildChangesFromMatches<T>(
  oldSeq: T[],
  newSeq: T[],
  matches: Array<{ oldIndex: number; newIndex: number }>
): DiffChange[] {
  const changes: DiffChange[] = []
  let oldPos = 0
  let newPos = 0

  for (const match of matches) {
    // Add deletions before this match
    if (oldPos < match.oldIndex) {
      const deleted = oldSeq.slice(oldPos, match.oldIndex)
      changes.push({
        value: deleted.join(''),
        removed: true,
        count: deleted.length,
      })
    }

    // Add insertions before this match
    if (newPos < match.newIndex) {
      const inserted = newSeq.slice(newPos, match.newIndex)
      changes.push({
        value: inserted.join(''),
        added: true,
        count: inserted.length,
      })
    }

    // Add the match (unchanged)
    changes.push({
      value: String(oldSeq[match.oldIndex]),
      count: 1,
    })

    oldPos = match.oldIndex + 1
    newPos = match.newIndex + 1
  }

  // Add remaining deletions
  if (oldPos < oldSeq.length) {
    const deleted = oldSeq.slice(oldPos)
    changes.push({
      value: deleted.join(''),
      removed: true,
      count: deleted.length,
    })
  }

  // Add remaining insertions
  if (newPos < newSeq.length) {
    const inserted = newSeq.slice(newPos)
    changes.push({
      value: inserted.join(''),
      added: true,
      count: inserted.length,
    })
  }

  return changes
}

/**
 * Merge consecutive changes of the same type
 *
 * Combines adjacent additions or deletions into single changes
 *
 * @param changes - Array of diff changes
 * @returns Merged array of changes
 */
export function mergeConsecutiveChanges(changes: DiffChange[]): DiffChange[] {
  if (changes.length === 0) return []

  const merged: DiffChange[] = []
  let current = changes[0]!

  for (let i = 1; i < changes.length; i++) {
    const next = changes[i]!

    // Check if we can merge (same type)
    const canMerge =
      (current.added && next.added && !next.removed) ||
      (current.removed && next.removed && !next.added) ||
      (!current.added && !current.removed && !next.added && !next.removed)

    if (canMerge) {
      // Merge
      current = {
        value: current.value + next.value,
        added: current.added,
        removed: current.removed,
        count: (current.count || 0) + (next.count || 0),
      }
    } else {
      // Push current and start new
      merged.push(current)
      current = next
    }
  }

  // Don't forget the last one
  merged.push(current)

  return merged
}

/**
 * Calculate edit distance (Levenshtein distance)
 *
 * Number of single-character edits needed to transform one string into another
 *
 * @param oldStr - Old string
 * @param newStr - New string
 * @returns Edit distance
 */
export function editDistance(oldStr: string, newStr: string): number {
  const m = oldStr.length
  const n = newStr.length

  // Create DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  )

  // Initialize base cases
  for (let i = 0; i <= m; i++) dp[i]![0] = i
  for (let j = 0; j <= n; j++) dp[0]![j] = j

  // Fill DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldStr[i - 1] === newStr[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]!
      } else {
        dp[i]![j] =
          1 +
          Math.min(
            dp[i - 1]![j]!, // deletion
            dp[i]![j - 1]!, // insertion
            dp[i - 1]![j - 1]! // substitution
          )
      }
    }
  }

  return dp[m]![n]!
}

/**
 * Calculate similarity score between two strings
 *
 * Returns value between 0 (completely different) and 1 (identical)
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score (0-1)
 */
export function similarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1 // Both empty strings are identical

  const distance = editDistance(str1, str2)
  return 1 - distance / maxLen
}

/**
 * Normalize text for comparison
 *
 * @param text - Text to normalize
 * @param ignoreWhitespace - Remove all whitespace
 * @param ignoreCase - Convert to lowercase
 * @returns Normalized text
 */
export function normalizeText(
  text: string,
  ignoreWhitespace: boolean = false,
  ignoreCase: boolean = false
): string {
  let normalized = text

  if (ignoreWhitespace) {
    normalized = normalized.replace(/\s+/g, '')
  }

  if (ignoreCase) {
    normalized = normalized.toLowerCase()
  }

  return normalized
}
