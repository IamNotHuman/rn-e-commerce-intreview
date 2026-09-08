import reducer, {
  setSchemeOverride,
  toggleScheme,
} from '../../src/features/theme/themeSlice';
import type {ThemeState} from '../../src/features/theme/themeSlice';
import {
  selectEffectiveScheme,
  selectSchemeOverride,
} from '../../src/features/theme/selectors';
import type {RootState} from '../../src/app/store';

const initial = (): ThemeState => reducer(undefined, {type: '@@INIT'} as never);
const state = (override: ThemeState['override']): RootState =>
  ({theme: {override}} as RootState);

describe('themeSlice', () => {
  it('starts with no override, i.e. following the OS', () => {
    expect(initial()).toEqual({override: null});
  });

  it('toggles to the opposite of the scheme currently in effect', () => {
    expect(reducer(initial(), toggleScheme('light')).override).toBe('dark');
    expect(reducer(initial(), toggleScheme('dark')).override).toBe('light');
  });

  it('can be reset to follow the OS again', () => {
    const dark = reducer(initial(), setSchemeOverride('dark'));
    expect(reducer(dark, setSchemeOverride(null)).override).toBeNull();
  });
});

describe('selectSchemeOverride', () => {
  it('exposes the raw override so a settings surface can show "system" vs explicit', () => {
    expect(selectSchemeOverride(state(null))).toBeNull();
    expect(selectSchemeOverride(state('dark'))).toBe('dark');
  });
});

describe('selectEffectiveScheme', () => {
  it('follows the OS when there is no override', () => {
    expect(selectEffectiveScheme(state(null), 'dark')).toBe('dark');
    expect(selectEffectiveScheme(state(null), 'light')).toBe('light');
  });

  it('treats an unstated OS scheme as light', () => {
    expect(selectEffectiveScheme(state(null), null)).toBe('light');
    expect(selectEffectiveScheme(state(null), undefined)).toBe('light');
  });

  it('lets the override win over the OS', () => {
    expect(selectEffectiveScheme(state('light'), 'dark')).toBe('light');
    expect(selectEffectiveScheme(state('dark'), 'light')).toBe('dark');
  });
});
