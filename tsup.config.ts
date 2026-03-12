import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/core/myers.ts',
    'src/core/patience.ts',
    'src/text/index.ts',
    'src/structured/index.ts',
    'src/patch/index.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: true, // Enable for production
  target: 'es2022',
})
