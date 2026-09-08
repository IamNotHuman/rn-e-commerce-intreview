import {formatPrice} from '../../src/utils';

describe('formatPrice', () => {
  it('renders two decimal places', () => {
    expect(formatPrice(109.9)).toBe('$109.90');
  });

  it('keeps a whole number on the scale', () => {
    expect(formatPrice(15)).toBe('$15.00');
  });

  // Fake Store API prices carry float error (109.95 * 2 === 219.89999...),
  // so a line total reaches this function already imprecise and has to round
  // rather than truncate.
  it('rounds a float-error total to the nearest cent', () => {
    expect(formatPrice(109.95 * 2)).toBe('$219.90');
  });

  it('formats zero rather than an empty string', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });
});
