/**
 * Performance benchmarks comparing different algorithms
 *
 * Myers vs Patience for various use cases
 */

import { bench, describe } from 'vitest'
import { diffLines, diffLinesPatiently } from '../../src/index.js'

// Test data
const smallText = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join('\n')
const smallTextModified = Array.from({ length: 10 }, (_, i) =>
  i === 5 ? 'MODIFIED' : `line ${i + 1}`
).join('\n')

const mediumText = Array.from({ length: 100 }, (_, i) => `line ${i + 1}`).join('\n')
const mediumTextModified = Array.from({ length: 100 }, (_, i) =>
  i % 10 === 0 ? 'MODIFIED' : `line ${i + 1}`
).join('\n')

const largeText = Array.from({ length: 1000 }, (_, i) => `line ${i + 1}`).join('\n')
const largeTextModified = Array.from({ length: 1000 }, (_, i) =>
  i % 50 === 0 ? 'MODIFIED' : `line ${i + 1}`
).join('\n')

// Code with moved blocks (where Patience excels)
const codeWithMoves = `import A from 'a'
import B from 'b'

function test() {
  return 42
}

export { test }`

const codeWithMovesReordered = `function test() {
  return 42
}

import A from 'a'
import B from 'b'

export { test }`

describe('Myers vs Patience - Small text (10 lines)', () => {
  bench('Myers algorithm', () => {
    diffLines(smallText, smallTextModified)
  })

  bench('Patience algorithm', () => {
    diffLinesPatiently(smallText, smallTextModified)
  })
})

describe('Myers vs Patience - Medium text (100 lines)', () => {
  bench('Myers algorithm', () => {
    diffLines(mediumText, mediumTextModified)
  })

  bench('Patience algorithm', () => {
    diffLinesPatiently(mediumText, mediumTextModified)
  })
})

describe('Myers vs Patience - Large text (1000 lines)', () => {
  bench('Myers algorithm', () => {
    diffLines(largeText, largeTextModified)
  })

  bench('Patience algorithm', () => {
    diffLinesPatiently(largeText, largeTextModified)
  })
})

describe('Myers vs Patience - Code with moved blocks', () => {
  bench('Myers algorithm', () => {
    diffLines(codeWithMoves, codeWithMovesReordered)
  })

  bench('Patience algorithm (should be better)', () => {
    diffLinesPatiently(codeWithMoves, codeWithMovesReordered)
  })
})

describe('Identical text (worst case)', () => {
  const identical = Array.from({ length: 100 }, (_, i) => `line ${i}`).join('\n')

  bench('Myers - identical text', () => {
    diffLines(identical, identical)
  })

  bench('Patience - identical text', () => {
    diffLinesPatiently(identical, identical)
  })
})

describe('Completely different text (worst case)', () => {
  const text1 = Array.from({ length: 100 }, (_, i) => `old ${i}`).join('\n')
  const text2 = Array.from({ length: 100 }, (_, i) => `new ${i}`).join('\n')

  bench('Myers - completely different', () => {
    diffLines(text1, text2)
  })

  bench('Patience - completely different', () => {
    diffLinesPatiently(text1, text2)
  })
})
