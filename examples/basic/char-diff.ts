/**
 * Character Diff Example
 *
 * Demonstrates character-level text comparison.
 * Useful for precise text editing and typo detection.
 */

import { diffChars } from '../../src/index.js'

// Example 1: Simple character diff
console.log('=== Example 1: Simple Character Diff ===\n')

const oldText = 'hello world'
const newText = 'hallo wrld'

const changes = diffChars(oldText, newText)

let output = ''
for (const change of changes) {
  if (change.added) {
    output += `[+${change.value}]`
  } else if (change.removed) {
    output += `[-${change.value}]`
  } else {
    output += change.value
  }
}

console.log('Original:', oldText)
console.log('Modified:', newText)
console.log('Diff:', output)

// Example 2: Typo detection
console.log('\n=== Example 2: Typo Detection ===\n')

const correct = 'algorithm'
const typo = 'algoritm'

const typoChanges = diffChars(correct, typo)

console.log('Typos detected:')
for (const change of typoChanges) {
  if (change.removed) {
    console.log(`  Missing character: "${change.value}"`)
  }
  if (change.added) {
    console.log(`  Extra character: "${change.value}"`)
  }
}

// Example 3: Edit distance
console.log('\n=== Example 3: Edit Distance (Levenshtein) ===\n')

const word1 = 'kitten'
const word2 = 'sitting'

const editChanges = diffChars(word1, word2)

const edits = editChanges.filter((c) => c.added || c.removed).length
console.log(`Word 1: ${word1}`)
console.log(`Word 2: ${word2}`)
console.log(`Approximate edit distance: ${edits}`)

// Example 4: Highlighted diff
console.log('\n=== Example 4: Highlighted Character Diff ===\n')

const original = 'JavaScript'
const modified = 'TypeScript'

const highlights = diffChars(original, modified)

let highlighted = ''
for (const change of highlights) {
  if (change.added) {
    highlighted += `\x1b[32m${change.value}\x1b[0m` // Green
  } else if (change.removed) {
    highlighted += `\x1b[31m${change.value}\x1b[0m` // Red (strikethrough)
  } else {
    highlighted += change.value
  }
}

console.log('Result:', highlighted)

// Example 5: Precise text changes
console.log('\n=== Example 5: Precise Text Changes ===\n')

const v1 = 'version 1.0.0'
const v2 = 'version 2.1.5'

const versionChanges = diffChars(v1, v2)

console.log('Character-level changes:')
for (const change of versionChanges) {
  if (change.added) {
    console.log(`  Added "${change.value}" (${change.count} chars)`)
  } else if (change.removed) {
    console.log(`  Removed "${change.value}" (${change.count} chars)`)
  }
}

// Example 6: Case sensitivity
console.log('\n=== Example 6: Case Sensitivity ===\n')

const lower = 'hello world'
const upper = 'Hello World'

const caseChanges = diffChars(lower, upper)

const caseChangesCount = caseChanges.filter((c) => c.added || c.removed).length
console.log(`${caseChangesCount} character differences due to case`)

for (const change of caseChanges) {
  if (change.removed) {
    console.log(`  - "${change.value}"`)
  }
  if (change.added) {
    console.log(`  + "${change.value}"`)
  }
}
