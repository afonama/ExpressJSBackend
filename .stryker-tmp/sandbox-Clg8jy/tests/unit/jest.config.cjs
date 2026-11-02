// @ts-nocheck
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../..',
  roots: ['<rootDir>/tests/unit'],
  testMatch: ['**/*.unit.test.ts'],
  setupFiles: ['<rootDir>/tests/unit/setup.ts'],
  clearMocks: true,
  maxWorkers: 1,
  moduleNameMapper: {
    '^\\.\\./lib/prisma\\.js$': '<rootDir>/tests/unit/prisma.mock.ts',
    '^(\\.\\.?/+.*?)\\.js$': '$1',
  },
};
