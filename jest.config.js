/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  globals: { 'ts-jest': { diagnostics: false } },
  transform: {},
  moduleNameMapper: {
    "escape-string-regexp": require.resolve('escape-string-regexp'),
  }
};