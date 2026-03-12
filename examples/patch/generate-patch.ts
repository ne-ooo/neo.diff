/**
 * Generate Patch Example
 *
 * Demonstrates creating unified diff patches.
 * Patches can be applied with git apply or patch command.
 */

import { createPatch, formatPatch } from '../../src/index.js'

// Example 1: Simple patch creation
console.log('=== Example 1: Simple Patch ===\n')

const oldCode = `function hello() {
  console.log('Hello')
}
`

const newCode = `function hello(name) {
  console.log('Hello, ' + name)
}
`

const patch = createPatch(oldCode, newCode, 'hello.js', 'hello.js')
const patchText = formatPatch(patch)

console.log(patchText)

// Example 2: Multi-line changes
console.log('=== Example 2: Multi-Line Changes ===\n')

const oldFile = `import React from 'react'

export function Button() {
  return <button>Click me</button>
}
`

const newFile = `import React from 'react'
import { useCallback } from 'react'

export function Button({ onClick }) {
  const handleClick = useCallback(() => {
    onClick?.()
  }, [onClick])

  return <button onClick={handleClick}>Click me</button>
}
`

const multiPatch = createPatch(oldFile, newFile, 'Button.tsx', 'Button.tsx')
const multiPatchText = formatPatch(multiPatch)

console.log(multiPatchText)

// Example 3: With custom headers
console.log('=== Example 3: Custom Headers ===\n')

const v1 = `Version 1.0
Old feature
`

const v2 = `Version 2.0
New feature
Additional feature
`

const customPatch = createPatch(v1, v2, 'config.txt', 'config.txt', {
  oldHeader: 'Version 1.0',
  newHeader: 'Version 2.0',
})

const customPatchText = formatPatch(customPatch)
console.log(customPatchText)

// Example 4: Context lines
console.log('=== Example 4: Different Context Sizes ===\n')

const original = `line 1
line 2
line 3
line 4
line 5
line 6
line 7
line 8
line 9
line 10
`

const modified = `line 1
line 2
line 3
modified line 4
line 5
line 6
line 7
line 8
line 9
line 10
`

// Default context (3 lines)
const patch3 = createPatch(original, modified, 'file.txt', 'file.txt')
console.log('Context = 3 (default):')
console.log(formatPatch(patch3))

// Larger context (5 lines)
const patch5 = createPatch(original, modified, 'file.txt', 'file.txt', { context: 5 })
console.log('\nContext = 5:')
console.log(formatPatch(patch5))

// Example 5: Creating patches for multiple files
console.log('=== Example 5: Multiple File Patches ===\n')

const file1Old = 'const x = 1\n'
const file1New = 'const x = 2\n'

const file2Old = 'const y = 3\n'
const file2New = 'const y = 4\n'

const patch1 = createPatch(file1Old, file1New, 'a/file1.js', 'b/file1.js')
const patch2 = createPatch(file2Old, file2New, 'a/file2.js', 'b/file2.js')

console.log('Patch 1:')
console.log(formatPatch(patch1))
console.log('\nPatch 2:')
console.log(formatPatch(patch2))

console.log('\n💡 Tip: These patches can be applied with:')
console.log('  git apply patch.diff')
console.log('  patch -p1 < patch.diff')
