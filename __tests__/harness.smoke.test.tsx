/**
 * Harness self-test.
 *
 * Proves the integration points that fail silently or confusingly when
 * jest.config.js / jest.setup.js drift: the styled-components render path,
 * RNTL's built-in matchers, both native-module mocks actually binding, and
 * every runtime dependency in the stack being loadable under the RN preset's
 * transform. Written before any src/ code so a transform gap surfaces here
 * rather than inside the first real component test.
 */
import React from 'react';
import {render, screen} from '@testing-library/react-native';
import styled, {ThemeProvider} from 'styled-components/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {lightTheme as theme} from '../src/theme';
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const Label = styled.Text`
  color: rebeccapurple;
`;

describe('rendering', () => {
  it('renders styled-components/native through RNTL', () => {
    render(<Label>harness ok</Label>);
    expect(screen.getByText('harness ok')).toBeOnTheScreen();
  });

  it('applies styled-components styles to the rendered node', () => {
    render(<Label>styled</Label>);
    expect(screen.getByText('styled')).toHaveStyle({color: 'rebeccapurple'});
  });
});

describe('theme', () => {
  const Themed = styled.Text`
    color: ${({theme: t}) => t.colors.primary};
    padding: ${({theme: t}) => t.spacing.md}px;
  `;

  it('resolves tokens through ThemeProvider', () => {
    render(
      <ThemeProvider theme={theme}>
        <Themed>themed</Themed>
      </ThemeProvider>,
    );

    // styled-components/native expands shorthand padding into the four
    // longhand properties, so asserting on `padding` would never match.
    expect(screen.getByText('themed')).toHaveStyle({
      color: theme.colors.primary,
      paddingTop: theme.spacing.md,
      paddingLeft: theme.spacing.md,
    });
  });

  // A missing ThemeProvider throws at render rather than degrading to unstyled
  // UI, because the tokens are dereferenced inside the interpolation. Pinned
  // here so the failure mode stays loud if the provider is ever dropped.
  it('throws at render when the provider is missing', () => {
    expect(() => render(<Themed>unthemed</Themed>)).toThrow(
      /Cannot read properties of undefined/,
    );
  });
});

describe('native module mocks', () => {
  // async-storage v3 ships a real in-memory implementation rather than
  // jest.fn() stubs, so the proof that the mock is bound is behavioural: the
  // unmocked module has no native backend in the test env and would reject.
  it('binds the AsyncStorage mock rather than the real native module', async () => {
    await AsyncStorage.setItem('probe', 'value');
    await expect(AsyncStorage.getItem('probe')).resolves.toBe('value');
    await expect(AsyncStorage.getAllKeys()).resolves.toContain('probe');

    await AsyncStorage.clear();
    await expect(AsyncStorage.getItem('probe')).resolves.toBeNull();
  });

  it('binds the safe-area-context mock with deterministic metrics', () => {
    expect(initialWindowMetrics).toEqual({
      frame: {width: 320, height: 640, x: 0, y: 0},
      insets: {top: 0, left: 0, right: 0, bottom: 0},
    });
    expect(jest.isMockFunction(useSafeAreaInsets)).toBe(true);
  });
});

describe('dependency transforms', () => {
  it('loads every runtime dependency the app will import', () => {
    expect(() => {
      require('@reduxjs/toolkit');
      require('react-redux');
      require('redux-persist');
      require('@react-navigation/native');
      require('@react-navigation/native-stack');
      require('react-native-screens');
    }).not.toThrow();
  });

  it('builds a persisted store the way src/app/store.ts will', async () => {
    const {configureStore} = require('@reduxjs/toolkit');
    const {persistReducer, persistStore} = require('redux-persist');

    const store = configureStore({
      reducer: {
        probe: persistReducer(
          // timeout: 0 disables redux-persist's rehydrate setTimeout, which
          // otherwise stays pending for 5s and leaves jest with an open handle.
          {key: 'probe', storage: AsyncStorage, timeout: 0},
          (state = {items: []}) => state,
        ),
      },
      middleware: (getDefault: any) =>
        getDefault({serializableCheck: false}),
    });

    const persistor = persistStore(store);
    expect(persistor).toBeDefined();
    expect(store.getState().probe.items).toEqual([]);

    // redux-persist keeps a throttle timer alive; without draining and pausing
    // it jest reports an open handle and hangs after the run.
    await persistor.flush();
    persistor.pause();
  });
});
