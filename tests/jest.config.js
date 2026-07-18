module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  verbose: true,
  setupFilesAfterEnv: ['./setup.js'],
  testMatch: ['**/*.test.js'],
};
