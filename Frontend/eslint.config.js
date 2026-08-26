import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      /**
       * Pinned explicitly, though `recommended` already sets it, because this
       * one must never be relaxed to quiet a build. A conditionally-called hook
       * is not a style preference — it changes the hook count between renders,
       * and React responds by throwing "Rendered more hooks than during the
       * previous render", killing the whole subtree.
       *
       * There were 22 of these. Two were modals whose default-date effect sat
       * below `if (!isOpen) return null`, so they crashed the moment the user
       * opened them. Run `npm run lint:hooks` to check this rule alone — the
       * full lint still has ~1,000 pre-existing errors and cannot gate yet.
       */
      'react-hooks/rules-of-hooks': 'error',

      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      /**
       * Stop the button duplication regrowing.
       *
       * This codebase reached 326 distinct spellings of the primary button and
       * 617 of the card because nothing ever pushed back. Converting the
       * existing call sites is worthless if the next feature adds thirty more,
       * so the guard ships WITH the primitive rather than after it.
       *
       * A warning, not an error, on purpose: ~300 sites still need migrating,
       * and a rule that makes `npm run lint` fail today would simply get
       * switched off. Raise it to 'error' once the count is near zero — that is
       * the point at which it starts protecting something.
       */
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'Literal[value=/bg-blue-600/]',
          message:
            'Use <Button> from components/ui instead of hand-writing bg-blue-600. It carries the ' +
            'focus ring, type="button", aria-disabled and loading handling. For a genuine one-off, ' +
            'use the brand-* tokens rather than raw blue-*.',
        },
        {
          selector: 'Literal[value=/\\b(bg|text|border)-(green|emerald)-(600|700)\\b/]',
          message:
            'Use the semantic success token, not a raw green. src/config/stageColors.ts reserves ' +
            'green and red for terminal outcomes, so a raw green-600 on an active element is ' +
            'usually a bug.',
        },
      ],
    },
  },
  {
    // The primitives are where raw values legitimately live, and their tests
    // assert on them.
    files: ['src/components/ui/**'],
    rules: { 'no-restricted-syntax': 'off' },
  }
);
