import {useDispatch, useSelector} from 'react-redux';
import type {TypedUseSelectorHook} from 'react-redux';
import type {AppDispatch, RootState} from './store';

/**
 * The only redux entry point containers are allowed to use (R2). Using the raw
 * hooks with an inline RootState cast at each call site is what these exist to
 * prevent.
 */
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
