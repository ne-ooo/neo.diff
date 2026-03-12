/**
 * Tests for structured diffing (JSON, arrays, objects)
 */

import { describe, it, expect } from 'vitest'
import {
  diffJson,
  diffJsonString,
  diffArrays,
  diffPrimitiveArrays,
  diffObjects,
  applyChanges,
} from '../../src/structured/index.js'

describe('diffJson', () => {
  it('should diff identical JSON values', () => {
    const obj = { name: 'John', age: 30 }
    const result = diffJson(obj, obj)
    expect(result).toHaveLength(1)
    expect(result[0]!.added).toBeUndefined()
    expect(result[0]!.removed).toBeUndefined()
  })

  it('should diff changed JSON values', () => {
    const old = { name: 'John', age: 30 }
    const newObj = { name: 'John', age: 31 }
    const result = diffJson(old, newObj)

    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
  })

  it('should diff added properties', () => {
    const old = { name: 'John' }
    const newObj = { name: 'John', age: 30 }
    const result = diffJson(old, newObj)

    const added = result.filter((c) => c.added).map((c) => c.value).join('')
    expect(added).toContain('age')
    expect(added).toContain('30')
  })

  it('should diff removed properties', () => {
    const old = { name: 'John', age: 30 }
    const newObj = { name: 'John' }
    const result = diffJson(old, newObj)

    const removed = result.filter((c) => c.removed).map((c) => c.value).join('')
    expect(removed).toContain('age')
  })

  it('should diff nested objects', () => {
    const old = { user: { name: 'John', age: 30 } }
    const newObj = { user: { name: 'John', age: 31 } }
    const result = diffJson(old, newObj)

    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
  })

  it('should diff arrays in JSON', () => {
    const old = { items: [1, 2, 3] }
    const newObj = { items: [1, 2, 4] }
    const result = diffJson(old, newObj)

    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
  })
})

describe('diffJsonString', () => {
  it('should diff JSON strings', () => {
    const old = '{"name":"John","age":30}'
    const newJson = '{"name":"John","age":31}'
    const result = diffJsonString(old, newJson)

    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
  })

  it('should handle invalid JSON gracefully', () => {
    const old = '{"invalid'
    const newJson = '{"also invalid'
    const result = diffJsonString(old, newJson)

    // Falls back to string diff
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('diffArrays', () => {
  it('should diff identical arrays', () => {
    const result = diffArrays([1, 2, 3], [1, 2, 3])
    expect(result).toHaveLength(1)
    expect(result[0]!.value).toBe('123')
  })

  it('should diff changed elements', () => {
    const result = diffArrays([1, 2, 3], [1, 2, 4])
    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
  })

  it('should diff added elements', () => {
    const result = diffArrays([1, 2], [1, 2, 3])
    expect(result.some((c) => c.added)).toBe(true)
  })

  it('should diff removed elements', () => {
    const result = diffArrays([1, 2, 3], [1, 2])
    expect(result.some((c) => c.removed)).toBe(true)
  })

  it('should support custom equality', () => {
    const old = [{ id: 1 }, { id: 2 }]
    const newArr = [{ id: 1 }, { id: 3 }]
    const result = diffArrays(old, newArr, (a, b) => a.id === b.id)

    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
  })

  it('should handle empty arrays', () => {
    const result = diffArrays([], [])
    expect(result).toEqual([])
  })
})

describe('diffPrimitiveArrays', () => {
  it('should diff string arrays', () => {
    const result = diffPrimitiveArrays(['a', 'b'], ['a', 'c'])
    expect(result.some((c) => c.removed && c.value === 'b')).toBe(true)
    expect(result.some((c) => c.added && c.value === 'c')).toBe(true)
  })

  it('should diff number arrays', () => {
    const result = diffPrimitiveArrays([1, 2, 3], [1, 2, 4])
    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
  })

  it('should diff boolean arrays', () => {
    const result = diffPrimitiveArrays([true, false], [true, true])
    expect(result.some((c) => c.removed)).toBe(true)
    expect(result.some((c) => c.added)).toBe(true)
  })
})

describe('diffObjects', () => {
  it('should detect CREATE operations', () => {
    const old = { name: 'John' }
    const newObj = { name: 'John', age: 30 }
    const changes = diffObjects(old, newObj)

    expect(changes).toHaveLength(1)
    expect(changes[0]).toEqual({
      type: 'CREATE',
      path: ['age'],
      value: 30,
    })
  })

  it('should detect REMOVE operations', () => {
    const old = { name: 'John', age: 30 }
    const newObj = { name: 'John' }
    const changes = diffObjects(old, newObj)

    expect(changes).toHaveLength(1)
    expect(changes[0]).toEqual({
      type: 'REMOVE',
      path: ['age'],
      oldValue: 30,
    })
  })

  it('should detect CHANGE operations', () => {
    const old = { name: 'John', age: 30 }
    const newObj = { name: 'John', age: 31 }
    const changes = diffObjects(old, newObj)

    expect(changes).toHaveLength(1)
    expect(changes[0]).toEqual({
      type: 'CHANGE',
      path: ['age'],
      oldValue: 30,
      value: 31,
    })
  })

  it('should handle nested objects', () => {
    const old = { user: { name: 'John', age: 30 } }
    const newObj = { user: { name: 'John', age: 31 } }
    const changes = diffObjects(old, newObj)

    expect(changes).toHaveLength(1)
    expect(changes[0]).toEqual({
      type: 'CHANGE',
      path: ['user', 'age'],
      oldValue: 30,
      value: 31,
    })
  })

  it('should handle arrays in objects', () => {
    const old = { items: [1, 2, 3] }
    const newObj = { items: [1, 2, 4] }
    const changes = diffObjects(old, newObj)

    // Arrays are compared element by element
    expect(changes.length).toBeGreaterThan(0)
    expect(changes.some((c) => c.path[0] === 'items')).toBe(true)
  })

  it('should handle multiple changes', () => {
    const old = { a: 1, b: 2, c: 3 }
    const newObj = { a: 1, b: 20, d: 4 }
    const changes = diffObjects(old, newObj)

    expect(changes.length).toBe(3)
    expect(changes.some((c) => c.type === 'CHANGE' && c.path[0] === 'b')).toBe(true)
    expect(changes.some((c) => c.type === 'REMOVE' && c.path[0] === 'c')).toBe(true)
    expect(changes.some((c) => c.type === 'CREATE' && c.path[0] === 'd')).toBe(true)
  })

  it('should handle deep nesting', () => {
    const old = { a: { b: { c: 1 } } }
    const newObj = { a: { b: { c: 2 } } }
    const changes = diffObjects(old, newObj)

    expect(changes).toHaveLength(1)
    expect(changes[0]!.path).toEqual(['a', 'b', 'c'])
  })

  it('should handle identical objects', () => {
    const obj = { name: 'John', age: 30 }
    const changes = diffObjects(obj, obj)

    expect(changes).toHaveLength(0)
  })

  it('should handle empty objects', () => {
    const changes = diffObjects({}, {})
    expect(changes).toHaveLength(0)
  })
})

describe('applyChanges', () => {
  it('should apply CREATE changes', () => {
    const obj = { name: 'John' }
    const changes = [{ type: 'CREATE' as const, path: ['age'], value: 30 }]
    const result = applyChanges(obj, changes)

    expect(result).toEqual({ name: 'John', age: 30 })
  })

  it('should apply CHANGE changes', () => {
    const obj = { name: 'John', age: 30 }
    const changes = [{ type: 'CHANGE' as const, path: ['age'], oldValue: 30, value: 31 }]
    const result = applyChanges(obj, changes)

    expect(result).toEqual({ name: 'John', age: 31 })
  })

  it('should apply REMOVE changes', () => {
    const obj = { name: 'John', age: 30 }
    const changes = [{ type: 'REMOVE' as const, path: ['age'], oldValue: 30 }]
    const result = applyChanges(obj, changes)

    expect(result).toEqual({ name: 'John' })
  })

  it('should apply multiple changes', () => {
    const obj = { a: 1, b: 2, c: 3 }
    const changes = [
      { type: 'CHANGE' as const, path: ['b'], oldValue: 2, value: 20 },
      { type: 'REMOVE' as const, path: ['c'], oldValue: 3 },
      { type: 'CREATE' as const, path: ['d'], value: 4 },
    ]
    const result = applyChanges(obj, changes)

    expect(result).toEqual({ a: 1, b: 20, d: 4 })
  })

  it('should apply nested changes', () => {
    const obj = { user: { name: 'John', age: 30 } }
    const changes = [
      { type: 'CHANGE' as const, path: ['user', 'age'], oldValue: 30, value: 31 },
    ]
    const result = applyChanges(obj, changes)

    expect(result).toEqual({ user: { name: 'John', age: 31 } })
  })

  it('should round-trip with diffObjects', () => {
    const old = { a: 1, b: 2, c: { d: 3 } }
    const newObj = { a: 1, b: 20, c: { d: 3, e: 4 } }

    const changes = diffObjects(old, newObj)
    const result = applyChanges(old, changes)

    expect(result).toEqual(newObj)
  })
})
