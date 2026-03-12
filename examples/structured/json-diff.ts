/**
 * JSON Diff Example
 *
 * Demonstrates JSON object comparison.
 * Useful for comparing API responses, config files, etc.
 */

import { diffJson } from '../../src/index.js'

// Example 1: Simple JSON diff
console.log('=== Example 1: Simple JSON Diff ===\n')

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

const changes = diffJson(oldObj, newObj)

for (const change of changes) {
  if (change.added) {
    console.log('+ ' + change.value.trim())
  } else if (change.removed) {
    console.log('- ' + change.value.trim())
  }
}

// Example 2: API response comparison
console.log('\n=== Example 2: API Response Comparison ===\n')

const oldResponse = {
  status: 200,
  data: {
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ],
  },
}

const newResponse = {
  status: 200,
  data: {
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ],
  },
}

const apiChanges = diffJson(oldResponse, newResponse)

console.log('API changes detected:')
let hasChanges = false
for (const change of apiChanges) {
  if (change.added || change.removed) {
    hasChanges = true
    const prefix = change.added ? '+ ' : '- '
    console.log(prefix + change.value.trim())
  }
}

if (!hasChanges) {
  console.log('No changes')
}

// Example 3: Configuration diff
console.log('\n=== Example 3: Configuration Diff ===\n')

const oldConfig = {
  server: {
    port: 3000,
    host: 'localhost',
  },
  database: {
    url: 'mongodb://localhost',
  },
}

const newConfig = {
  server: {
    port: 3001,
    host: 'localhost',
  },
  database: {
    url: 'mongodb://localhost',
    poolSize: 10,
  },
}

const configChanges = diffJson(oldConfig, newConfig)

console.log('Configuration changes:')
for (const change of configChanges) {
  if (change.added) {
    console.log('+ ' + change.value.trim())
  } else if (change.removed) {
    console.log('- ' + change.value.trim())
  }
}

// Example 4: Package.json diff
console.log('\n=== Example 4: Package.json Diff ===\n')

const oldPkg = {
  name: 'my-app',
  version: '1.0.0',
  dependencies: {
    react: '^18.0.0',
    'react-dom': '^18.0.0',
  },
}

const newPkg = {
  name: 'my-app',
  version: '1.1.0',
  dependencies: {
    react: '^18.2.0',
    'react-dom': '^18.2.0',
    lodash: '^4.17.21',
  },
}

const pkgChanges = diffJson(oldPkg, newPkg)

console.log('Package changes:')
for (const change of pkgChanges) {
  if (change.removed) {
    console.log('- ' + change.value.trim())
  }
  if (change.added) {
    console.log('+ ' + change.value.trim())
  }
}

// Example 5: Ignoring whitespace
console.log('\n=== Example 5: Ignoring Whitespace ===\n')

const compact = { a: 1, b: 2 }
const pretty = { a: 1, b: 2 }

const wsChanges = diffJson(compact, pretty, { ignoreWhitespace: true })

const hasWsChanges = wsChanges.some((c) => c.added || c.removed)
console.log('Changes with ignoreWhitespace:', hasWsChanges)

console.log('\n💡 Tip: diffJson pretty-prints JSON with 2-space indentation')
console.log('  For deep object comparison, use diffObjects() instead')
