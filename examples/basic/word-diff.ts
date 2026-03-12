/**
 * Word Diff Example
 *
 * Demonstrates word-level text comparison.
 * Useful for tracking changes within sentences.
 */

import { diffWords } from '../../src/index.js'

// Example 1: Simple word diff
console.log('=== Example 1: Simple Word Diff ===\n')

const oldSentence = 'the quick brown fox jumps over the lazy dog'
const newSentence = 'the slow red fox jumps over the sleepy dog'

const changes = diffWords(oldSentence, newSentence)

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

console.log('Original:', oldSentence)
console.log('Modified:', newSentence)
console.log('Diff:', output)

// Example 2: Document changes
console.log('\n=== Example 2: Document Changes ===\n')

const oldPara = 'This is the original paragraph with some text.'
const newPara = 'This is the updated paragraph with different text.'

const paraChanges = diffWords(oldPara, newPara)

console.log('Changes:')
for (const change of paraChanges) {
  if (change.added) {
    console.log(`  Added: "${change.value.trim()}"`)
  } else if (change.removed) {
    console.log(`  Removed: "${change.value.trim()}"`)
  }
}

// Example 3: Track word-level edits
console.log('\n=== Example 3: Track Word-Level Edits ===\n')

const v1 = 'Hello world from JavaScript'
const v2 = 'Hello world from TypeScript'

const edits = diffWords(v1, v2)

const wordChanges = edits.filter((c) => c.added || c.removed)
console.log(`${wordChanges.length} word-level changes detected:`)

for (const edit of edits) {
  if (edit.removed) {
    console.log(`  - "${edit.value.trim()}"`)
  }
  if (edit.added) {
    console.log(`  + "${edit.value.trim()}"`)
  }
}

// Example 4: Ignore whitespace
console.log('\n=== Example 4: Ignore Whitespace ===\n')

const text1 = 'hello   world'
const text2 = 'hello world'

const normalDiff = diffWords(text1, text2)
const ignoreDiff = diffWords(text1, text2, { ignoreWhitespace: true })

console.log('Normal diff changes:', normalDiff.filter((c) => c.added || c.removed).length)
console.log('Ignore whitespace changes:', ignoreDiff.filter((c) => c.added || c.removed).length)

// Example 5: Highlight changes
console.log('\n=== Example 5: Highlight Changes ===\n')

const original = 'I love JavaScript programming'
const modified = 'I love TypeScript programming'

const highlights = diffWords(original, modified)

let highlighted = ''
for (const change of highlights) {
  if (change.added) {
    highlighted += `\x1b[32m${change.value}\x1b[0m` // Green
  } else if (change.removed) {
    highlighted += `\x1b[31m${change.value}\x1b[0m` // Red
  } else {
    highlighted += change.value
  }
}

console.log('Highlighted:', highlighted)
