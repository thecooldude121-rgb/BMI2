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
 *
 * FIGMA IS THE SOURCE OF TRUTH (decided by Venkat, 2026-10-05). File
 * "BMI CRM V1" — https://www.figma.com/design/y5X2pNrQTbxyF08YWmVh0u.
 * The file defines no Figma variables, so these values were EXTRACTED from the
 * frames by frequency (Dashboard + Leads, confirmed on Tasks and Settings):
 *   primary #4F46E5 (hover #4338CA), headings #312E81, body #111827,
 *   muted #756E63, border #DED8CC, surfaces #F5F1E8 / #FAF7F0 / #FFFEFB /
 *   #F0ECE3, amber #B45309, green #047857, red #B91C1C, Inter, radius 6/8px.
 * `brand` moved from blue (#2563EB) to that indigo; everything using
 * `brand-*` follows automatically. The new names below (ink / surface / line /
 * card radius) are what the redesigned shell and screens use.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // there are stray `dark:` classes in the tree; make them inert-but-valid rather than silently dead
  theme: {
    extend: {
      colors: {
        // Primary interactive colour. 600 is the resting state and 700 the
        // hover, matching the ~500 existing bg-blue-600/hover:bg-blue-700 pairs.
        // Figma primary: indigo. 600 resting, 700 hover, 900 = heading ink.
        brand: {
          50:  '#eef2ff',
          100: '#e7e7ff', // Figma's selected-nav / chip tint
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5', // default
          700: '#4338ca', // hover
          800: '#3730a3',
          900: '#312e81',
        },
        // Text. `ink` body, `ink-heading` page and card titles, `ink-muted`
        // secondary copy (the warm grey the frames use everywhere).
        ink: {
          DEFAULT: '#111827',
          heading: '#312e81',
          muted:   '#756e63',
          // NOT a Figma value — an accessibility stand-in, pending the designer.
          // Figma's #756E63 fails WCAG AA for small text on the tinted surfaces
          // (4.17:1 on the sidebar, 4.27 on sunken, 4.47 on canvas). This
          // slightly darker warm grey passes on all of them (4.83 / 4.95 / 5.18)
          // and is used ONLY for small muted text sitting on those surfaces;
          // on panels and inputs `ink-muted` passes and stays.
          secondary: '#6b645a',
        },
        // Warm parchment surfaces, from the frames.
        surface: {
          canvas: '#f5f1e8', // app background
          subtle: '#faf7f0', // secondary panels
          panel:  '#fffefb', // cards
          sunken: '#f0ece3', // inset / hover
          sidebar: '#efe9de', // the app sidebar (Figma Settings frames)
          readonly: '#e7e2d8', // read-only form fields (Figma Settings "Role")
        },
        // Hairline borders and dividers.
        line: {
          DEFAULT: '#ded8cc',
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
        // Figma: controls 6px, cards 8px. (`ctrl` was 8px before the Figma
        // adoption; Button is its only user.)
        ctrl: '0.375rem',
        card: '0.5rem',
      },
      fontFamily: {
        // Inter, per Figma (and CLAUDE.md since the start) — it was specified
        // but never loaded, so the app rendered in the system font.
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      ringWidth: { AA: '2px' },
    },
  },
  plugins: [],
};
