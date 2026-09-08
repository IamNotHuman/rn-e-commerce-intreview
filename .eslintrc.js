/**
 * Architecture enforcement for the RnEcommerce technical exam.
 *
 * The numbered rules referenced in the messages below are the rules in
 * CLAUDE.md / .claude/skills/rn-ecommerce-architecture. Anything mechanically
 * checkable lives here so a violation is a lint failure, not a code-review
 * opinion. Judgment-level rules (derived state in selectors, no refetching
 * /products/:id, status enum shape) stay in the skill.
 *
 * NOTE ON `overrides`: for a given file the LAST matching override wins
 * outright for `no-restricted-imports` — it replaces, it does not merge. Every
 * override therefore restates the full set of restrictions it wants, with the
 * ones it deliberately lifts omitted.
 */

// Rule 6 — styling lives in *.style.ts as styled-components.
const noStyleSheet = {
  name: 'react-native',
  importNames: ['StyleSheet'],
  message:
    'Rule 6: no StyleSheet.create. All styling belongs in a *.style.ts file as styled-components.',
};

const reactRedux = {
  group: ['react-redux'],
  message:
    'Rules 1 & 2: react-redux is only importable from *.container.tsx, src/app/*, and App.tsx. Presentational files receive resolved props and callbacks.',
};

const typedHooks = {
  group: ['**/app/hooks', '**/app/hooks.*'],
  message:
    'Rule 2: useAppSelector / useAppDispatch belong in *.container.tsx only.',
};

const store = {
  group: ['**/app/store', '**/app/store.*'],
  message:
    'Rule 1: nothing imports the store directly except src/app/* and App.tsx. Containers use the typed hooks.',
};

const navigation = {
  group: ['@react-navigation', '@react-navigation/*'],
  message:
    'Rule 2: navigation is a container/navigator concern. Presentational files take an onPress callback instead.',
};

const styled = {
  group: ['styled-components', 'styled-components/*'],
  message: 'Rule 6: import styled-components in *.style.ts only.',
};

// Rule 5 — index.ts is a folder's only public entrance. Same-folder imports
// ('./Foo.style') are fine; reaching into another folder's internals is not.
//
// `.type` needs narrower patterns than the rest. Only components and screens
// are index-fronted folders; `api/` deliberately has no index.ts, and slices
// and containers are meant to import '../../api/fakeStoreApi.type' directly.
// A blanket '../**/*.type' would flag those legitimate imports, so the two
// shapes of a real violation are matched instead: a sibling folder inside
// components/ or screens/ ('../ProductCard/ProductCard.type'), and a
// cross-layer reach-in ('../../components/ProductCard/ProductCard.type').
const innerFiles = {
  group: [
    '../**/*.component',
    '../**/*.container',
    '../**/*.style',
    '../*/*.type',
    '**/components/*/*.type',
    '**/screens/*/*.type',
  ],
  message:
    'Rule 5: import the folder, not the file inside it. index.ts is the only public entrance.',
};

// The @typescript-eslint variant is used rather than the base rule because it
// understands `import type`. That distinction is what lets selectors depend on
// the *shape* of RootState without taking a runtime dependency on the store.
const restrict = patterns => ({
  'no-restricted-imports': 'off',
  '@typescript-eslint/no-restricted-imports': [
    'error',
    {paths: [noStyleSheet], patterns},
  ],
});

// R1 permits selectors to know the root state type. `import type` is erased at
// compile time, so no import edge from features/ to app/ survives into the
// bundle; a value import of the store stays banned.
const storeTypeOnly = {...store, allowTypeImports: true};

// Code-quality baseline (see CLAUDE.md "Code quality"). These are deliberately
// a short curated list rather than a preset. `eslint-config-airbnb` was the
// obvious candidate and was rejected: its `import/prefer-default-export`
// contradicts Rule 5 — every index.ts here is a named-export barrel, and the
// three screen barrels export exactly one symbol each — and airbnb-typescript
// needs type-aware linting (`parserOptions.project`), which would put a second
// full program build inside a PostToolUse hook that already runs `tsc --noEmit`.
//
// `react/jsx-no-bind` was also considered and rejected. The inline arrows in
// ProductCard (`onPress={() => onPress(id)}`) are created inside the memoized
// row, not inside `renderItem`, so they do not defeat the memo — Rule 2b is
// about the *prop* shape the container passes in. The rule cannot tell the two
// apart and would flag correct code.
const qualityRules = {
  // @react-native/eslint-config leaves this at 0.
  'no-console': 'error',
  // Upgraded from the config's [1, 'allow-null'] — warn-level and null-exempt.
  eqeqeq: ['error', 'always'],
  curly: ['error', 'all'],
  '@typescript-eslint/no-explicit-any': 'error',
  // Keeps the R1/R3 boundary honest: a value import of RootState into
  // features/*/selectors.ts is what `storeTypeOnly` (allowTypeImports) exists
  // to catch, and this rule stops one being written by accident in the first
  // place. Type-only imports are erased, so no import edge reaches the bundle.
  '@typescript-eslint/consistent-type-imports': [
    'error',
    {prefer: 'type-imports', fixStyle: 'separate-type-imports'},
  ],
};

module.exports = {
  /**
   * Build output, not source. `coverage/` in particular is generated by any
   * `jest --coverage` run and its bundled report scripts trip
   * eslint-comments/*, which turns `npm run check` red under --max-warnings 0
   * for files nobody wrote. .gitignore already excludes them; ESLint needs to
   * be told separately.
   */
  ignorePatterns: ['coverage/', 'android/', 'ios/', 'node_modules/'],
  root: true,
  extends: '@react-native',
  overrides: [
    // Quality baseline. Separate from the import zones below because it is a
    // different concern: those enforce architecture, these enforce code style
    // that ESLint can decide without a type checker. No rule-name overlap with
    // the zones, so ordering between them does not matter. Scoped to shipped
    // source — __tests__/** is deliberately exempt from no-explicit-any.
    {
      files: ['src/**/*.ts', 'src/**/*.tsx', 'App.tsx'],
      rules: qualityRules,
    },
    // Baseline: the strictest zone. Everything below lifts one thing from it.
    {
      files: ['src/**/*.ts', 'src/**/*.tsx', 'App.tsx'],
      rules: restrict([
        reactRedux,
        typedHooks,
        store,
        navigation,
        styled,
        innerFiles,
      ]),
    },
    // Rule 6: *.style.ts is where styled-components belongs. src/theme/** joins
    // it because the DefaultTheme augmentation has to import the module it
    // augments, and App.tsx because that is where ThemeProvider is mounted.
    {
      files: ['src/**/*.style.ts', 'src/theme/**/*.ts', 'src/theme/**/*.d.ts'],
      rules: restrict([
        reactRedux,
        typedHooks,
        store,
        navigation,
        innerFiles,
      ]),
    },
    // Rule 2: containers are the only bridge to redux and navigation.
    {
      files: ['src/screens/**/*.container.tsx'],
      rules: restrict([store, styled, innerFiles]),
    },
    // R3: selectors are typed against RootState, by type import only.
    {
      files: ['src/features/*/selectors.ts'],
      rules: restrict([
        reactRedux,
        typedHooks,
        storeTypeOnly,
        navigation,
        styled,
        innerFiles,
      ]),
    },
    // Store wiring and typed hooks.
    {
      files: ['src/app/**/*.ts', 'src/app/**/*.tsx'],
      rules: restrict([navigation, styled, innerFiles]),
    },
    // Navigator + Provider wiring.
    {
      files: ['src/navigation/**/*.ts', 'src/navigation/**/*.tsx', 'App.tsx'],
      rules: restrict([innerFiles]),
    },
    // Test harness files run under jest globals and are exempt from the
    // architecture zones — they exist to exercise the real modules directly.
    {
      files: ['jest.setup.js', '__tests__/**/*.{ts,tsx,js}'],
      env: {jest: true},
    },
  ],
};
