/**
 * Apply Patch Example
 *
 * Demonstrates applying unified diff patches to source text.
 * Supports both string patches and ParsedPatch objects.
 */

import { createPatch, formatPatch, applyPatch } from '../../src/index.js'

// Example 1: Simple patch application
console.log('=== Example 1: Simple Patch Application ===\n')

const source = `function hello() {
  console.log('Hello')
}
`

const target = `function hello(name) {
  console.log('Hello, ' + name)
}
`

// Create patch
const patch = createPatch(source, target, 'hello.js', 'hello.js')
const patchText = formatPatch(patch)

console.log('Original:')
console.log(source)

console.log('Patch:')
console.log(patchText)

// Apply patch
const result = applyPatch(source, patchText)

console.log('Result:')
console.log(result)

console.log('Match:', result === target)

// Example 2: Multiple hunks
console.log('\n=== Example 2: Multiple Hunks ===\n')

const multiSource = `line 1
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

const multiTarget = `line 1
modified line 2
line 3
line 4
line 5
line 6
modified line 7
line 8
line 9
line 10
`

const multiPatch = formatPatch(createPatch(multiSource, multiTarget, 'file.txt', 'file.txt'))
const multiResult = applyPatch(multiSource, multiPatch)

console.log('Applied patch with multiple hunks:')
console.log('Match:', multiResult === multiTarget)

// Example 3: Patch application with validation
console.log('\n=== Example 3: Patch Validation ===\n')

const original = `const x = 1
const y = 2
const z = 3
`

const updated = `const x = 1
const y = 20
const z = 3
`

const validPatch = formatPatch(createPatch(original, updated, 'vars.js', 'vars.js'))

console.log('Applying valid patch...')
const validResult = applyPatch(original, validPatch)
console.log('Success:', validResult !== false)

console.log('\nApplying to wrong source...')
const wrongSource = 'completely different content'
const invalidResult = applyPatch(wrongSource, validPatch)
console.log('Success:', invalidResult !== false)

// Example 4: Real-world code patching
console.log('\n=== Example 4: Real-World Code Patching ===\n')

const oldCode = `import React from 'react'

export function TodoList({ items }) {
  return (
    <ul>
      {items.map(item => <li>{item}</li>)}
    </ul>
  )
}
`

const newCode = `import React from 'react'

export function TodoList({ items }) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}
`

const codePatch = formatPatch(createPatch(oldCode, newCode, 'TodoList.tsx', 'TodoList.tsx'))

console.log('Patch:')
console.log(codePatch)

const patchedCode = applyPatch(oldCode, codePatch)

console.log('Patched successfully:', patchedCode === newCode)

// Example 5: Configuration file updates
console.log('\n=== Example 5: Configuration File Updates ===\n')

const oldConfig = `{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0"
  }
}
`

const newConfig = `{
  "name": "my-app",
  "version": "1.1.0",
  "dependencies": {
    "react": "^18.2.0"
  }
}
`

const configPatch = formatPatch(createPatch(oldConfig, newConfig, 'package.json', 'package.json'))

console.log('Config patch:')
console.log(configPatch)

const patchedConfig = applyPatch(oldConfig, configPatch)
console.log('\nPatched config matches:', patchedConfig === newConfig)

console.log('\n💡 Tips:')
console.log('  - applyPatch returns false if patch cannot be applied')
console.log('  - Works with patches from git diff or createPatch()')
console.log('  - Supports fuzzy matching for slight variations')
