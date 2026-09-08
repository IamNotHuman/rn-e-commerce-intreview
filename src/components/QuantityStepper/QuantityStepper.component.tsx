import React from 'react';
import type {QuantityStepperProps} from './QuantityStepper.type';
import {Quantity, Row, StepButton, StepLabel} from './QuantityStepper.style';

/**
 * The floor is the stepper's own contract rather than a prop, because it has
 * exactly one meaning here: `decrementItem` deletes the line when it would hit
 * zero, and CartItem already offers an explicit Remove for that. Letting the
 * minus button reach zero would give removal two entrances, one of them
 * indistinguishable from an ordinary quantity change.
 */
const MIN_QUANTITY = 1;

export const QuantityStepper = ({
  quantity,
  onIncrement,
  onDecrement,
}: QuantityStepperProps) => {
  const decrementDisabled = quantity <= MIN_QUANTITY;

  return (
    <Row>
      <StepButton
        onPress={onDecrement}
        disabled={decrementDisabled}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity">
        <StepLabel $disabled={decrementDisabled}>−</StepLabel>
      </StepButton>
      <Quantity accessibilityLabel={`Quantity ${quantity}`}>
        {quantity}
      </Quantity>
      <StepButton
        onPress={onIncrement}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity">
        <StepLabel>+</StepLabel>
      </StepButton>
    </Row>
  );
};
