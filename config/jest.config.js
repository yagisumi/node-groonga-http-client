module.exports = {
  rootDir: process.cwd(),
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'node', 'json'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  coveragePathIgnorePatterns: ['/node_modules/', '\\.d\\.ts$', '\\.(spec|test)\\.ts$'],
  globals: {
    'ts-jest': {
      tsConfig: './tsconfig.json',
    },
  },
  moduleNameMapper: {
    '^@/(.+)': '<rootDir>/src/$1',
  },
}
