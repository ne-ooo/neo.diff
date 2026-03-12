/**
 * Object Diff Example
 *
 * Demonstrates microdiff-style deep object comparison.
 * Returns structured changes with paths and values.
 */

import { diffObjects } from '../../src/index.js'

// Example 1: Simple object diff
console.log('=== Example 1: Simple Object Diff ===\n')

const oldObj = {
  name: 'John',
  age: 30,
  city: 'NYC',
}

const newObj = {
  name: 'John',
  age: 31,
  city: 'NYC',
  country: 'USA',
}

const changes = diffObjects(oldObj, newObj)

for (const change of changes) {
  const pathStr = change.path.join('.')
  if (change.type === 'CREATE') {
    console.log(`+ ${pathStr}: ${JSON.stringify(change.value)}`)
  } else if (change.type === 'REMOVE') {
    console.log(`- ${pathStr}: ${JSON.stringify(change.oldValue)}`)
  } else if (change.type === 'CHANGE') {
    console.log(`~ ${pathStr}: ${JSON.stringify(change.oldValue)} → ${JSON.stringify(change.value)}`)
  }
}

// Example 2: Nested object diff
console.log('\n=== Example 2: Nested Object Diff ===\n')

const oldNested = {
  user: {
    name: 'Alice',
    profile: {
      age: 25,
      city: 'NYC',
    },
  },
}

const newNested = {
  user: {
    name: 'Alice',
    profile: {
      age: 26,
      city: 'LA',
    },
  },
}

const nestedChanges = diffObjects(oldNested, newNested)

console.log('Nested changes:')
for (const change of nestedChanges) {
  console.log(`  ${change.type}: ${change.path.join('.')}`)
  if (change.type === 'CHANGE') {
    console.log(`    Old: ${change.oldValue}`)
    console.log(`    New: ${change.value}`)
  }
}

// Example 3: Array changes within objects
console.log('\n=== Example 3: Array Changes ===\n')

const oldData = {
  tags: ['javascript', 'react'],
  count: 2,
}

const newData = {
  tags: ['javascript', 'react', 'typescript'],
  count: 3,
}

const arrayChanges = diffObjects(oldData, newData)

console.log('Changes:')
for (const change of arrayChanges) {
  const pathStr = change.path.join('.')
  console.log(`  ${change.type} at ${pathStr}`)
  if (change.type === 'CREATE') {
    console.log(`    Value: ${JSON.stringify(change.value)}`)
  } else if (change.type === 'CHANGE') {
    console.log(`    Old: ${JSON.stringify(change.oldValue)}`)
    console.log(`    New: ${JSON.stringify(change.value)}`)
  }
}

// Example 4: Deep nesting
console.log('\n=== Example 4: Deep Nesting ===\n')

const oldDeep = {
  level1: {
    level2: {
      level3: {
        value: 42,
      },
    },
  },
}

const newDeep = {
  level1: {
    level2: {
      level3: {
        value: 99,
      },
    },
  },
}

const deepChanges = diffObjects(oldDeep, newDeep)

console.log('Deep change detected:')
for (const change of deepChanges) {
  console.log(`  Path: ${change.path.join(' → ')}`)
  if (change.type === 'CHANGE') {
    console.log(`  Changed from ${change.oldValue} to ${change.value}`)
  }
}

// Example 5: Real-world state diff
console.log('\n=== Example 5: Real-World State Diff ===\n')

const oldState = {
  user: {
    id: 1,
    name: 'Alice',
    settings: {
      theme: 'dark',
      notifications: true,
    },
  },
  posts: [{ id: 1, title: 'Hello' }],
}

const newState = {
  user: {
    id: 1,
    name: 'Alice',
    settings: {
      theme: 'light',
      notifications: true,
      language: 'en',
    },
  },
  posts: [
    { id: 1, title: 'Hello' },
    { id: 2, title: 'World' },
  ],
}

const stateChanges = diffObjects(oldState, newState)

console.log(`${stateChanges.length} changes detected:`)
for (const change of stateChanges) {
  const pathStr = change.path.join('.')
  if (change.type === 'CREATE') {
    console.log(`  + ${pathStr}`)
  } else if (change.type === 'CHANGE') {
    console.log(`  ~ ${pathStr}`)
  } else if (change.type === 'REMOVE') {
    console.log(`  - ${pathStr}`)
  }
}

console.log('\n💡 Tip: diffObjects() is perfect for:')
console.log('  - State management diffs (Redux, Zustand)')
console.log('  - API response validation')
console.log('  - Configuration tracking')
console.log('  - Test assertions')
