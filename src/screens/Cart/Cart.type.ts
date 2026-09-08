export interface CartLineView {
  id: number;
  title: string;
  imageUrl: string;
  quantity: number;
  lineTotal: number;
}

export interface CartProps {
  lines: CartLineView[];
  totalItems: number;
  totalPrice: number;
  onIncrement: (id: number) => void;
  onDecrement: (id: number) => void;
  onRemove: (id: number) => void;
  onConfirmCheckout: () => void;
}
