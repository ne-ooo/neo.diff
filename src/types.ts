/**
 * TypeScript type definitions for @lpm.dev/neo.diff
 *
 * Modern, tree-shakeable diff library
 */

/**
 * A single diff change
 *
 * Represents an addition, deletion, or unchanged section in a diff.
 */
export interface DiffChange {
  /** The text or value that changed */
  value: string
  /** True if this was added in the new version */
  added?: boolean
  /** True if this was removed from the old version */
  removed?: boolean
  /** Number of items (for line/word diff) */
  count?: number
}

/**
 * Diff result - array of changes
 */
export type DiffResult = DiffChange[]

/**
 * Structured diff change (for objects/arrays, like microdiff)
 */
export type StructuredDiffChange =
  | { type: 'CREATE'; path: (string | number)[]; value: any }
  | { type: 'REMOVE'; path: (string | number)[]; oldValue: any }
  | { type: 'CHANGE'; path: (string | number)[]; oldValue: any; value: any }

/**
 * Options for diff operations
 */
export interface DiffOptions {
  /**
   * Number of context lines to include (default: 3)
   */
  context?: number

  /**
   * Ignore whitespace differences (default: false)
   */
  ignoreWhitespace?: boolean

  /**
   * Ignore case differences (default: false)
   */
  ignoreCase?: boolean

  /**
   * Algorithm to use for diffing
   * - 'myers': Fast general-purpose (default)
   * - 'patience': More readable output
   * - 'histogram': Balanced speed and quality
   * - 'lcs': Explicit longest common subsequence
   */
  algorithm?: 'myers' | 'patience' | 'histogram' | 'lcs'

  /**
   * Timeout in milliseconds for diff computation (default: 5000)
   * Prevents hanging on very large diffs
   */
  timeout?: number

  /**
   * Use web worker for large diffs (browser only, default: false)
   */
  useWorker?: boolean

  /**
   * Normalize line endings before diffing (default: true)
   * Converts \r\n and \r to \n so Windows/Mac/Linux files compare cleanly.
   */
  normalizeLineEndings?: boolean
}

/**
 * Patch generation options
 */
export interface PatchOptions {
  /**
   * Number of context lines (default: 3)
   */
  context?: number

  /**
   * Add newline at end of patch (default: true)
   */
  newlineAtEnd?: boolean

  /**
   * Ignore whitespace when generating patch (default: false)
   */
  ignoreWhitespace?: boolean
}

/**
 * Patch application result
 */
export interface PatchResult {
  /** Whether patch was applied successfully */
  success: boolean
  /** Resulting content after patch */
  content: string
  /** Rejected hunks (if any) */
  rejected?: string[]
  /** Number of hunks successfully applied */
  appliedHunks?: number
  /** Total number of hunks */
  totalHunks?: number
}

/**
 * Parsed patch structure
 */
export interface ParsedPatch {
  /** Old file name */
  oldFileName: string
  /** New file name */
  newFileName: string
  /** Old file header/timestamp */
  oldHeader?: string
  /** New file header/timestamp */
  newHeader?: string
  /** Array of hunks */
  hunks: Hunk[]
}

/**
 * A single hunk in a patch
 */
export interface Hunk {
  /** Starting line number in old file */
  oldStart: number
  /** Number of lines in old file */
  oldLines: number
  /** Starting line number in new file */
  newStart: number
  /** Number of lines in new file */
  newLines: number
  /** Lines in this hunk (with +/- prefixes) */
  lines: string[]
}

/**
 * Equality comparison function
 */
export type EqualityFn<T> = (a: T, b: T) => boolean

/**
 * Internal edit operation
 */
export interface Edit {
  /** Type of edit: insert, delete, or keep */
  type: 'insert' | 'delete' | 'keep'
  /** Position in old sequence */
  oldPos: number
  /** Position in new sequence */
  newPos: number
  /** Value at this position */
  value: string
}
