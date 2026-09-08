import React, {useCallback} from 'react';
import {useAppDispatch, useAppSelector} from '../../app/hooks';
import {
  clearCart,
  decrementItem,
  incrementItem,
  removeItem,
} from '../../features/cart/cartSlice';
import {
  selectCartLines,
  selectTotalItems,
  selectTotalPrice,
} from '../../features/cart/selectors';
import {CartComponent} from './Cart.component';

export const CartContainer = () => {
  const dispatch = useAppDispatch();

  const lines = useAppSelector(selectCartLines);
  const totalItems = useAppSelector(selectTotalItems);
  const totalPrice = useAppSelector(selectTotalPrice);

  const onIncrement = useCallback(
    (id: number) => {
      dispatch(incrementItem(id));
    },
    [dispatch],
  );

  const onDecrement = useCallback(
    (id: number) => {
      dispatch(decrementItem(id));
    },
    [dispatch],
  );

  const onRemove = useCallback(
    (id: number) => {
      dispatch(removeItem(id));
    },
    [dispatch],
  );

  const onConfirmCheckout = useCallback(() => {
    dispatch(clearCart());
  }, [dispatch]);

  return (
    <CartComponent
      lines={lines}
      totalItems={totalItems}
      totalPrice={totalPrice}
      onIncrement={onIncrement}
      onDecrement={onDecrement}
      onRemove={onRemove}
      onConfirmCheckout={onConfirmCheckout}
    />
  );
};
