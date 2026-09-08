/**
 * Callbacks take the id for the same reason as ProductCardProps: one stable
 * handler on the screen, shared by every row, so the React.memo holds.
 */
export interface CartItemProps {
  id: number;
  title: string;
  imageUrl: string;
  quantity: number;
  lineTotal: number;
  onIncrement: (id: number) => void;
  onDecrement: (id: number) => void;
  onRemove: (id: number) => void;
}
