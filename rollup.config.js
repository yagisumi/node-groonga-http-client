import typescript from 'rollup-plugin-typescript2'

export default {
  input: './src/groonga-http-client.ts',
  output: {
    file: './lib/groonga-http-client.js',
    format: 'cjs',
    sourcemap: true,
    sourcemapExcludeSources: true,
  },
  external: ['@yagisumi/groonga-command'],

  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      tsconfigOverride: {
        compilerOptions: {
          module: 'es2015',
          sourceMap: true,
          declaration: false,
        },
      },
    }),
  ],
}
