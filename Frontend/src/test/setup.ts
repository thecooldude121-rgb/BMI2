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
