/**
 * Algorithms Comparison
 *
 * Demonstrates Myers vs Patience algorithm differences.
 * Shows when to use each algorithm.
 */

import { diffLines, diffLinesPatiently } from '../../src/index.js'

// Example 1: Normal sequential changes (Myers is faster)
console.log('=== Example 1: Sequential Changes (Myers faster) ===\n')

const oldSeq = `line 1
line 2
line 3
line 4
line 5`

const newSeq = `line 1
modified line 2
line 3
modified line 4
line 5`

console.log('Myers algorithm:')
const myersSeq = diffLines(oldSeq, newSeq)
console.log(`  ${myersSeq.length} changes detected`)

console.log('\nPatience algorithm:')
const patienceSeq = diffLinesPatiently(oldSeq, newSeq)
console.log(`  ${patienceSeq.length} changes detected`)

// Example 2: Moved code blocks (Patience is better)
console.log('\n=== Example 2: Moved Code Blocks (Patience better) ===\n')

const codeOld = `import A from 'a'
import B from 'b'

function helper() {
  return 42
}

export function main() {
  return helper()
}`

const codeNew = `function helper() {
  return 42
}

import A from 'a'
import B from 'b'

export function main() {
  return helper()
}`

console.log('Myers algorithm (may show more changes):')
const myersCode = diffLines(codeOld, codeNew)
const myersChanges = myersCode.filter((c) => c.added || c.removed).length
console.log(`  ${myersChanges} changes`)

console.log('\nPatience algorithm (better at detecting moves):')
const patienceCode = diffLinesPatiently(codeOld, codeNew)
const patienceChanges = patienceCode.filter((c) => c.added || c.removed).length
console.log(`  ${patienceChanges} changes`)

console.log('\n  → Patience is better at recognizing moved blocks')

// Example 3: Unique lines (Patience excels)
console.log('\n=== Example 3: Unique Lines (Patience excels) ===\n')

const docOld = `Title
------
Section A
Content A

Section B
Content B`

const docNew = `Title
------
Section B
Content B

Section A
Content A`

console.log('Myers:')
const myersDoc = diffLines(docOld, docNew)
console.log(`  ${myersDoc.filter((c) => c.added || c.removed).length} changes`)

console.log('\nPatience:')
const patienceDoc = diffLinesPatiently(docOld, docNew)
console.log(`  ${patienceDoc.filter((c) => c.added || c.removed).length} changes`)

// Example 4: When to use each
console.log('\n=== Example 4: Algorithm Selection Guide ===\n')

console.log('Use Myers (default) when:')
console.log('  - General text comparison')
console.log('  - Sequential edits (adding/removing lines)')
console.log('  - Maximum performance needed')
console.log('  - Most common use cases')

console.log('\nUse Patience when:')
console.log('  - Code refactoring (moved functions/imports)')
console.log('  - Reordered sections in documents')
console.log('  - Files with unique "anchor" lines')
console.log('  - Better human-readable diffs needed')

// Example 5: Identical text (both are fast)
console.log('\n=== Example 5: Identical Text (both fast) ===\n')

const identical = `line 1
line 2
line 3
line 4
line 5`

const myersIdentical = diffLines(identical, identical)
const patienceIdentical = diffLinesPatiently(identical, identical)

console.log('Myers:', myersIdentical.length, 'chunks')
console.log('Patience:', patienceIdentical.length, 'chunks')
console.log('Both recognize identical text efficiently')
