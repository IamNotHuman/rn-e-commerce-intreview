import React from 'react';
import {fireEvent, screen} from '@testing-library/react-native';
import {renderWithProviders} from '../../test-utils/renderWithProviders';
import {QuantityStepper} from '../../src/components/QuantityStepper';
import {lightTheme as theme} from '../../src/theme';

const setup = (quantity = 2) => {
  const onIncrement = jest.fn();
  const onDecrement = jest.fn();

  renderWithProviders(
    <QuantityStepper
      quantity={quantity}
      onIncrement={onIncrement}
      onDecrement={onDecrement}
    />,
  );

  return {onIncrement, onDecrement};
};

describe('QuantityStepper', () => {
  it('displays the current quantity', () => {
    setup(3);

    expect(screen.getByText('3')).toBeOnTheScreen();
  });

  // R13: the buttons are a 32px box on purpose, so the target only clears the
  // platform minimum through hitSlop. It arrives via .attrs in the style file,
  // which is exactly the kind of wiring that survives a refactor silently
  // dropped.
  it('extends both step buttons to a usable touch target', () => {
    setup();

    expect(screen.getByLabelText('Increase quantity').props.hitSlop).toBe(
      theme.size.hitSlop,
    );
    expect(screen.getByLabelText('Decrease quantity').props.hitSlop).toBe(
      theme.size.hitSlop,
    );
  });

  it('calls onIncrement without touching onDecrement', () => {
    const {onIncrement, onDecrement} = setup();

    fireEvent.press(screen.getByLabelText('Increase quantity'));

    expect(onIncrement).toHaveBeenCalledTimes(1);
    expect(onDecrement).not.toHaveBeenCalled();
  });

  it('calls onDecrement without touching onIncrement', () => {
    const {onIncrement, onDecrement} = setup();

    fireEvent.press(screen.getByLabelText('Decrease quantity'));

    expect(onDecrement).toHaveBeenCalledTimes(1);
    expect(onIncrement).not.toHaveBeenCalled();
  });

  // R13.3: a control that dims but still dispatches, or that blocks but looks
  // live, both read as broken. The three assertions below are the three halves
  // of that — inert, announced, and visibly unavailable — and they are split
  // so a regression says which one was dropped.
  describe('at the minimum quantity', () => {
    it('does not fire onDecrement', () => {
      const {onDecrement} = setup(1);

      fireEvent.press(screen.getByLabelText('Decrease quantity'));

      expect(onDecrement).not.toHaveBeenCalled();
    });

    it('announces the decrement button as disabled', () => {
      setup(1);

      expect(screen.getByLabelText('Decrease quantity')).toBeDisabled();
    });

    it('styles the decrement button from the disabled tokens', () => {
      setup(1);

      expect(screen.getByLabelText('Decrease quantity')).toHaveStyle({
        backgroundColor: theme.colors.disabled,
        borderColor: theme.colors.disabled,
      });
      expect(screen.getByText('−')).toHaveStyle({
        color: theme.colors.onDisabled,
      });
    });

    it('leaves the increment button live', () => {
      const {onIncrement} = setup(1);

      fireEvent.press(screen.getByLabelText('Increase quantity'));

      expect(screen.getByLabelText('Increase quantity')).toBeEnabled();
      expect(onIncrement).toHaveBeenCalledTimes(1);
    });
  });

  it('leaves the decrement button live above the minimum', () => {
    setup(2);

    expect(screen.getByLabelText('Decrease quantity')).toBeEnabled();
    expect(screen.getByLabelText('Decrease quantity')).toHaveStyle({
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
    });
    expect(screen.getByText('−')).toHaveStyle({color: theme.colors.text});
  });
});
