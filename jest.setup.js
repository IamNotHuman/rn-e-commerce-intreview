/**
 * Global test setup.
 *
 * @testing-library/react-native v13 registers its own matchers on import, so
 * nothing is needed here for expect(). What is needed are the native-module
 * stand-ins: AsyncStorage (redux-persist reaches for it as soon as the store
 * is constructed) and safe-area-context (its provider reads real insets).
 *
 * Both packages ship their mock as an ES default export, so the factory must
 * unwrap `.default`. Returning the module namespace instead leaves every named
 * import undefined, which surfaces as a confusing "Element type is invalid"
 * at render time rather than as a module error.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest').default,
);

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);
