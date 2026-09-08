import type {FetchStatus} from '../../api/fakeStoreApi.type';

export interface ProductListItem {
  id: number;
  title: string;
  price: number;
  category: string;
  imageUrl: string;
}

export interface ProductListProps {
  products: ProductListItem[];
  categories: string[];
  selectedCategory: string | null;
  searchTerm: string;
  cartCount: number;
  status: FetchStatus;
  error: string | null;
  onRetry: () => void;
  onSelectProduct: (id: number) => void;
  onAddToCart: (id: number) => void;
  onSelectCategory: (category: string | null) => void;
  onSearch: (term: string) => void;
  onOpenCart: () => void;
}
