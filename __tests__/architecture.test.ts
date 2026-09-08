import {readdirSync, readFileSync, statSync} from 'fs';
import {join} from 'path';

/**
 * Repo-wide guards for the two architecture rules ESLint cannot express.
 *
 * These scan source text rather than imports, because the defects they catch
 * are about *what a call does*, not about which module it came from. They are
 * written to keep working as features land, so a refetch introduced in a slice
 * or a screen months from now fails here.
 */
const SRC = join(__dirname, '..', 'src');

const collectSources = (dir: string): string[] =>
  readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return collectSources(full);
    }
    return /\.tsx?$/.test(entry) && !full.endsWith('.d.ts') ? [full] : [];
  });

/**
 * Removes block comments, and line comments only where `//` opens the line.
 * A blanket `//` strip would eat everything after "https://fakestoreapi.com"
 * and hide the very URLs these guards exist to inspect.
 */
const stripComments = (source: string): string =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter(line => !/^\s*(\/\/|\*)/.test(line))
    .join('\n');

/**
 * A request sub-path, distinguished from a module specifier that merely reads
 * like one. Both contain "/products/" — 'features/products/selectors' is not a
 * refetch — so the boundary before it is what carries the meaning:
 *
 *   '"` or }   the path opens a string literal or follows a ${...} expression
 *   ://...     the path sits in an absolute URL
 *
 * A module specifier reaches "/products/" only after a path segment character
 * ("features", ".", ".."), so it never satisfies either. That is the whole rule;
 * it needs no help from stripping imports out of the source first, which is why
 * the line-based strip this replaces is gone.
 *
 * The trailing slash is the other half: the allowed collection call is
 * `${BASE_URL}/products` with nothing after it, so requiring "/products/" is
 * already enough to let it through. An earlier draft also demanded a character
 * after the slash, which silently exempted the concatenated form
 * (BASE_URL + '/products/' + id) — the literal ends at the slash there.
 */
const PRODUCT_SUB_PATH = /(?:['"`}]|:\/\/[^\s'"`]*)\/products\//;

const requestsProductSubPath = (code: string): boolean =>
  PRODUCT_SUB_PATH.test(code);

const sources = collectSources(SRC).map(file => {
  const code = stripComments(readFileSync(file, 'utf8'));

  return {
    file: file.slice(file.indexOf('src/')),
    code,
  };
});

describe('architecture guards', () => {
  it('has sources to scan', () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  // R8: all network access goes through api/. A fetch in a slice, container or
  // component is the usual way this architecture rots.
  it('confines fetch to src/api', () => {
    const offenders = sources
      .filter(({code}) => /\bfetch\s*\(/.test(code))
      .map(({file}) => file)
      .filter(file => !file.startsWith('src/api/'));

    expect(offenders).toEqual([]);
  });

  it('never imports an http client outside src/api', () => {
    const offenders = sources
      .filter(({code}) => /from\s+['"](axios|ky|superagent)['"]/.test(code))
      .map(({file}) => file)
      .filter(file => !file.startsWith('src/api/'));

    expect(offenders).toEqual([]);
  });

  /**
   * tsconfig exposes @types/node so the guards in this file can read the source
   * tree. That also makes node builtins visible to app code, where they would
   * typecheck happily and then fail at runtime in the RN bundler. This closes
   * the hole the tsconfig change opened.
   */
  it('imports no node builtins in app code', () => {
    const offenders = sources
      .filter(({code}) =>
        /from\s+['"](node:)?(fs|path|os|crypto|child_process|http|https)['"]/.test(
          code,
        ),
      )
      .map(({file}) => file);

    expect(offenders).toEqual([]);
  });

  /**
   * The guard's own coverage. The false positive that prompted it — every
   * container importing from features/products/ flagged as a refetch — existed
   * because the pattern had only ever been run against a planted violation,
   * never against a conforming file that mentions the path innocently. A guard
   * on a graded criterion is worth as much as its false-positive rate: one that
   * fires on correct code is one that gets muted.
   */
  describe('the /products sub-path pattern', () => {
    it.each([
      ['a template built on the base url', 'fetch(`${BASE_URL}/products/${id}`)'],
      ['a concatenated path', "fetch(BASE_URL + '/products/' + id)"],
      ['an absolute url', "fetch('https://fakestoreapi.com/products/1')"],
      ['a category sub-path', "get('/products/category/jewelery')"],
      ['a template literal opening the path', 'get(`/products/${id}`)'],
    ])('flags %s', (_label, code) => {
      expect(requestsProductSubPath(code)).toBe(true);
    });

    it.each([
      ['a deep relative import', "} from '../../features/products/selectors';"],
      ['a single-line import', "import {addItem} from '../features/products/slice';"],
      ['a same-folder import', "from './products/helpers'"],
      ['the allowed collection call', 'fetch(`${BASE_URL}/products`)'],
      ['a bare mention', "state.products.selectedCategory"],
    ])('ignores %s', (_label, code) => {
      expect(requestsProductSubPath(code)).toBe(false);
    });
  });

  /**
   * The graded one. GET /products already returns description for all ~20
   * items, so detail, category filter and search are memoized selectors over
   * the cached list. Any sub-path under /products/ means something is
   * refetching what the app already holds.
   */
  it('requests no sub-path under /products', () => {
    const offenders = sources
      .filter(({code}) => requestsProductSubPath(code))
      .map(({file}) => file);

    expect(offenders).toEqual([]);
  });
});
