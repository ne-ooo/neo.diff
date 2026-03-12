/**
 * Tests for patch generation, application, and parsing
 */

import { describe, it, expect } from 'vitest'
import {
  createPatch,
  createTwoFilesPatch,
  formatPatch,
  applyPatch,
  applyPatches,
  parsePatch,
  parseMultiplePatches,
  validatePatch,
} from '../../src/patch/index.js'

describe('createPatch', () => {
  it('should create patch for simple change', () => {
    const old = 'line 1\nline 2\nline 3'
    const newText = 'line 1\nmodified\nline 3'
    const patch = createPatch(old, newText, 'file.txt', 'file.txt')

    expect(patch.oldFileName).toBe('file.txt')
    expect(patch.newFileName).toBe('file.txt')
    expect(patch.hunks).toHaveLength(1)
    expect(patch.hunks[0]!.lines.some((l) => l.startsWith('-'))).toBe(true)
    expect(patch.hunks[0]!.lines.some((l) => l.startsWith('+'))).toBe(true)
  })

  it('should create patch for added lines', () => {
    const old = 'line 1\nline 2'
    const newText = 'line 1\nline 2\nline 3'
    const patch = createPatch(old, newText)

    expect(patch.hunks).toHaveLength(1)
    expect(patch.hunks[0]!.lines.some((l) => l.startsWith('+'))).toBe(true)
  })

  it('should create patch for removed lines', () => {
    const old = 'line 1\nline 2\nline 3'
    const newText = 'line 1\nline 2'
    const patch = createPatch(old, newText)

    expect(patch.hunks).toHaveLength(1)
    expect(patch.hunks[0]!.lines.some((l) => l.startsWith('-'))).toBe(true)
  })

  it('should handle identical text', () => {
    const text = 'line 1\nline 2\nline 3'
    const patch = createPatch(text, text)

    expect(patch.hunks).toHaveLength(0)
  })

  it('should handle empty strings', () => {
    const patch = createPatch('', '')

    expect(patch.hunks).toHaveLength(0)
  })

  it('should handle context option', () => {
    const old = 'line 1\nline 2\nline 3\nline 4\nline 5'
    const newText = 'line 1\nline 2\nmodified\nline 4\nline 5'
    const patch = createPatch(old, newText, 'file.txt', 'file.txt', { context: 1 })

    expect(patch.hunks).toHaveLength(1)
    // With context=1, should include 1 line before and after the change
  })
})

describe('formatPatch', () => {
  it('should format patch with file headers', () => {
    const old = 'line 1\nline 2\nline 3'
    const newText = 'line 1\nmodified\nline 3'
    const patch = createPatch(old, newText, 'file.txt', 'file.txt')
    const formatted = formatPatch(patch)

    expect(formatted).toContain('--- file.txt')
    expect(formatted).toContain('+++ file.txt')
    expect(formatted).toContain('@@')
    expect(formatted).toContain('-line 2')
    expect(formatted).toContain('+modified')
  })

  it('should format patch with custom headers', () => {
    const old = 'line 1'
    const newText = 'line 2'
    const patch = createPatch(old, newText, 'old.txt', 'new.txt')
    const formatted = formatPatch(patch, 'a/old.txt', 'b/new.txt')

    expect(formatted).toContain('--- a/old.txt')
    expect(formatted).toContain('+++ b/new.txt')
  })
})

describe('createTwoFilesPatch', () => {
  it('should create formatted two-file patch', () => {
    const old = 'line 1\nline 2'
    const newText = 'line 1\nmodified'
    const formatted = createTwoFilesPatch(old, newText, 'a/file.txt', 'b/file.txt')

    expect(formatted).toContain('--- a/file.txt')
    expect(formatted).toContain('+++ b/file.txt')
    expect(formatted).toContain('@@')
  })
})

describe('parsePatch', () => {
  it('should parse unified diff format', () => {
    const patchStr = `--- file.txt
+++ file.txt
@@ -1,3 +1,3 @@
 line 1
-line 2
+modified
 line 3`

    const patches = parsePatch(patchStr)

    expect(patches).toHaveLength(1)
    expect(patches[0]!.oldFileName).toBe('file.txt')
    expect(patches[0]!.newFileName).toBe('file.txt')
    expect(patches[0]!.hunks).toHaveLength(1)
    expect(patches[0]!.hunks[0]!.oldStart).toBe(1)
    expect(patches[0]!.hunks[0]!.oldLines).toBe(3)
    expect(patches[0]!.hunks[0]!.newStart).toBe(1)
    expect(patches[0]!.hunks[0]!.newLines).toBe(3)
  })

  it('should parse hunk header correctly', () => {
    const patchStr = `--- file.txt
+++ file.txt
@@ -10,5 +10,6 @@
 context
+added line
 more context`

    const patches = parsePatch(patchStr)
    const hunk = patches[0]!.hunks[0]!

    expect(hunk.oldStart).toBe(10)
    expect(hunk.oldLines).toBe(5)
    expect(hunk.newStart).toBe(10)
    expect(hunk.newLines).toBe(6)
  })

  it('should parse multiple hunks', () => {
    const patchStr = `--- file.txt
+++ file.txt
@@ -1,2 +1,2 @@
 line 1
-line 2
+modified 2
@@ -5,2 +5,2 @@
 line 5
-line 6
+modified 6`

    const patches = parsePatch(patchStr)

    expect(patches[0]!.hunks).toHaveLength(2)
  })

  it('should handle patch with no newline marker', () => {
    const patchStr = `--- file.txt
+++ file.txt
@@ -1,1 +1,1 @@
-old
\\ No newline at end of file
+new
\\ No newline at end of file`

    const patches = parsePatch(patchStr)

    expect(patches).toHaveLength(1)
  })
})

describe('applyPatch', () => {
  it('should apply simple patch', () => {
    const source = 'line 1\nline 2\nline 3'
    const patchStr = `--- file.txt
+++ file.txt
@@ -1,3 +1,3 @@
 line 1
-line 2
+modified
 line 3`

    const result = applyPatch(source, patchStr)

    expect(result.success).toBe(true)
    expect(result.content).toBe('line 1\nmodified\nline 3')
  })

  it('should apply patch with added lines', () => {
    const source = 'line 1\nline 2'
    const patchStr = `--- file.txt
+++ file.txt
@@ -1,2 +1,3 @@
 line 1
 line 2
+line 3`

    const result = applyPatch(source, patchStr)

    expect(result.success).toBe(true)
    expect(result.content).toBe('line 1\nline 2\nline 3')
  })

  it('should apply patch with removed lines', () => {
    const source = 'line 1\nline 2\nline 3'
    const patchStr = `--- file.txt
+++ file.txt
@@ -1,3 +1,2 @@
 line 1
 line 2
-line 3`

    const result = applyPatch(source, patchStr)

    expect(result.success).toBe(true)
    expect(result.content).toBe('line 1\nline 2')
  })

  it('should return failure for failed patch', () => {
    const source = 'completely different'
    const patchStr = `--- file.txt
+++ file.txt
@@ -1,3 +1,3 @@
 line 1
-line 2
+modified
 line 3`

    const result = applyPatch(source, patchStr)

    expect(result.success).toBe(false)
    expect(result.rejected).toBeDefined()
    expect(result.rejected!.length).toBeGreaterThan(0)
  })

  it('should round-trip with createPatch', () => {
    const original = 'line 1\nline 2\nline 3'
    const modified = 'line 1\nmodified 2\nline 3'

    const patch = createPatch(original, modified)
    const formatted = formatPatch(patch)
    const result = applyPatch(original, formatted)

    expect(result.success).toBe(true)
    expect(result.content).toBe(modified)
  })

  it('should handle ParsedPatch object', () => {
    const source = 'line 1\nline 2\nline 3'
    const patch = createPatch(source, 'line 1\nmodified\nline 3')
    const result = applyPatch(source, patch)

    expect(result.success).toBe(true)
    expect(result.content).toBe('line 1\nmodified\nline 3')
  })
})

describe('applyPatches', () => {
  it('should apply multiple patches in sequence', () => {
    const source = 'line 1\nline 2\nline 3'

    const patch1Str = `--- file.txt
+++ file.txt
@@ -1,3 +1,3 @@
 line 1
-line 2
+modified
 line 3`

    const result1 = applyPatch(source, patch1Str)
    expect(result1.success).toBe(true)

    const patch2Str = `--- file.txt
+++ file.txt
@@ -1,3 +1,4 @@
 line 1
 modified
 line 3
+line 4`

    const result2 = applyPatch(result1.content, patch2Str)
    expect(result2.success).toBe(true)
    expect(result2.content).toBe('line 1\nmodified\nline 3\nline 4')
  })

  it('should return failure if any patch fails', () => {
    const source = 'line 1'

    const patch1 = createPatch(source, 'line 1\nline 2')
    const badPatch = createPatch('different', 'also different')

    const result = applyPatches(source, [patch1, badPatch])

    expect(result.success).toBe(false)
    expect(result.rejected).toBeDefined()
  })
})

describe('validatePatch', () => {
  it('should validate correct patch', () => {
    const patch = createPatch('line 1\nline 2', 'line 1\nmodified')

    expect(validatePatch(patch)).toBe(true)
  })

  it('should reject patch with missing file names', () => {
    const invalidPatch = {
      oldFileName: '',
      newFileName: 'file.txt',
      hunks: [],
    }

    expect(validatePatch(invalidPatch)).toBe(false)
  })

  it('should reject patch with invalid line numbers', () => {
    const invalidPatch = {
      oldFileName: 'file.txt',
      newFileName: 'file.txt',
      hunks: [
        {
          oldStart: 0, // Invalid: should be >= 1
          oldLines: 1,
          newStart: 1,
          newLines: 1,
          lines: [' line 1'],
        },
      ],
    }

    expect(validatePatch(invalidPatch)).toBe(false)
  })

  it('should reject patch with mismatched line counts', () => {
    const invalidPatch = {
      oldFileName: 'file.txt',
      newFileName: 'file.txt',
      hunks: [
        {
          oldStart: 1,
          oldLines: 3, // Says 3 but only has 2
          newStart: 1,
          newLines: 2,
          lines: [' line 1', '-line 2'],
        },
      ],
    }

    expect(validatePatch(invalidPatch)).toBe(false)
  })
})

describe('parseMultiplePatches', () => {
  // NOTE: parseMultiplePatches is an alias for parsePatch. These tests verify it handles
  // single and concatenated patch strings identically to parsePatch.
  it('parses a single patch', () => {
    const patchStr = `--- file.txt
+++ file.txt
@@ -1,3 +1,3 @@
 line 1
-line 2
+modified
 line 3`

    const patches = parseMultiplePatches(patchStr)
    expect(patches).toHaveLength(1)
    expect(patches[0]!.oldFileName).toBe('file.txt')
    expect(patches[0]!.hunks).toHaveLength(1)
  })

  it('parses two concatenated patches', () => {
    const patchStr = `--- file-a.txt
+++ file-a.txt
@@ -1,2 +1,2 @@
-old a
+new a
--- file-b.txt
+++ file-b.txt
@@ -1,2 +1,2 @@
-old b
+new b`

    const patches = parseMultiplePatches(patchStr)
    expect(patches).toHaveLength(2)
    expect(patches[0]!.oldFileName).toBe('file-a.txt')
    expect(patches[1]!.oldFileName).toBe('file-b.txt')
  })

  it('returns empty array for empty string', () => {
    const patches = parseMultiplePatches('')
    expect(patches).toEqual([])
  })
})
