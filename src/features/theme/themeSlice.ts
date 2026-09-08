import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';
import type {ColorScheme} from '../../theme';

/**
 * `override` is the user's explicit choice; `null` means "follow the OS". Held
 * as an override rather than a resolved scheme so a user who has never touched
 * the toggle keeps tracking system appearance changes, and one who has keeps
 * their choice across launches (this slice is persisted — R11).
 */
export interface ThemeState {
  override: ColorScheme | null;
}

const initialState: ThemeState = {override: null};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setSchemeOverride(state, action: PayloadAction<ColorScheme | null>) {
      state.override = action.payload;
    },
    /**
     * Takes the scheme currently in effect (override ?? OS) because the reducer
     * cannot read the OS scheme itself; the caller resolves it.
     */
    toggleScheme(state, action: PayloadAction<ColorScheme>) {
      state.override = action.payload === 'dark' ? 'light' : 'dark';
    },
  },
});

export const {setSchemeOverride, toggleScheme} = themeSlice.actions;
export default themeSlice.reducer;
