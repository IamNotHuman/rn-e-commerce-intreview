import React from 'react';
import {screen} from '@testing-library/react-native';
import {renderWithProviders} from '../../test-utils/renderWithProviders';
import {Loader} from '../../src/components/Loader';

describe('Loader', () => {
  it('exposes a progress role for assistive tech', () => {
    renderWithProviders(<Loader />);

    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
  });

  it('renders no label by default', () => {
    renderWithProviders(<Loader />);

    expect(screen.queryByText('Loading products')).toBeNull();
  });

  it('renders the label when given one', () => {
    renderWithProviders(<Loader label="Loading products" />);

    expect(screen.getByText('Loading products')).toBeOnTheScreen();
  });
});
