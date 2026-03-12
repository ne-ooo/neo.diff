/**
 * Line Diff Example
 *
 * Demonstrates line-by-line text comparison.
 * This is the most common use case for text diffing.
 */

import { diffLines } from '../../src/index.js'

// Example 1: Simple line diff
console.log('=== Example 1: Simple Line Diff ===\n')

const oldText = `line 1
line 2
line 3`

const newText = `line 1
modified line 2
line 3
line 4`

const changes = diffLines(oldText, newText)

for (const change of changes) {
  const prefix = change.added ? '+ ' : change.removed ? '- ' : '  '
  const lines = change.value.split('\n').filter((l) => l !== '')
  for (const line of lines) {
    console.log(prefix + line)
  }
}

// Example 2: Ignore whitespace
console.log('\n=== Example 2: Ignore Whitespace ===\n')

const text1 = `function hello() {
  console.log('hello')
}`

const text2 = `function hello() {
    console.log('hello')
}`

const changesNormal = diffLines(text1, text2)
const changesIgnoreWs = diffLines(text1, text2, { ignoreWhitespace: true })

console.log('Normal diff:', changesNormal.length, 'changes')
console.log('Ignore whitespace:', changesIgnoreWs.length, 'changes')

// Example 3: Code comparison
console.log('\n=== Example 3: Code Comparison ===\n')

const oldCode = `import React from 'react'

export function Button() {
  return <button>Click me</button>
}
`

const newCode = `import React from 'react'

export function Button({ onClick }) {
  return <button onClick={onClick}>Click me</button>
}
`

const codeChanges = diffLines(oldCode, newCode)

console.log('Code changes:')
for (const change of codeChanges) {
  if (change.added) {
    console.log('+ ' + change.value.trim())
  } else if (change.removed) {
    console.log('- ' + change.value.trim())
  }
}

// Example 4: Count changes
console.log('\n=== Example 4: Count Changes ===\n')

const oldDoc = `# Title
Version 1.0
Old content`

const newDoc = `# Title
Version 2.0
New content
Additional line`

const docChanges = diffLines(oldDoc, newDoc)

const added = docChanges.filter((c) => c.added).length
const removed = docChanges.filter((c) => c.removed).length
const unchanged = docChanges.filter((c) => !c.added && !c.removed).length

console.log(`Added: ${added}, Removed: ${removed}, Unchanged: ${unchanged}`)
