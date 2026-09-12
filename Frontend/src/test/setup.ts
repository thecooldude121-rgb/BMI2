/**
 * Global test setup.
 *
 * There was no setup file and no vitest config: every test file carried its own
 * `// @vitest-environment jsdom` pragma, and @testing-library/jest-dom was
 * installed but never loaded — so matchers like toBeDisabled() and
 * toHaveAccessibleName() were unavailable. That friction is a large part of why
 * there were zero component tests across 487 .tsx files.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Unmount between tests so a leaked component cannot make the next test pass.
afterEach(() => cleanup());

/**
 * An in-memory `localStorage`, because this jsdom build does not provide one:
 * Node prints "localStorage is not available because --localstorage-file was not
 * provided" and the global is `undefined`.
 *
 * THIS WAS MASKING TEST RESULTS, not merely producing a warning. Every API
 * helper in this codebase builds its headers with
 * `localStorage.getItem('authToken')`, so a component test that rendered a page
 * got "Cannot read properties of undefined (reading 'getItem')" — thrown BEFORE
 * `fetch` was ever called. A test written to prove "the page handles a failed
 * fetch" therefore proved "the page handles a thrown error", passed, and never
 * touched the network path at all. That is lesson 12's shape: an assertion that
 * holds for a reason other than the one claimed.
 *
 * Guarded, so a future jsdom that ships a real implementation keeps it.
 */
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() { return store.size; },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (k) => { store.delete(k); },
    setItem: (k, v) => { store.set(k, String(v)); },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true, writable: true });
}
