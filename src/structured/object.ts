/**
 * Object diff implementation (microdiff-style)
 *
 * Returns CREATE/REMOVE/CHANGE operations for object differences
 */

import { myersDiff } from '../core/myers.js'
import type { StructuredDiffChange } from '../types.js'

/**
 * Diff two objects and return structured changes
 *
 * Returns an array of changes with operations:
 * - CREATE: Property was added
 * - REMOVE: Property was removed
 * - CHANGE: Property value changed
 *
 * This is similar to the microdiff package but with deep comparison support.
 *
 * @param oldObj - Original object
 * @param newObj - New object
 * @param path - Current path (for recursion)
 * @returns Array of structured changes
 *
 * @example
 * ```typescript
 * const changes = diffObjects(
 *   { name: 'John', age: 30 },
 *   { name: 'John', age: 31, city: 'NYC' }
 * )
 * // => [
 * //   { type: 'CHANGE', path: ['age'], oldValue: 30, value: 31 },
 * //   { type: 'CREATE', path: ['city'], value: 'NYC' }
 * // ]
 * ```
 */
export function diffObjects(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  path: (string | number)[] = [],
  _seen?: Set<unknown>
): StructuredDiffChange[] {
  const seen = _seen ?? new Set<unknown>()

  // Circular reference detection: if we've already visited this pair, skip
  if (seen.has(oldObj) || seen.has(newObj)) {
    // Compare by reference to avoid infinite recursion
    if (oldObj === newObj) return []
    return [{ type: 'CHANGE', path, oldValue: oldObj, value: newObj }]
  }
  seen.add(oldObj)
  seen.add(newObj)

  const changes: StructuredDiffChange[] = []

  // Get all keys from both objects
  const oldKeys = Object.keys(oldObj)
  const newKeys = Object.keys(newObj)
  const allKeys = new Set([...oldKeys, ...newKeys])

  for (const key of allKeys) {
    const currentPath = [...path, key]
    const oldValue = oldObj[key]
    const newValue = newObj[key]

    const hasOld = key in oldObj
    const hasNew = key in newObj

    if (!hasOld && hasNew) {
      // Property was created
      changes.push({
        type: 'CREATE',
        path: currentPath,
        value: newValue,
      })
    } else if (hasOld && !hasNew) {
      // Property was removed
      changes.push({
        type: 'REMOVE',
        path: currentPath,
        oldValue: oldValue,
      })
    } else if (hasOld && hasNew) {
      // Property exists in both - check if changed
      if (isObject(oldValue) && isObject(newValue)) {
        // Recursively diff nested objects
        const nestedChanges = diffObjects(
          oldValue as Record<string, unknown>,
          newValue as Record<string, unknown>,
          currentPath,
          seen
        )
        changes.push(...nestedChanges)
      } else if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        // Diff arrays element by element
        const arrayChanges = diffArray(oldValue, newValue, currentPath, seen)
        changes.push(...arrayChanges)
      } else if (oldValue instanceof Map && newValue instanceof Map) {
        // Diff Maps by converting to objects keyed by string
        const mapChanges = diffMap(oldValue, newValue, currentPath, seen)
        changes.push(...mapChanges)
      } else if (oldValue instanceof Set && newValue instanceof Set) {
        // Diff Sets — compare as whole values (no meaningful path for individual items)
        if (!isEqual(oldValue, newValue, seen)) {
          changes.push({
            type: 'CHANGE',
            path: currentPath,
            oldValue: oldValue,
            value: newValue,
          })
        }
      } else if (!isEqual(oldValue, newValue, seen)) {
        // Value changed
        changes.push({
          type: 'CHANGE',
          path: currentPath,
          oldValue: oldValue,
          value: newValue,
        })
      }
      // If values are equal, no change needed
    }
  }

  return changes
}

/**
 * Diff two arrays for object diffing
 *
 * @param oldArray - Original array
 * @param newArray - New array
 * @param path - Current path
 * @returns Array of structured changes
 */
function diffArray(
  oldArray: unknown[],
  newArray: unknown[],
  path: (string | number)[],
  seen?: Set<unknown>
): StructuredDiffChange[] {
  // Check if all elements are primitives — if so, use Myers for optimal edit script
  const allPrimitive =
    oldArray.every(isPrimitive) && newArray.every(isPrimitive)

  if (allPrimitive) {
    return diffPrimitiveArray(oldArray, newArray, path)
  }

  // For arrays with objects/nested structures, compare index-by-index with recursive diffing
  const changes: StructuredDiffChange[] = []
  const maxLength = Math.max(oldArray.length, newArray.length)

  for (let i = 0; i < maxLength; i++) {
    const currentPath = [...path, i]
    const oldValue = oldArray[i]
    const newValue = newArray[i]

    const hasOld = i < oldArray.length
    const hasNew = i < newArray.length

    if (!hasOld && hasNew) {
      changes.push({ type: 'CREATE', path: currentPath, value: newValue })
    } else if (hasOld && !hasNew) {
      changes.push({ type: 'REMOVE', path: currentPath, oldValue: oldValue })
    } else if (hasOld && hasNew) {
      if (isObject(oldValue) && isObject(newValue)) {
        changes.push(
          ...diffObjects(
            oldValue as Record<string, unknown>,
            newValue as Record<string, unknown>,
            currentPath,
            seen
          )
        )
      } else if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        changes.push(...diffArray(oldValue, newValue, currentPath, seen))
      } else if (!isEqual(oldValue, newValue, seen)) {
        changes.push({
          type: 'CHANGE',
          path: currentPath,
          oldValue: oldValue,
          value: newValue,
        })
      }
    }
  }

  return changes
}

/**
 * Check if a value is a primitive (not object/array)
 */
function isPrimitive(value: unknown): boolean {
  return value === null || typeof value !== 'object'
}

/**
 * Diff two primitive arrays using Myers algorithm for optimal edits
 *
 * Instead of index-by-index comparison, uses Myers to find the minimal
 * set of CREATE/REMOVE operations that transform oldArray → newArray.
 */
function diffPrimitiveArray(
  oldArray: unknown[],
  newArray: unknown[],
  path: (string | number)[]
): StructuredDiffChange[] {
  const oldStrings = oldArray.map((v) => String(v))
  const newStrings = newArray.map((v) => String(v))

  const edits = myersDiff(oldStrings, newStrings)

  const changes: StructuredDiffChange[] = []
  let newIndex = 0

  for (const edit of edits) {
    if (edit.removed) {
      // Elements removed at this position in old array
      // We don't emit REMOVE with exact index since positions shift — use new array index
    } else if (edit.added) {
      const count = edit.count ?? 1
      for (let i = 0; i < count; i++) {
        changes.push({
          type: 'CREATE',
          path: [...path, newIndex],
          value: newArray[newIndex],
        })
        newIndex++
      }
    } else {
      const count = edit.count ?? 1
      newIndex += count
    }
  }

  // Also detect removals by comparing final lengths
  // Myers gives us the diff — convert to structured changes
  // Simpler approach: rebuild changes from the edit script
  // Reset and re-derive using a cleaner mapping
  const result: StructuredDiffChange[] = []
  let oi = 0
  let ni = 0

  for (const edit of edits) {
    const count = edit.count ?? 1
    if (edit.removed) {
      for (let i = 0; i < count; i++) {
        result.push({
          type: 'REMOVE',
          path: [...path, oi + i],
          oldValue: oldArray[oi + i],
        })
      }
      oi += count
    } else if (edit.added) {
      for (let i = 0; i < count; i++) {
        result.push({
          type: 'CREATE',
          path: [...path, ni + i],
          value: newArray[ni + i],
        })
      }
      ni += count
    } else {
      oi += count
      ni += count
    }
  }

  return result
}

/**
 * Diff two Maps by treating string keys like object properties
 */
function diffMap(
  oldMap: Map<unknown, unknown>,
  newMap: Map<unknown, unknown>,
  path: (string | number)[],
  seen?: Set<unknown>
): StructuredDiffChange[] {
  const changes: StructuredDiffChange[] = []
  const allKeys = new Set([...oldMap.keys(), ...newMap.keys()])

  for (const key of allKeys) {
    const keyStr = String(key)
    const currentPath = [...path, keyStr]
    const hasOld = oldMap.has(key)
    const hasNew = newMap.has(key)

    if (!hasOld && hasNew) {
      changes.push({ type: 'CREATE', path: currentPath, value: newMap.get(key) })
    } else if (hasOld && !hasNew) {
      changes.push({ type: 'REMOVE', path: currentPath, oldValue: oldMap.get(key) })
    } else if (hasOld && hasNew) {
      const oldVal = oldMap.get(key)
      const newVal = newMap.get(key)
      if (isObject(oldVal) && isObject(newVal)) {
        changes.push(
          ...diffObjects(
            oldVal as Record<string, unknown>,
            newVal as Record<string, unknown>,
            currentPath,
            seen
          )
        )
      } else if (!isEqual(oldVal, newVal, seen)) {
        changes.push({ type: 'CHANGE', path: currentPath, oldValue: oldVal, value: newVal })
      }
    }
  }

  return changes
}

/**
 * Check if value is a plain object
 *
 * @param value - Value to check
 * @returns true if value is a plain object
 */
function isObject(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  )
}

/**
 * Deep equality check
 *
 * @param a - First value
 * @param b - Second value
 * @returns true if values are deeply equal
 */
function isEqual(a: unknown, b: unknown, _seen?: Set<unknown>): boolean {
  // Same reference or primitive equality
  if (a === b) return true

  // NaN === NaN
  if (Number.isNaN(a) && Number.isNaN(b)) return true

  // Different types
  if (typeof a !== typeof b) return false

  // Null check
  if (a === null || b === null) return false

  // Date comparison
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }

  // RegExp comparison
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString()
  }

  // Map comparison
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false
    for (const [key, val] of a) {
      if (!b.has(key) || !isEqual(val, b.get(key), _seen)) return false
    }
    return true
  }

  // Set comparison
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false
    for (const val of a) {
      if (!b.has(val)) return false
    }
    return true
  }

  // Circular reference protection for objects and arrays
  const seen = _seen ?? new Set<unknown>()
  if (seen.has(a) || seen.has(b)) {
    return a === b // Fall back to reference equality for circular refs
  }

  // Array comparison
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    seen.add(a)
    seen.add(b)
    return a.every((item, index) => isEqual(item, b[index], seen))
  }

  // Object comparison
  if (isObject(a) && isObject(b)) {
    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>
    const aKeys = Object.keys(aObj)
    const bKeys = Object.keys(bObj)

    if (aKeys.length !== bKeys.length) return false

    seen.add(a)
    seen.add(b)
    return aKeys.every((key) => isEqual(aObj[key], bObj[key], seen))
  }

  return false
}

/**
 * Apply structured changes to an object
 *
 * Takes an array of changes and applies them to create a new object.
 *
 * @param obj - Original object
 * @param changes - Array of changes to apply
 * @returns New object with changes applied
 *
 * @example
 * ```typescript
 * const changes = [
 *   { type: 'CHANGE', path: ['age'], value: 31 },
 *   { type: 'CREATE', path: ['city'], value: 'NYC' }
 * ]
 * const result = applyChanges({ name: 'John', age: 30 }, changes)
 * // => { name: 'John', age: 31, city: 'NYC' }
 * ```
 */
export function applyChanges(
  obj: Record<string, unknown>,
  changes: StructuredDiffChange[]
): Record<string, unknown> {
  // Deep clone the object (structuredClone handles Date, RegExp, Map, Set, circular refs)
  const result = structuredClone(obj)

  for (const change of changes) {
    const { type, path } = change

    if (path.length === 0) continue

    // Navigate to parent
    let current: any = result
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i]!
      if (!(key in current)) {
        // Create intermediate objects/arrays as needed
        current[key] = typeof path[i + 1] === 'number' ? [] : {}
      }
      current = current[key]
    }

    const lastKey = path[path.length - 1]!

    if (type === 'CREATE' || type === 'CHANGE') {
      current[lastKey] = change.value
    } else if (type === 'REMOVE') {
      if (Array.isArray(current)) {
        current.splice(Number(lastKey), 1)
      } else {
        delete current[lastKey]
      }
    }
  }

  return result
}
