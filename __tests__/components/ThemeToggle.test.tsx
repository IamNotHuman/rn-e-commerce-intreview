import React from 'react';
import {fireEvent, screen} from '@testing-library/react-native';
import {renderWithProviders} from '../../test-utils/renderWithProviders';
import {ThemeToggle} from '../../src/components/ThemeToggle';

describe('ThemeToggle', () => {
  // The label names the scheme the button switches TO, which is what a screen
  // reader user needs to decide whether to press it.
  it('offers dark while light is in effect', () => {
    renderWithProviders(<ThemeToggle scheme="light" onToggle={jest.fn()} />);

    expect(screen.getByLabelText('Switch to dark theme')).toBeOnTheScreen();
    expect(screen.getByText('☾')).toBeOnTheScreen();
  });

  it('offers light while dark is in effect', () => {
    renderWithProviders(<ThemeToggle scheme="dark" onToggle={jest.fn()} />);

    expect(screen.getByLabelText('Switch to light theme')).toBeOnTheScreen();
    expect(screen.getByText('☀\uFE0E')).toBeOnTheScreen();
  });

  it('calls onToggle when pressed', () => {
    const onToggle = jest.fn();
    renderWithProviders(<ThemeToggle scheme="light" onToggle={onToggle} />);

    fireEvent.press(screen.getByRole('button'));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
