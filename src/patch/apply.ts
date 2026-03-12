/**
 * Patch application
 *
 * Apply unified diff patches to strings
 */

import type { ParsedPatch, PatchResult, Hunk } from '../types.js'
import { parsePatch } from './parse.js'

/**
 * Options for patch application
 */
export interface ApplyPatchOptions {
  /**
   * Fuzz factor — shorthand for both maxOffset and maxContextMismatch (default: 0)
   */
  fuzzFactor?: number

  /**
   * Maximum line offset to search for hunk position (default: fuzzFactor)
   */
  maxOffset?: number

  /**
   * Maximum number of context line mismatches to tolerate (default: fuzzFactor)
   */
  maxContextMismatch?: number
}

/**
 * Apply patch to a string, returning diagnostic result
 *
 * @param source - Original string
 * @param patch - Parsed patch or patch string
 * @param options - Application options
 * @returns PatchResult with success/failure info and diagnostics
 *
 * @example
 * ```typescript
 * const original = 'line 1\nline 2\nline 3'
 * const patch = '--- file.txt\n+++ file.txt\n@@ -1,3 +1,3 @@\n line 1\n-line 2\n+modified\n line 3'
 * const result = applyPatch(original, patch)
 * // => { success: true, content: 'line 1\nmodified\nline 3', appliedHunks: 1, totalHunks: 1 }
 * ```
 */
export function applyPatch(
  source: string,
  patch: ParsedPatch | string,
  options?: ApplyPatchOptions
): PatchResult {
  const fuzz = options?.fuzzFactor ?? 0
  const maxOffset = options?.maxOffset ?? fuzz
  const maxContextMismatch = options?.maxContextMismatch ?? fuzz

  // Parse patch if it's a string
  const parsedPatch =
    typeof patch === 'string' ? parsePatch(patch)[0] : patch

  if (!parsedPatch) {
    return {
      success: false,
      content: source,
      rejected: ['No valid patch found'],
      appliedHunks: 0,
      totalHunks: 0,
    }
  }

  // Split source into lines
  const sourceLines = source.split('\n')
  let result: string[] = [...sourceLines]
  const rejected: string[] = []
  let appliedHunks = 0
  const totalHunks = parsedPatch.hunks.length

  // Apply hunks in reverse order (to preserve line numbers)
  const hunks = [...parsedPatch.hunks].reverse()

  for (let i = 0; i < hunks.length; i++) {
    const hunk = hunks[i]!
    const hunkIndex = totalHunks - i // Original order index (1-based)
    const applied = applyHunk(result, hunk, maxOffset, maxContextMismatch)
    if (!applied) {
      rejected.push(
        `Hunk ${hunkIndex} (line ${hunk.oldStart}): could not find matching position`
      )
    } else {
      result = applied
      appliedHunks++
    }
  }

  if (rejected.length > 0) {
    return {
      success: false,
      content: result.join('\n'),
      rejected,
      appliedHunks,
      totalHunks,
    }
  }

  return {
    success: true,
    content: result.join('\n'),
    appliedHunks,
    totalHunks,
  }
}

/**
 * Apply a single hunk to source lines
 */
function applyHunk(
  sourceLines: string[],
  hunk: Hunk,
  maxOffset: number,
  maxContextMismatch: number
): string[] | null {
  const position = findHunkPosition(sourceLines, hunk, maxOffset, maxContextMismatch)

  if (position === null) {
    return null
  }

  const result: string[] = []
  let sourceIndex = 0

  while (sourceIndex < position) {
    result.push(sourceLines[sourceIndex]!)
    sourceIndex++
  }

  for (const line of hunk.lines) {
    const operation = line[0]
    const content = line.slice(1)

    if (operation === ' ') {
      if (sourceLines[sourceIndex] !== content && maxContextMismatch === 0) {
        return null
      }
      result.push(sourceLines[sourceIndex]!)
      sourceIndex++
    } else if (operation === '-') {
      if (sourceLines[sourceIndex] !== content && maxContextMismatch === 0) {
        return null
      }
      sourceIndex++
    } else if (operation === '+') {
      result.push(content)
    }
  }

  while (sourceIndex < sourceLines.length) {
    result.push(sourceLines[sourceIndex]!)
    sourceIndex++
  }

  return result
}

/**
 * Find the position where a hunk should be applied
 */
function findHunkPosition(
  sourceLines: string[],
  hunk: Hunk,
  maxOffset: number,
  maxContextMismatch: number
): number | null {
  const targetLine = hunk.oldStart - 1

  if (matchesAtPosition(sourceLines, hunk, targetLine, maxContextMismatch)) {
    return targetLine
  }

  if (maxOffset > 0) {
    for (let offset = 1; offset <= maxOffset; offset++) {
      if (matchesAtPosition(sourceLines, hunk, targetLine - offset, maxContextMismatch)) {
        return targetLine - offset
      }
      if (matchesAtPosition(sourceLines, hunk, targetLine + offset, maxContextMismatch)) {
        return targetLine + offset
      }
    }
  }

  return null
}

/**
 * Check if hunk matches at a given position
 */
function matchesAtPosition(
  sourceLines: string[],
  hunk: Hunk,
  position: number,
  maxContextMismatch: number
): boolean {
  if (position < 0 || position >= sourceLines.length) {
    return false
  }

  let sourceIndex = position
  let contextMatches = 0
  let contextTotal = 0

  for (const line of hunk.lines) {
    const operation = line[0]
    const content = line.slice(1)

    if (operation === ' ' || operation === '-') {
      contextTotal++

      if (sourceIndex >= sourceLines.length) {
        return false
      }

      if (sourceLines[sourceIndex] === content) {
        contextMatches++
      }

      sourceIndex++
    }
  }

  const requiredMatches = contextTotal - maxContextMismatch
  return contextMatches >= requiredMatches
}

/**
 * Apply multiple patches to a source
 */
export function applyPatches(
  source: string,
  patches: (ParsedPatch | string)[],
  options?: ApplyPatchOptions
): PatchResult {
  let result = source
  let totalApplied = 0
  let totalHunks = 0
  const allRejected: string[] = []

  for (let i = 0; i < patches.length; i++) {
    const patchResult = applyPatch(result, patches[i]!, options)
    totalApplied += patchResult.appliedHunks ?? 0
    totalHunks += patchResult.totalHunks ?? 0

    if (!patchResult.success) {
      allRejected.push(
        ...(patchResult.rejected ?? []).map((r) => `Patch ${i + 1}: ${r}`)
      )
    }
    result = patchResult.content
  }

  return {
    success: allRejected.length === 0,
    content: result,
    rejected: allRejected.length > 0 ? allRejected : undefined,
    appliedHunks: totalApplied,
    totalHunks,
  }
}
