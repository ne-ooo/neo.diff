/**
 * Configuration Diff Example
 *
 * Demonstrates comparing configuration files.
 * Useful for deployment validation, config auditing, and change tracking.
 */

import { diffObjects, diffLines, diffJson } from '../../src/index.js'

// Example 1: Environment config comparison
console.log('=== Example 1: Environment Config Comparison ===\n')

const devConfig = {
  NODE_ENV: 'development',
  API_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://localhost:5432/dev',
  LOG_LEVEL: 'debug',
  ENABLE_CACHE: false,
}

const prodConfig = {
  NODE_ENV: 'production',
  API_URL: 'https://api.example.com',
  DATABASE_URL: 'postgresql://prod-db:5432/prod',
  LOG_LEVEL: 'error',
  ENABLE_CACHE: true,
}

const envChanges = diffObjects(devConfig, prodConfig)

console.log('Dev → Production changes:')
for (const change of envChanges) {
  if (change.type === 'CHANGE') {
    const key = change.path[0]
    console.log(`  ${key}:`)
    console.log(`    Dev:  ${change.oldValue}`)
    console.log(`    Prod: ${change.value}`)
  }
}

// Example 2: Package.json version diff
console.log('\n=== Example 2: Package.json Version Diff ===\n')

const oldPackage = {
  name: 'my-app',
  version: '1.0.0',
  dependencies: {
    react: '^18.0.0',
    'react-dom': '^18.0.0',
    axios: '^0.27.0',
  },
  devDependencies: {
    typescript: '^4.9.0',
    vitest: '^0.34.0',
  },
}

const newPackage = {
  name: 'my-app',
  version: '1.1.0',
  dependencies: {
    react: '^18.2.0',
    'react-dom': '^18.2.0',
    axios: '^1.0.0',
    lodash: '^4.17.21', // New dependency
  },
  devDependencies: {
    typescript: '^5.0.0',
    vitest: '^0.34.0',
  },
}

const pkgChanges = diffObjects(oldPackage, newPackage)

console.log('Package changes:')
for (const change of pkgChanges) {
  const path = change.path.join('.')
  if (change.type === 'CREATE') {
    console.log(`  + ${path}: ${change.value}`)
  } else if (change.type === 'CHANGE') {
    console.log(`  ~ ${path}: ${change.oldValue} → ${change.value}`)
  }
}

// Example 3: Docker compose diff
console.log('\n=== Example 3: Docker Compose Diff ===\n')

const oldCompose = `version: '3.8'
services:
  web:
    image: nginx:1.21
    ports:
      - "80:80"
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: mydb`

const newCompose = `version: '3.8'
services:
  web:
    image: nginx:1.25
    ports:
      - "80:80"
      - "443:443"
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: mydb
  redis:
    image: redis:7`

const composeChanges = diffLines(oldCompose, newCompose)

console.log('Docker Compose changes:')
for (const change of composeChanges) {
  if (change.added) {
    console.log('\x1b[32m+ ' + change.value.trim() + '\x1b[0m')
  } else if (change.removed) {
    console.log('\x1b[31m- ' + change.value.trim() + '\x1b[0m')
  }
}

// Example 4: Feature flags diff
console.log('\n=== Example 4: Feature Flags Diff ===\n')

const oldFlags = {
  features: {
    newDashboard: { enabled: false, rollout: 0 },
    darkMode: { enabled: true, rollout: 100 },
    betaFeatures: { enabled: false, rollout: 0 },
  },
}

const newFlags = {
  features: {
    newDashboard: { enabled: true, rollout: 25 }, // Gradual rollout
    darkMode: { enabled: true, rollout: 100 },
    betaFeatures: { enabled: true, rollout: 10 },
    aiAssistant: { enabled: true, rollout: 5 }, // New feature
  },
}

const flagChanges = diffObjects(oldFlags, newFlags)

console.log('Feature flag changes:')
for (const change of flagChanges) {
  const path = change.path.join('.')
  if (change.type === 'CREATE') {
    console.log(`  🆕 New: ${path}`)
  } else if (change.type === 'CHANGE') {
    console.log(`  🔄 Updated: ${path}`)
    console.log(`     ${change.oldValue} → ${change.value}`)
  }
}

// Example 5: Config audit trail
console.log('\n=== Example 5: Config Audit Trail ===\n')

interface ConfigVersion {
  timestamp: string
  config: Record<string, unknown>
}

const versions: ConfigVersion[] = [
  {
    timestamp: '2024-01-01',
    config: { apiKey: 'old-key', timeout: 5000 },
  },
  {
    timestamp: '2024-01-15',
    config: { apiKey: 'new-key', timeout: 5000 },
  },
  {
    timestamp: '2024-02-01',
    config: { apiKey: 'new-key', timeout: 10000, retries: 3 },
  },
]

console.log('Configuration history:')
for (let i = 1; i < versions.length; i++) {
  const prev = versions[i - 1]
  const curr = versions[i]
  const changes = diffObjects(prev.config, curr.config)

  if (changes.length > 0) {
    console.log(`\n  ${prev.timestamp} → ${curr.timestamp}:`)
    for (const change of changes) {
      const key = change.path[0]
      if (change.type === 'CREATE') {
        console.log(`    + ${key}: ${change.value}`)
      } else if (change.type === 'CHANGE') {
        console.log(`    ~ ${key}: ${change.oldValue} → ${change.value}`)
      }
    }
  }
}

// Example 6: Terraform/infrastructure config
console.log('\n=== Example 6: Infrastructure Config ===\n')

const oldInfra = {
  instances: {
    web: { count: 2, type: 't3.small' },
    db: { count: 1, type: 't3.medium' },
  },
  storage: { size: 100, type: 'gp2' },
}

const newInfra = {
  instances: {
    web: { count: 4, type: 't3.medium' }, // Scaled up
    db: { count: 2, type: 't3.large' }, // More powerful
  },
  storage: { size: 200, type: 'gp3' }, // Upgraded
}

const infraChanges = diffObjects(oldInfra, newInfra)

console.log('Infrastructure changes:')
let costImpact = 0
for (const change of infraChanges) {
  const path = change.path.join('.')
  if (change.type === 'CHANGE') {
    console.log(`  ${path}: ${change.oldValue} → ${change.value}`)
    if (path.includes('count') || path.includes('size')) {
      costImpact++
    }
  }
}

console.log(`\n⚠️  ${costImpact} changes may impact costs`)

console.log('\n💡 Use cases:')
console.log('  - Pre-deployment validation')
console.log('  - Configuration auditing')
console.log('  - Change tracking and approval')
console.log('  - Environment comparison')
console.log('  - Feature flag management')
