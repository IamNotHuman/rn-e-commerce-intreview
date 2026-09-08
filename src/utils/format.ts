/**
 * Presentation helpers. Pure functions over primitives — no theme, no state,
 * no React — so anything in the tree may import them.
 */

/**
 * The single place a price becomes a string (R13).
 *
 * Deliberately `toFixed` rather than `Intl.NumberFormat`: the app is
 * single-currency and single-locale, and Hermes ships Intl unevenly across
 * platforms and versions — an unsupported build degrades to a different string
 * on one platform only, which is worse than the limitation it would fix.
 * Swapping the body is the entire migration if that changes, which is the
 * point of the rule.
 */
export const formatPrice = (value: number): string => `$${value.toFixed(2)}`;
