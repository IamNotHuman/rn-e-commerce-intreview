/**
 * Resolved primitives and callbacks only (R7) — no Product, no ProductDTO, no
 * RootState.
 *
 * The callbacks take the id rather than being pre-bound to it. A pre-bound
 * `() => void` forces the screen to build a new closure per row on every
 * render, which makes the React.memo on this component useless. Taking the id
 * lets the screen hold one stable useCallback and share it across every row.
 */
export interface ProductCardProps {
  id: number;
  title: string;
  price: number;
  category: string;
  imageUrl: string;
  onPress: (id: number) => void;
  onAddToCart: (id: number) => void;
}
