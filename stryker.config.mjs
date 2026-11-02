export default {
  mutate: ['src/services/**/*.ts'],
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    configFile: 'tests/unit/jest.config.cjs'
  },
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  coverageAnalysis: 'perTest',
  timeoutMS: 30000,
  timeoutFactor: 5,
  reporters: ['clear-text', 'progress', 'json'],
  jsonReporter: {
    fileName: 'C:\\Users\\HP\\.copilot\\session-state\\e36a3413-8263-4d71-8b71-bf8fec333198\\files\\mutation-report.json'
  },
  thresholds: {
    break: 0,
    high: 80,
    low: 60
  }
};
