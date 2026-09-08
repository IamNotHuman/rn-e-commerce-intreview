import React from 'react';
import {fireEvent, screen} from '@testing-library/react-native';
import {renderWithProviders} from '../../test-utils/renderWithProviders';
import {ErrorView} from '../../src/components/ErrorView';
import {lightTheme as theme} from '../../src/theme';

describe('ErrorView', () => {
  it('shows the message it is given', () => {
    renderWithProviders(
      <ErrorView message="Request failed with status 503" onRetry={jest.fn()} />,
    );

    expect(screen.getByText('Request failed with status 503')).toHaveStyle({
      color: theme.colors.danger,
    });
  });

  // R9: the retry affordance is the reason this component exists rather than a
  // bare error string.
  it('calls onRetry when the button is pressed', () => {
    const onRetry = jest.fn();
    renderWithProviders(<ErrorView message="boom" onRetry={onRetry} />);

    fireEvent.press(screen.getByRole('button', {name: 'Try again'}));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
