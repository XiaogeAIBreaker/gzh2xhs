/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/test'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.build.json' }] },
    collectCoverageFrom: ['<rootDir>/src/**/*.{ts,js}'],
    coverageDirectory: '<rootDir>/coverage-jest',
}
