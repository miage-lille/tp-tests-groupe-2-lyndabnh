import { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '\\.(e2e)\\.test\\.ts$',
  verbose: true,
  rootDir: '.',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1', 
  },
  testTimeout: 30000, 
};

export default config;