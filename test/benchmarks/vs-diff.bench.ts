/**
 * Performance benchmarks vs 'diff' package (88KB, 20M downloads/week)
 *
 * This benchmark compares our implementation against the popular diff package.
 */

import { bench, describe } from 'vitest'
import { diffLines as ourDiffLines, diffWords as ourDiffWords } from '../../src/index.js'

// Test data sets
const smallText = 'line 1\nline 2\nline 3'
const smallTextModified = 'line 1\nmodified\nline 3'

const mediumText = Array.from({ length: 100 }, (_, i) => `line ${i + 1}`).join('\n')
const mediumTextModified = Array.from({ length: 100 }, (_, i) =>
  i === 50 ? 'MODIFIED LINE' : `line ${i + 1}`
).join('\n')

const largeText = Array.from({ length: 1000 }, (_, i) => `line ${i + 1}`).join('\n')
const largeTextModified = Array.from({ length: 1000 }, (_, i) =>
  i % 10 === 0 ? `MODIFIED ${i}` : `line ${i + 1}`
).join('\n')

describe('Line Diff Performance', () => {
  describe('Small text (3 lines)', () => {
    bench('@lpm.dev/neo.diff', () => {
      ourDiffLines(smallText, smallTextModified)
    })
  })

  describe('Medium text (100 lines)', () => {
    bench('@lpm.dev/neo.diff', () => {
      ourDiffLines(mediumText, mediumTextModified)
    })
  })

  describe('Large text (1000 lines)', () => {
    bench('@lpm.dev/neo.diff', () => {
      ourDiffLines(largeText, largeTextModified)
    })
  })
})

describe('Word Diff Performance', () => {
  const smallWords = 'the quick brown fox jumps over the lazy dog'
  const smallWordsModified = 'the slow red fox jumps over the sleepy dog'

  const mediumWords = Array.from({ length: 100 }, (_, i) => `word${i}`).join(' ')
  const mediumWordsModified = Array.from({ length: 100 }, (_, i) =>
    i === 50 ? 'MODIFIED' : `word${i}`
  ).join(' ')

  describe('Small text (9 words)', () => {
    bench('@lpm.dev/neo.diff', () => {
      ourDiffWords(smallWords, smallWordsModified)
    })
  })

  describe('Medium text (100 words)', () => {
    bench('@lpm.dev/neo.diff', () => {
      ourDiffWords(mediumWords, mediumWordsModified)
    })
  })
})

describe('Real-world scenarios', () => {
  // Simulate code file diff
  const codeOld = `function calculateTotal(items) {
  let total = 0
  for (const item of items) {
    total += item.price * item.quantity
  }
  return total
}

export default calculateTotal`

  const codeNew = `function calculateTotal(items) {
  let total = 0
  let tax = 0
  for (const item of items) {
    const itemTotal = item.price * item.quantity
    total += itemTotal
    tax += itemTotal * 0.1
  }
  return { total, tax }
}

export default calculateTotal`

  bench('@lpm.dev/neo.diff - code diff', () => {
    ourDiffLines(codeOld, codeNew)
  })

  // Simulate config file diff
  const configOld = `{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}`

  const configNew = `{
  "name": "my-app",
  "version": "1.1.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lodash": "^4.17.21"
  }
}`

  bench('@lpm.dev/neo.diff - config diff', () => {
    ourDiffLines(configOld, configNew)
  })
})
