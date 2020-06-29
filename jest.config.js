module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFiles: ["<rootDir>/test/setup.ts"],
    testMatch: [ "**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|(js)?test).[jt]s?(x)"],
    testPathIgnorePatterns: ["dist/"]
  };