/**
 * Patch generation in unified diff format
 *
 * Generates patches compatible with git diff and patch command
 */

import { diffLines } from '../text/line.js'
import type { DiffResult, PatchOptions, ParsedPatch, Hunk } from '../types.js'

/**
 * Create a patch from two strings
 *
 * Generates a unified diff patch that can be applied with `patch` command.
 *
 * @param oldStr - Original string
 * @param newStr - New string
 * @param oldFileName - Optional old file name
 * @param newFileName - Optional new file name
 * @param options - Patch options
 * @returns Parsed patch with hunks
 *
 * @example
 * ```typescript
 * const patch = createPatch(
 *   'line 1\nline 2\nline 3',
 *   'line 1\nmodified\nline 3',
 *   'file.txt',
 *   'file.txt'
 * )
 * console.log(formatPatch(patch))
 * // --- file.txt
 * // +++ file.txt
 * // @@ -1,3 +1,3 @@
 * //  line 1
 * // -line 2
 * // +modified
 * //  line 3
 * ```
 */
export function createPatch(
  oldStr: string,
  newStr: string,
  oldFileName?: string,
  newFileName?: string,
  options?: PatchOptions
): ParsedPatch {
  const context = options?.context ?? 3

  // Diff the strings line by line
  const changes = diffLines(oldStr, newStr, options)

  // Convert to hunks
  const hunks = createHunks(changes, context)

  return {
    oldFileName: oldFileName ?? 'a',
    newFileName: newFileName ?? 'b',
    hunks,
  }
}

/**
 * Create a two-file patch (with file headers)
 *
 * @param oldStr - Original string
 * @param newStr - New string
 * @param oldPath - Old file path
 * @param newPath - New file path
 * @param oldHeader - Optional old file header
 * @param newHeader - Optional new file header
 * @param options - Patch options
 * @returns Formatted patch string
 */
export function createTwoFilesPatch(
  oldStr: string,
  newStr: string,
  oldPath: string,
  newPath: string,
  oldHeader?: string,
  newHeader?: string,
  options?: PatchOptions
): string {
  const patch = createPatch(oldStr, newStr, oldPath, newPath, options)

  // Format the patch
  return formatPatch(patch, oldHeader, newHeader)
}

/**
 * Format a parsed patch as unified diff string
 *
 * @param patch - Parsed patch
 * @param oldHeader - Optional old file header
 * @param newHeader - Optional new file header
 * @returns Formatted unified diff string
 */
export function formatPatch(
  patch: ParsedPatch,
  oldHeader?: string,
  newHeader?: string
): string {
  const lines: string[] = []

  // File headers
  lines.push(`--- ${oldHeader ?? patch.oldFileName}`)
  lines.push(`+++ ${newHeader ?? patch.newFileName}`)

  // Hunks
  for (const hunk of patch.hunks) {
    lines.push(formatHunk(hunk))
  }

  return lines.join('\n')
}

/**
 * Format a single hunk
 *
 * @param hunk - Hunk to format
 * @returns Formatted hunk string
 */
function formatHunk(hunk: Hunk): string {
  const lines: string[] = []

  // Hunk header
  lines.push(
    `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`
  )

  // Hunk lines
  lines.push(...hunk.lines)

  return lines.join('\n')
}

/**
 * Create hunks from diff changes
 *
 * Groups changes into hunks with context lines.
 *
 * @param changes - Diff changes
 * @param context - Number of context lines
 * @returns Array of hunks
 */
function createHunks(changes: DiffResult, context: number): Hunk[] {
  if (changes.length === 0) {
    return []
  }

  const hunks: Hunk[] = []
  let currentHunk: Hunk | null = null

  let oldLine = 1
  let newLine = 1

  // BUG-4 fix: buffer recent unchanged lines so they can be prepended as leading context
  const pendingContext: Array<{ text: string; oldLine: number; newLine: number }> = []

  for (const change of changes) {
    const count = change.count ?? 1
    const lines = change.value.split('\n')
    if (lines[lines.length - 1] === '') {
      lines.pop() // Remove empty line from split
    }

    if (change.added || change.removed) {
      // Start new hunk if needed
      if (!currentHunk) {
        // Take up to `context` buffered lines as leading context
        const leading = pendingContext.slice(-context)
        const hunkOldStart = leading.length > 0 ? leading[0]!.oldLine : oldLine
        const hunkNewStart = leading.length > 0 ? leading[0]!.newLine : newLine

        currentHunk = {
          oldStart: hunkOldStart,
          newStart: hunkNewStart,
          oldLines: leading.length,
          newLines: leading.length,
          lines: leading.map((c) => ` ${c.text}`),
        }
        pendingContext.length = 0
      }

      // Add changed lines
      for (const line of lines) {
        if (change.removed) {
          currentHunk.lines.push(`-${line}`)
          currentHunk.oldLines++
        } else if (change.added) {
          currentHunk.lines.push(`+${line}`)
          currentHunk.newLines++
        }
      }

      if (change.removed) {
        oldLine += count
      } else if (change.added) {
        newLine += count
      }
    } else {
      // Unchanged lines
      if (currentHunk) {
        // Add trailing context (up to `context` lines), then close hunk
        const trailingCount = Math.min(lines.length, context)
        for (let i = 0; i < trailingCount; i++) {
          currentHunk.lines.push(` ${lines[i]!}`)
          currentHunk.oldLines++
          currentHunk.newLines++
        }
        hunks.push(currentHunk)
        currentHunk = null

        // Buffer remaining lines (beyond trailing context) for the next hunk's leading context
        for (let i = trailingCount; i < lines.length; i++) {
          pendingContext.push({ text: lines[i]!, oldLine: oldLine + i, newLine: newLine + i })
        }
        if (pendingContext.length > context) {
          pendingContext.splice(0, pendingContext.length - context)
        }
      } else {
        // No active hunk — buffer these unchanged lines for potential leading context
        for (let i = 0; i < lines.length; i++) {
          pendingContext.push({ text: lines[i]!, oldLine: oldLine + i, newLine: newLine + i })
        }
        if (pendingContext.length > context) {
          pendingContext.splice(0, pendingContext.length - context)
        }
      }

      oldLine += count
      newLine += count
    }
  }

  // Add remaining hunk
  if (currentHunk) {
    hunks.push(currentHunk)
  }

  return hunks
}
