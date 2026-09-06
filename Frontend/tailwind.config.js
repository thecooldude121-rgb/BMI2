/** @type {import('tailwindcss').Config} */

/**
 * Design tokens.
 *
 * This file was `theme: { extend: {} }` — completely empty. Every visual
 * decision in the app was an inline literal, which is how the codebase ended up
 * with 326 distinct spellings of the primary button and 617 of the card.
 *
 * The palette below is DERIVED from what the code already uses, not invented:
 *   gray 18,562 uses · blue 4,918 · green 2,094 · red 1,653 · amber/yellow 1,124
 * and it follows the design intent already documented in
 * src/config/stageColors.ts:
 *   - Active/interactive states use the blue→indigo→violet progression.
 *   - Green and red are RESERVED for terminal outcomes and destructive actions.
 *     Nothing merely "active" may use them.
 *   - Closed-Won is emerald, Qualified is sky — deliberately distinct so a won
 *     deal is never confused with a qualified one at a glance.
 *
 * Semantic names, not raw hues: components reference `brand` / `danger` /
 * `success`, so a rebrand is this file rather than a codemod. `blue-600` still
 * works everywhere, so this is purely additive — nothing breaks by adding it.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // there are stray `dark:` classes in the tree; make them inert-but-valid rather than silently dead
  theme: {
    extend: {
      colors: {
        // Primary interactive colour. 600 is the resting state and 700 the
        // hover, matching the ~500 existing bg-blue-600/hover:bg-blue-700 pairs.
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // default
          700: '#1d4ed8', // hover
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Destructive. Reserved — see stageColors.ts.
        danger: {
          50: '#fef2f2', 100: '#fee2e2', 300: '#fca5a5',
          500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b',
        },
        // Terminal success only, never "active".
        success: {
          50: '#ecfdf5', 100: '#d1fae5', 300: '#6ee7b7',
          500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46',
        },
        warning: {
          50: '#fffbeb', 100: '#fef3c7', 300: '#fcd34d',
          500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e',
        },
      },
      // The four sizes that actually exist. Counted from every bg-blue-600
      // element in the tree: px-4 py-2 (300 uses), px-6 py-2 (64),
      // px-3 py-1 (52), px-6 py-3 (33). Everything else is a long-tail one-off.
      spacing: {
        'ctrl-y-sm': '0.25rem', // py-1
        'ctrl-y':    '0.5rem',  // py-2
        'ctrl-y-lg': '0.75rem', // py-3
      },
      borderRadius: {
        // rounded-lg appears 431 times on buttons alone — it is the house radius.
        ctrl: '0.5rem',
      },
      ringWidth: { AA: '2px' },
    },
  },
  plugins: [],
};
