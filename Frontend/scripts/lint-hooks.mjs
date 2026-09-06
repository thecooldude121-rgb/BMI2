#!/usr/bin/env node
/**
 * Gate on react-hooks/rules-of-hooks alone.
 *
 * The full `npm run lint` reports ~1,000 pre-existing problems, so it cannot
 * fail a build without failing every build. But a conditionally-called hook is
 * a genuine crash — React throws "Rendered more hooks than during the previous
 * render" and takes out the subtree — so that one rule is worth gating on by
 * itself. This reports only that rule and exits non-zero if any site remains.
 *
 * Usage: npm run lint:hooks
 */
import { ESLint } from 'eslint';

const RULE = 'react-hooks/rules-of-hooks';

const results = await new ESLint().lintFiles(['src']);

const violations = results.flatMap((file) =>
  file.messages
    .filter((m) => m.ruleId === RULE)
    .map((m) => ({
      file: file.filePath.replace(`${process.cwd()}/`, ''),
      line: m.line,
      message: m.message,
    })),
);

if (violations.length === 0) {
  console.log(`✓ ${RULE}: clean`);
  process.exit(0);
}

console.error(`✗ ${RULE}: ${violations.length} violation(s)\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}`);
  console.error(`    ${v.message}\n`);
}
console.error(
  'A hook must be called on every render, in the same order. Move it above any\n' +
    'early return and out of any conditional branch.',
);
process.exit(1);
