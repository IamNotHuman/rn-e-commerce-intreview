import type {FetchStatus} from '../../api/fakeStoreApi.type';

export interface ProductDetailView {
  title: string;
  price: number;
  category: string;
  description: string;
  imageUrl: string;
}

/**
 * onAddToCart takes no id, unlike the list-row components. The id is fixed for
 * the lifetime of this screen, so the container closes over it — the id-taking
 * shape (rule 2b) exists to let one handler serve many rows, and there is only
 * one product here.
 */
export interface ProductDetailProps {
  product: ProductDetailView | null;
  status: FetchStatus;
  error: string | null;
  onAddToCart: () => void;
  onRetry: () => void;
}
