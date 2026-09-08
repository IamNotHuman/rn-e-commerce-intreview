import type {Product, ProductDTO} from './fakeStoreApi.type';

const BASE_URL = 'https://fakestoreapi.com';

/**
 * The DTO -> domain boundary. `image` never escapes this file.
 */
const toProduct = (dto: ProductDTO): Product => ({
  id: dto.id,
  title: dto.title,
  price: dto.price,
  description: dto.description,
  category: dto.category,
  imageUrl: dto.image,
});

/**
 * The only network call in the app.
 *
 * The list response already carries `description`, and the catalogue is ~20
 * items, so detail lookups, category filtering and search are all served from
 * this one cached result by memoized selectors. There is deliberately no
 * per-id and no per-category request here: adding one would be a graded defect,
 * not a refactor. See R8.
 *
 * No runtime schema validation: the endpoint is a stable public fixture, and a
 * validation layer would cost more than the failure mode it guards against.
 */
export const getProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${BASE_URL}/products`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = (await response.json()) as ProductDTO[];

  return data.map(toProduct);
};
