import React, {useCallback, useState} from 'react';
import {FlatList} from 'react-native';
import type {ListRenderItemInfo} from 'react-native';
import {CartItem} from '../../components/CartItem';
import {formatPrice} from '../../utils';
import type {CartLineView, CartProps} from './Cart.type';
import {
  Empty,
  Panel,
  PanelLine,
  PanelTitle,
  PrimaryButton,
  PrimaryLabel,
  Screen,
  SecondaryButton,
  SecondaryLabel,
  TotalItems,
  TotalPrice,
  Totals,
} from './Cart.style';

type CheckoutStage = 'browsing' | 'summary' | 'confirmed';

export const CartComponent = ({
  lines,
  totalItems,
  totalPrice,
  onIncrement,
  onDecrement,
  onRemove,
  onConfirmCheckout,
}: CartProps) => {
  /**
   * Local UI state, deliberately not in redux: which step of the simulated
   * checkout is on screen is nobody else's business and does not survive
   * leaving the screen. Shared state is what belongs in a slice.
   */
  const [stage, setStage] = useState<CheckoutStage>('browsing');

  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<CartLineView>) => (
      <CartItem
        id={item.id}
        title={item.title}
        imageUrl={item.imageUrl}
        quantity={item.quantity}
        lineTotal={item.lineTotal}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onRemove={onRemove}
      />
    ),
    [onIncrement, onDecrement, onRemove],
  );

  const keyExtractor = useCallback((item: CartLineView) => String(item.id), []);

  const confirm = useCallback(() => {
    onConfirmCheckout();
    setStage('confirmed');
  }, [onConfirmCheckout]);

  if (stage === 'confirmed') {
    return (
      <Screen>
        <Panel>
          <PanelTitle>Order confirmed</PanelTitle>
          <PanelLine>
            Thanks — your simulated purchase went through and the cart has been
            cleared.
          </PanelLine>
        </Panel>
        <PrimaryButton
          onPress={() => setStage('browsing')}
          accessibilityRole="button"
          accessibilityLabel="Done">
          <PrimaryLabel>Done</PrimaryLabel>
        </PrimaryButton>
      </Screen>
    );
  }

  const isEmpty = lines.length === 0;

  return (
    <Screen>
      <FlatList
        data={lines}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        // R13.2: empty is the fourth state. Rendering it through the list
        // rather than an early return keeps the totals and the (disabled)
        // checkout on screen, so the cart still reads as a cart.
        ListEmptyComponent={<Empty>Your cart is empty.</Empty>}
      />

      <Totals>
        <TotalItems>{`Items: ${totalItems}`}</TotalItems>
        <TotalPrice>{`Total: ${formatPrice(totalPrice)}`}</TotalPrice>
      </Totals>

      {stage === 'summary' ? (
        <Panel>
          <PanelTitle>Order summary</PanelTitle>
          {lines.map(line => (
            <PanelLine key={line.id}>
              {`${line.quantity} × ${line.title} — ${formatPrice(
                line.lineTotal,
              )}`}
            </PanelLine>
          ))}
          <PrimaryButton
            onPress={confirm}
            accessibilityRole="button"
            accessibilityLabel="Confirm purchase">
            <PrimaryLabel>Confirm purchase</PrimaryLabel>
          </PrimaryButton>
          <SecondaryButton
            onPress={() => setStage('browsing')}
            accessibilityRole="button"
            accessibilityLabel="Cancel checkout">
            <SecondaryLabel>Cancel</SecondaryLabel>
          </SecondaryButton>
        </Panel>
      ) : (
        <PrimaryButton
          onPress={() => setStage('summary')}
          disabled={isEmpty}
          accessibilityRole="button"
          accessibilityLabel="Checkout">
          <PrimaryLabel $disabled={isEmpty}>Checkout</PrimaryLabel>
        </PrimaryButton>
      )}
    </Screen>
  );
};
