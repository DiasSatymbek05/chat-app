/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

 
  testTimeout: 30000,

  moduleFileExtensions: ['ts', 'js', 'json'],

  
  roots: ['<rootDir>/tests'],

  
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],

  
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
};