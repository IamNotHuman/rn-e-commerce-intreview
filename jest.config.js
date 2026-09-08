/**
 * Test harness for the RnEcommerce technical exam.
 *
 * The transformIgnorePatterns allowlist exists because several runtime deps
 * ship untranspiled ESM (async-storage v3 resolves to lib/module, and the
 * navigation + screens packages ship modern syntax). Jest must transform them
 * rather than skip them, so each is negated out of the node_modules ignore.
 */
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(?:.pnpm/)?(?:' +
      [
        '@react-native',
        'react-native',
        '@react-navigation',
        'react-native-screens',
        'react-native-safe-area-context',
        '@react-native-async-storage',
        'styled-components',
        'redux-persist',
        'immer',
        'redux-thunk',
        'reselect',
        'redux',
        'react-redux',
      ].join('|') +
      ')/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.type.ts',
    '!src/**/index.ts',
    // Declaration files have no runtime lines to instrument; left in, styled.d.ts
    // sits in the report as a permanent 0% row and understates the real figure.
    '!src/**/*.d.ts',
  ],
  /**
   * A ratchet, not an aspiration. These three layers are pure logic with no
   * rendering in them, they are already at 100%, and every branch in them is
   * cheap to reach from a plain function call — so the threshold cannot fail
   * today and starts failing the moment a reducer case, a mapper branch or a
   * selector lands without a test. That is the regression worth gating on.
   *
   * Deliberately no global key and nothing on screens/ or *.style.ts. A
   * styled-components interpolation does not execute until something renders,
   * so a style file's coverage measures whether it was mounted, not whether it
   * was tested — a percentage there is raised by a smoke render rather than by
   * a better test. Screen coverage is left to the behaviours in Rule 14.
   *
   * Glob keys are enforced per matching file, not averaged over the group, so
   * one untested new selector cannot hide behind twelve tested ones.
   */
  coverageThreshold: {
    'src/features/**/*.ts': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    'src/api/**/*.ts': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    'src/utils/**/*.ts': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};
