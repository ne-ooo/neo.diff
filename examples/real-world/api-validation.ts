/**
 * API Validation Example
 *
 * Demonstrates validating API responses against expected schemas.
 * Useful for API testing, contract testing, and monitoring.
 */

import { diffObjects } from '../../src/index.js'

// Example 1: REST API response validation
console.log('=== Example 1: REST API Response Validation ===\n')

interface UserResponse {
  id: number
  name: string
  email: string
  createdAt: string
}

const expectedSchema: UserResponse = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  createdAt: '2024-01-01T00:00:00Z',
}

const actualResponse: UserResponse = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  createdAt: '2024-01-01T00:00:00Z',
}

const changes = diffObjects(expectedSchema, actualResponse)

if (changes.length === 0) {
  console.log('✅ API response matches expected schema')
} else {
  console.log('❌ API response differs from expected:')
  for (const change of changes) {
    console.log(`  ${change.type}: ${change.path.join('.')}`)
  }
}

// Example 2: Detecting breaking changes
console.log('\n=== Example 2: Detecting Breaking Changes ===\n')

const apiV1 = {
  user: {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
  },
  metadata: {
    version: '1.0',
  },
}

const apiV2 = {
  user: {
    id: 1,
    username: 'alice', // Breaking: 'name' → 'username'
    email: 'alice@example.com',
  },
  metadata: {
    version: '2.0',
    deprecated: ['name'], // Added deprecation info
  },
}

const breakingChanges = diffObjects(apiV1, apiV2)

console.log('Breaking changes detected:')
for (const change of breakingChanges) {
  if (change.type === 'REMOVE') {
    console.log(`  ⚠️  Removed: ${change.path.join('.')}`)
  } else if (change.type === 'CREATE') {
    console.log(`  ℹ️  Added: ${change.path.join('.')}`)
  } else if (change.type === 'CHANGE') {
    console.log(`  🔄 Changed: ${change.path.join('.')}`)
  }
}

// Example 3: GraphQL response validation
console.log('\n=== Example 3: GraphQL Response Validation ===\n')

const expectedGraphQL = {
  data: {
    user: {
      __typename: 'User',
      id: '1',
      posts: [
        { __typename: 'Post', id: '1', title: 'Hello' },
      ],
    },
  },
}

const actualGraphQL = {
  data: {
    user: {
      __typename: 'User',
      id: '1',
      posts: [
        { __typename: 'Post', id: '1', title: 'Hello' },
        { __typename: 'Post', id: '2', title: 'World' },
      ],
    },
  },
}

const gqlChanges = diffObjects(expectedGraphQL, actualGraphQL)

console.log('GraphQL response changes:')
for (const change of gqlChanges) {
  const path = change.path.join('.')
  if (change.type === 'CREATE') {
    console.log(`  + ${path}`)
  }
}

// Example 4: Monitoring API drift
console.log('\n=== Example 4: Monitoring API Drift ===\n')

// Baseline from last week
const baseline = {
  endpoints: {
    users: { count: 100, avgResponseTime: 50 },
    posts: { count: 500, avgResponseTime: 30 },
  },
  errorRate: 0.01,
}

// Current metrics
const current = {
  endpoints: {
    users: { count: 150, avgResponseTime: 75 }, // Slower!
    posts: { count: 600, avgResponseTime: 32 },
  },
  errorRate: 0.05, // Higher error rate!
}

const drift = diffObjects(baseline, current)

console.log('API drift detected:')
for (const change of drift) {
  if (change.type === 'CHANGE') {
    const path = change.path.join('.')
    const diff = Number(change.value) - Number(change.oldValue)
    const direction = diff > 0 ? '⬆️' : '⬇️'
    console.log(`  ${direction} ${path}: ${change.oldValue} → ${change.value}`)
  }
}

// Example 5: Contract testing helper
console.log('\n=== Example 5: Contract Testing Helper ===\n')

function validateContract<T extends Record<string, unknown>>(
  expected: T,
  actual: T,
  contractName: string
): boolean {
  const violations = diffObjects(expected, actual)

  if (violations.length === 0) {
    console.log(`✅ Contract "${contractName}" satisfied`)
    return true
  }

  console.log(`❌ Contract "${contractName}" violated:`)
  for (const violation of violations) {
    const path = violation.path.join('.')
    if (violation.type === 'REMOVE') {
      console.log(`  Missing: ${path}`)
    } else if (violation.type === 'CREATE') {
      console.log(`  Unexpected: ${path}`)
    } else if (violation.type === 'CHANGE') {
      console.log(`  Wrong value at ${path}`)
    }
  }

  return false
}

// Use the contract validator
const contract = {
  status: 200,
  data: {
    id: 1,
    type: 'user',
  },
}

const response1 = {
  status: 200,
  data: {
    id: 1,
    type: 'user',
  },
}

const response2 = {
  status: 200,
  data: {
    id: 1,
    type: 'admin', // Contract violation!
  },
}

validateContract(contract, response1, 'User API v1')
console.log()
validateContract(contract, response2, 'User API v1')

console.log('\n💡 Use cases:')
console.log('  - API integration testing')
console.log('  - Contract testing between services')
console.log('  - Breaking change detection')
console.log('  - API monitoring and drift detection')
