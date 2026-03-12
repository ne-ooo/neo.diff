/**
 * Array Diff Example
 *
 * Demonstrates array comparison with custom equality.
 * Useful for comparing lists of items.
 */

import { diffArrays } from '../../src/index.js'

// Example 1: Simple array diff
console.log('=== Example 1: Simple Array Diff ===\n')

const oldArray = [1, 2, 3, 4]
const newArray = [1, 2, 5, 4]

const changes = diffArrays(oldArray, newArray)

console.log('Changes:')
for (const change of changes) {
  if (change.added) {
    console.log(`+ ${change.value}`)
  } else if (change.removed) {
    console.log(`- ${change.value}`)
  } else {
    console.log(`  ${change.value}`)
  }
}

// Example 2: String array diff
console.log('\n=== Example 2: String Array Diff ===\n')

const oldTags = ['javascript', 'react', 'node']
const newTags = ['javascript', 'react', 'typescript', 'node']

const tagChanges = diffArrays(oldTags, newTags)

console.log('Tag changes:')
for (const change of tagChanges) {
  if (change.added) {
    console.log(`  Added: ${change.value}`)
  } else if (change.removed) {
    console.log(`  Removed: ${change.value}`)
  }
}

// Example 3: Object array with custom equality
console.log('\n=== Example 3: Object Array (Custom Equality) ===\n')

const oldUsers = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
]

const newUsers = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
]

// Compare by id
const userChanges = diffArrays(
  oldUsers,
  newUsers,
  (a, b) => a.id === b.id
)

console.log('User changes:')
for (const change of userChanges) {
  if (change.added) {
    console.log(`  + ${JSON.stringify(change.value)}`)
  } else if (change.removed) {
    console.log(`  - ${JSON.stringify(change.value)}`)
  }
}

// Example 4: Modified objects (no custom equality)
console.log('\n=== Example 4: Detecting Object Modifications ===\n')

const oldItems = [
  { id: 1, status: 'pending' },
  { id: 2, status: 'pending' },
]

const newItems = [
  { id: 1, status: 'completed' },
  { id: 2, status: 'pending' },
]

const itemChanges = diffArrays(oldItems, newItems)

console.log('Status changes:')
for (const change of itemChanges) {
  if (change.removed) {
    console.log(`  - Item ${change.value.id}: ${change.value.status}`)
  }
  if (change.added) {
    console.log(`  + Item ${change.value.id}: ${change.value.status}`)
  }
}

// Example 5: Reordered array
console.log('\n=== Example 5: Reordered Array ===\n')

const ordered = ['a', 'b', 'c', 'd']
const reordered = ['b', 'a', 'c', 'd']

const reorderChanges = diffArrays(ordered, reordered)

console.log('Reorder detected:')
const hasChanges = reorderChanges.some((c) => c.added || c.removed)
if (hasChanges) {
  console.log('  Array was reordered')
  for (const change of reorderChanges) {
    if (change.removed) {
      console.log(`  - ${change.value}`)
    }
    if (change.added) {
      console.log(`  + ${change.value}`)
    }
  }
} else {
  console.log('  Arrays are identical')
}

// Example 6: Added and removed items
console.log('\n=== Example 6: Mixed Add/Remove ===\n')

const list1 = ['apple', 'banana', 'cherry', 'date']
const list2 = ['apple', 'blueberry', 'cherry', 'fig']

const listChanges = diffArrays(list1, list2)

const added = listChanges.filter((c) => c.added).map((c) => c.value)
const removed = listChanges.filter((c) => c.removed).map((c) => c.value)

console.log('Added:', added.join(', '))
console.log('Removed:', removed.join(', '))

// Example 7: Empty arrays
console.log('\n=== Example 7: Empty Arrays ===\n')

const empty: number[] = []
const filled = [1, 2, 3]

const emptyChanges1 = diffArrays(empty, filled)
const emptyChanges2 = diffArrays(filled, empty)

console.log('Empty → Filled:', emptyChanges1.some((c) => c.added))
console.log('Filled → Empty:', emptyChanges2.some((c) => c.removed))

console.log('\n💡 Tips:')
console.log('  - Use custom equality for object arrays')
console.log('  - Compare by unique ID for better tracking')
console.log('  - For object property changes, use diffObjects()')
