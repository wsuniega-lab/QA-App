import { LocalStore } from './LocalStore';
import type { Store } from './Store';

/** Swap this for a cloud-backed `Store` when moving off the on-device trial. */
export const store: Store = new LocalStore();

export type { Store };
