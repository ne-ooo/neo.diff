/**
 * Patch parsing
 *
 * Parse unified diff format patches
 */

import type { ParsedPatch, Hunk } from '../types.js'

/**
 * Parse a unified diff patch string
 *
 * Parses patches in unified diff format (git diff output).
 *
 * @param patchContent - Patch string
 * @returns Array of parsed patches
 *
 * @example
 * ```typescript
 * const patch = `
 * --- file.txt
 * +++ file.txt
 * @@ -1,3 +1,3 @@
 *  line 1
 * -line 2
 * +modified
 *  line 3
 * `
 * const parsed = parsePatch(patch)
 * // => [{ oldFileName: 'file.txt', newFileName: 'file.txt', hunks: [...] }]
 * ```
 */
export interface ParsePatchOptions {
  /**
   * When true, throw on unexpected line formats inside hunks (default: false)
   */
  strict?: boolean
}

export function parsePatch(patchContent: string, options?: ParsePatchOptions): ParsedPatch[] {
  const lines = patchContent.split('\n')
  const patches: ParsedPatch[] = []

  let currentPatch: ParsedPatch | null = null
  let currentHunk: Hunk | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!

    if (line.startsWith('--- ')) {
      // Start of new patch - old file header
      if (currentPatch && currentHunk) {
        currentPatch.hunks.push(currentHunk)
      }
      if (currentPatch) {
        patches.push(currentPatch)
      }

      const oldFileName = line.slice(4).trim()
      currentPatch = {
        oldFileName,
        newFileName: '',
        hunks: [],
      }
      currentHunk = null
    } else if (line.startsWith('+++ ')) {
      // New file header
      if (currentPatch) {
        currentPatch.newFileName = line.slice(4).trim()
      }
    } else if (line.startsWith('@@')) {
      // Hunk header
      if (currentHunk && currentPatch) {
        currentPatch.hunks.push(currentHunk)
      }

      currentHunk = parseHunkHeader(line)
    } else if (currentHunk) {
      // Hunk content line
      if (line.startsWith('-') || line.startsWith('+') || line.startsWith(' ')) {
        currentHunk.lines.push(line)
      } else if (line.startsWith('\\')) {
        // "\ No newline at end of file" - ignore
        continue
      } else if (line === '') {
        // Empty lines in hunks are treated as context (space-prefixed)
        continue
      } else if (options?.strict) {
        throw new Error(
          `Unexpected line format at line ${i + 1}: "${line}". ` +
          `Expected line to start with ' ', '-', '+', or '\\'.`
        )
      }
    }
  }

  // Add final hunk and patch
  if (currentHunk && currentPatch) {
    currentPatch.hunks.push(currentHunk)
  }
  if (currentPatch) {
    patches.push(currentPatch)
  }

  return patches
}

/**
 * Parse a hunk header line
 *
 * Parses lines like "@@ -1,3 +1,3 @@" or "@@ -1,3 +1,3 @@ function name"
 *
 * @param line - Hunk header line
 * @returns Parsed hunk
 */
function parseHunkHeader(line: string): Hunk {
  // Format: @@ -oldStart,oldLines +newStart,newLines @@ [context]
  const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/)

  if (!match) {
    throw new Error(`Invalid hunk header: ${line}`)
  }

  const oldStart = parseInt(match[1]!, 10)
  const oldLines = match[2] ? parseInt(match[2], 10) : 1
  const newStart = parseInt(match[3]!, 10)
  const newLines = match[4] ? parseInt(match[4], 10) : 1

  return {
    oldStart,
    oldLines,
    newStart,
    newLines,
    lines: [],
  }
}

/**
 * Parse multiple patch files
 *
 * Parses a string containing multiple patch files.
 *
 * @param content - Content with multiple patches
 * @returns Array of parsed patches
 */
export function parseMultiplePatches(content: string): ParsedPatch[] {
  return parsePatch(content)
}

/**
 * Validate a parsed patch
 *
 * Checks if a patch is valid and can be applied.
 *
 * @param patch - Parsed patch
 * @returns true if valid
 */
export function validatePatch(patch: ParsedPatch): boolean {
  if (!patch.oldFileName || !patch.newFileName) {
    return false
  }

  for (const hunk of patch.hunks) {
    if (hunk.oldStart < 1 || hunk.newStart < 1) {
      return false
    }

    if (hunk.oldLines < 0 || hunk.newLines < 0) {
      return false
    }

    // Count actual lines in hunk
    let removedCount = 0
    let addedCount = 0
    let contextCount = 0

    for (const line of hunk.lines) {
      const op = line[0]
      if (op === '-') removedCount++
      else if (op === '+') addedCount++
      else if (op === ' ') contextCount++
    }

    // Verify line counts match
    const expectedOldLines = removedCount + contextCount
    const expectedNewLines = addedCount + contextCount

    if (expectedOldLines !== hunk.oldLines || expectedNewLines !== hunk.newLines) {
      return false
    }
  }

  return true
}
