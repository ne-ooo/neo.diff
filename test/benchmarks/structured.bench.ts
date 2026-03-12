/**
 * Performance benchmarks for structured diffing
 *
 * JSON, arrays, and objects (vs microdiff)
 */

import { bench, describe } from 'vitest'
import { diffJson, diffArrays, diffObjects } from '../../src/index.js'

describe('JSON Diff Performance', () => {
  const smallObj = { name: 'John', age: 30, city: 'NYC' }
  const smallObjModified = { name: 'John', age: 31, city: 'NYC', country: 'USA' }

  const mediumObj = Object.fromEntries(
    Array.from({ length: 50 }, (_, i) => [`key${i}`, `value${i}`])
  )
  const mediumObjModified = Object.fromEntries(
    Array.from({ length: 50 }, (_, i) => [`key${i}`, i === 25 ? 'MODIFIED' : `value${i}`])
  )

  const largeObj = Object.fromEntries(
    Array.from({ length: 500 }, (_, i) => [`key${i}`, `value${i}`])
  )
  const largeObjModified = Object.fromEntries(
    Array.from({ length: 500 }, (_, i) => [`key${i}`, i % 50 === 0 ? 'MODIFIED' : `value${i}`])
  )

  bench('Small JSON (3 keys)', () => {
    diffJson(smallObj, smallObjModified)
  })

  bench('Medium JSON (50 keys)', () => {
    diffJson(mediumObj, mediumObjModified)
  })

  bench('Large JSON (500 keys)', () => {
    diffJson(largeObj, largeObjModified)
  })
})

describe('Array Diff Performance', () => {
  const smallArray = [1, 2, 3, 4, 5]
  const smallArrayModified = [1, 2, 99, 4, 5]

  const mediumArray = Array.from({ length: 100 }, (_, i) => i)
  const mediumArrayModified = Array.from({ length: 100 }, (_, i) => (i === 50 ? 999 : i))

  const largeArray = Array.from({ length: 1000 }, (_, i) => i)
  const largeArrayModified = Array.from({ length: 1000 }, (_, i) => (i % 100 === 0 ? 999 : i))

  bench('Small array (5 elements)', () => {
    diffArrays(smallArray, smallArrayModified)
  })

  bench('Medium array (100 elements)', () => {
    diffArrays(mediumArray, mediumArrayModified)
  })

  bench('Large array (1000 elements)', () => {
    diffArrays(largeArray, largeArrayModified)
  })
})

describe('Object Diff Performance (microdiff-style)', () => {
  const smallObj = { name: 'John', age: 30, city: 'NYC' }
  const smallObjModified = { name: 'John', age: 31, city: 'NYC', country: 'USA' }

  const nestedObj = {
    user: { name: 'John', age: 30, address: { city: 'NYC', zip: '10001' } },
    settings: { theme: 'dark', notifications: true },
  }
  const nestedObjModified = {
    user: { name: 'John', age: 31, address: { city: 'NYC', zip: '10002' } },
    settings: { theme: 'light', notifications: true },
  }

  const deeplyNested = {
    level1: {
      level2: {
        level3: {
          level4: {
            level5: { value: 42 },
          },
        },
      },
    },
  }
  const deeplyNestedModified = {
    level1: {
      level2: {
        level3: {
          level4: {
            level5: { value: 99 },
          },
        },
      },
    },
  }

  bench('Small object (3 keys)', () => {
    diffObjects(smallObj, smallObjModified)
  })

  bench('Nested object (2 levels)', () => {
    diffObjects(nestedObj, nestedObjModified)
  })

  bench('Deeply nested object (5 levels)', () => {
    diffObjects(deeplyNested, deeplyNestedModified)
  })
})

describe('Real-world scenarios', () => {
  // Simulate API response diff
  const apiResponse = {
    status: 200,
    data: {
      users: Array.from({ length: 20 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        active: true,
      })),
      pagination: { page: 1, total: 100 },
    },
  }

  const apiResponseModified = {
    status: 200,
    data: {
      users: Array.from({ length: 20 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        active: i !== 5, // User 5 is now inactive
      })),
      pagination: { page: 1, total: 101 },
    },
  }

  bench('API response diff', () => {
    diffObjects(apiResponse, apiResponseModified)
  })

  // Simulate config object diff
  const config = {
    server: { port: 3000, host: 'localhost' },
    database: { url: 'mongodb://localhost', poolSize: 10 },
    features: { auth: true, analytics: false, cache: true },
  }

  const configModified = {
    server: { port: 3001, host: 'localhost' },
    database: { url: 'mongodb://localhost', poolSize: 20 },
    features: { auth: true, analytics: true, cache: true },
  }

  bench('Config object diff', () => {
    diffObjects(config, configModified)
  })
})
