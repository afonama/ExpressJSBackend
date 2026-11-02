/** @type {import('ts-jest').JestConfigWithTsJest} */
// @ts-nocheck

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '[/\\\\]tests[/\\\\]unit[/\\\\]'],
  testTimeout: 30000,
  clearMocks: true,
  maxWorkers: 1,
  moduleNameMapper: {
    '^(\\.\\.?/+.*?)\\.js$': '$1',
  },
};
