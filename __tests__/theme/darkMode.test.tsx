import React from 'react';
import {useColorScheme} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {renderWithProviders} from '../../test-utils/renderWithProviders';
import {ErrorView} from '../../src/components/ErrorView';
import {darkTheme, lightTheme} from '../../src/theme';

/**
 * Same require-after-fake-timers dance as __tests__/App.test.tsx: App loads
 * the store, and the store arms a rehydrate timeout at import.
 */
jest.useFakeTimers();

const App = require('../../App').default as React.ComponentType;

// react-native's jest preset replaces useColorScheme with jest.fn(() => 'light'),
// so the OS scheme is set per test rather than mocked at module level.
const setScheme = (scheme: 'light' | 'dark') =>
  (useColorScheme as jest.Mock).mockReturnValue(scheme);

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => [
      {
        id: 1,
        title: 'Leather Backpack',
        price: 109.95,
        description: 'd',
        category: 'bags',
        image: 'https://example.test/1.jpg',
      },
    ],
  }) as unknown as typeof fetch;
});

afterEach(() => {
  setScheme('light');
});

afterAll(() => {
  jest.useRealTimers();
});

describe('dark mode', () => {
  it('renders the app with the dark palette when the OS scheme is dark', async () => {
    setScheme('dark');

    render(<App />);

    expect(await screen.findByText('Leather Backpack')).toHaveStyle({
      color: darkTheme.colors.text,
    });
  });

  it('keeps the light palette when the OS scheme is light', async () => {
    setScheme('light');

    render(<App />);

    expect(await screen.findByText('Leather Backpack')).toHaveStyle({
      color: lightTheme.colors.text,
    });
  });

  it('flips the palette from the header toggle regardless of the OS scheme', async () => {
    setScheme('light');
    render(<App />);
    const title = await screen.findByText('Leather Backpack');
    expect(title).toHaveStyle({color: lightTheme.colors.text});

    fireEvent.press(screen.getByLabelText('Switch to dark theme'));

    expect(screen.getByText('Leather Backpack')).toHaveStyle({
      color: darkTheme.colors.text,
    });
    expect(screen.getByLabelText('Switch to light theme')).toBeOnTheScreen();
  });

  // Components are scheme-agnostic: they read roles, never a palette, so the
  // same node restyles from a theme swap alone.
  it('lets a component be asserted under either theme via renderWithProviders', () => {
    renderWithProviders(<ErrorView message="boom" onRetry={jest.fn()} />, {
      theme: darkTheme,
    });

    expect(screen.getByText('boom')).toHaveStyle({
      color: darkTheme.colors.danger,
    });
  });
});
