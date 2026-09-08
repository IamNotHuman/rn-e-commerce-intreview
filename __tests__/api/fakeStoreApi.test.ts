import {getProducts} from '../../src/api/fakeStoreApi';
import type {ProductDTO} from '../../src/api/fakeStoreApi.type';

const dto: ProductDTO = {
  id: 1,
  title: 'Backpack',
  price: 109.95,
  description: 'Fits 15 inch laptops',
  category: "men's clothing",
  image: 'https://fakestoreapi.com/img/backpack.jpg',
};

const mockFetch = (body: unknown, init?: {ok?: boolean; status?: number}) => {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: async () => body,
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getProducts', () => {
  it('maps the DTO to the domain shape, renaming image to imageUrl', async () => {
    mockFetch([dto]);

    const [product] = await getProducts();

    expect(product).toEqual({
      id: 1,
      title: 'Backpack',
      price: 109.95,
      description: 'Fits 15 inch laptops',
      category: "men's clothing",
      imageUrl: 'https://fakestoreapi.com/img/backpack.jpg',
    });
  });

  // R7: the raw wire field must not survive the mapper, or the view layer ends
  // up depending on vendor naming and the DTO/domain split buys nothing.
  it('does not leak raw DTO fields into the domain object', async () => {
    mockFetch([dto]);

    const [product] = await getProducts();

    expect(product).not.toHaveProperty('image');
    expect(product).not.toHaveProperty('rating');
  });

  it('requests the list endpoint exactly once, with no id or category path', async () => {
    const fetchMock = mockFetch([dto]);

    await getProducts();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('https://fakestoreapi.com/products');
  });

  it('throws with the status when the response is not ok', async () => {
    mockFetch(null, {ok: false, status: 503});

    await expect(getProducts()).rejects.toThrow(
      'Request failed with status 503',
    );
  });

  it('returns an empty array for an empty catalogue rather than throwing', async () => {
    mockFetch([]);

    await expect(getProducts()).resolves.toEqual([]);
  });
});
