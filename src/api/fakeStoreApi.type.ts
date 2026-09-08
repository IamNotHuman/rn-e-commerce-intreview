/**
 * Two shapes, deliberately separate.
 *
 * `ProductDTO` is the raw wire format from the Fake Store API. `Product` is the
 * domain shape the rest of the app sees. The only difference today is
 * `image` -> `imageUrl`, but keeping them distinct is what stops vendor naming
 * from leaking into props, selectors, and styles (R7).
 *
 * `rating` is present on the wire and intentionally not mapped: the brief asks
 * the list for image/title/price/category and the detail screen for those plus
 * description. Mapping a field nothing renders would be dead weight.
 */
export interface ProductDTO {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
}

export type FetchStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
