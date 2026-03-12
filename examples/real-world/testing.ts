/**
 * Testing Example
 *
 * Demonstrates using diffs in test assertions.
 * Better error messages than simple equality checks.
 */

import { diffLines, diffObjects } from '../../src/index.js'

// Example 1: Snapshot testing alternative
console.log('=== Example 1: Snapshot Testing Alternative ===\n')

function renderComponent() {
  return `<div class="container">
  <h1>Title</h1>
  <p>Content</p>
</div>`
}

const expected = `<div class="container">
  <h1>Title</h1>
  <p>Content</p>
</div>`

const actual = renderComponent()

if (actual !== expected) {
  console.log('❌ Test failed. Diff:')
  const changes = diffLines(expected, actual)
  for (const change of changes) {
    if (change.added) {
      console.log('\x1b[32m+ ' + change.value.trim() + '\x1b[0m')
    } else if (change.removed) {
      console.log('\x1b[31m- ' + change.value.trim() + '\x1b[0m')
    }
  }
} else {
  console.log('✅ Test passed')
}

// Example 2: API response assertion
console.log('\n=== Example 2: API Response Assertion ===\n')

async function fetchUser() {
  return {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    role: 'admin',
  }
}

const expectedResponse = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  role: 'user', // Wrong!
}

const actualResponse = await fetchUser()

const apiChanges = diffObjects(expectedResponse, actualResponse)

if (apiChanges.length > 0) {
  console.log('❌ API response mismatch:')
  for (const change of apiChanges) {
    const path = change.path.join('.')
    if (change.type === 'CHANGE') {
      console.log(`  ${path}: expected "${change.oldValue}", got "${change.value}"`)
    }
  }
} else {
  console.log('✅ API response matches')
}

// Example 3: Configuration validation
console.log('\n=== Example 3: Configuration Validation ===\n')

const defaultConfig = {
  server: { port: 3000, host: 'localhost' },
  database: { url: 'mongodb://localhost' },
  features: { auth: true, analytics: false },
}

const userConfig = {
  server: { port: 8080, host: 'localhost' },
  database: { url: 'mongodb://production' },
  features: { auth: true, analytics: true },
}

const configChanges = diffObjects(defaultConfig, userConfig)

console.log('Configuration overrides:')
for (const change of configChanges) {
  if (change.type === 'CHANGE') {
    const path = change.path.join('.')
    console.log(`  ${path}: ${change.oldValue} → ${change.value}`)
  }
}

// Example 4: Database migration validation
console.log('\n=== Example 4: Database Migration Validation ===\n')

const schemaBefore = `CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100)
);`

const schemaAfter = `CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255)
);`

const migrationDiff = diffLines(schemaBefore, schemaAfter)

console.log('Migration changes:')
for (const change of migrationDiff) {
  if (change.added) {
    console.log('\x1b[32m+ ' + change.value.trim() + '\x1b[0m')
  } else if (change.removed) {
    console.log('\x1b[31m- ' + change.value.trim() + '\x1b[0m')
  }
}

// Example 5: Test helper function
console.log('\n=== Example 5: Test Helper Function ===\n')

function assertObjectEquals(actual: unknown, expected: unknown, message?: string) {
  const changes = diffObjects(
    expected as Record<string, unknown>,
    actual as Record<string, unknown>
  )

  if (changes.length > 0) {
    console.log(`❌ ${message || 'Assertion failed'}:`)
    for (const change of changes) {
      const path = change.path.join('.')
      if (change.type === 'CREATE') {
        console.log(`  + ${path}: ${JSON.stringify(change.value)}`)
      } else if (change.type === 'REMOVE') {
        console.log(`  - ${path}: ${JSON.stringify(change.oldValue)}`)
      } else if (change.type === 'CHANGE') {
        console.log(`  ~ ${path}: ${JSON.stringify(change.oldValue)} → ${JSON.stringify(change.value)}`)
      }
    }
    return false
  }

  console.log(`✅ ${message || 'Assertion passed'}`)
  return true
}

// Use the helper
const testObj = { a: 1, b: 2 }
const expectedObj = { a: 1, b: 2, c: 3 }

assertObjectEquals(testObj, expectedObj, 'Object comparison')

console.log('\n💡 Benefits for testing:')
console.log('  - Better error messages than simple equality')
console.log('  - See exactly what changed')
console.log('  - Easier debugging of test failures')
console.log('  - Works with complex nested structures')
