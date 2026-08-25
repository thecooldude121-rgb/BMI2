import ts from 'typescript';
import fs from 'fs';
import path from 'path';

const ONLY = process.argv[2] || 'src';

/** Classes the Button primitive provably supplies. Anything not listed here is
 *  PRESERVED in className — worst case a redundant class, never a missing one. */
const PROVIDED = new Set([
  'bg-blue-600','hover:bg-blue-700','text-white',
  'rounded-lg','rounded-ctrl',
  'transition-colors','transition-all','transition',
  'font-medium','inline-flex','flex','items-center','justify-center',
  'disabled:opacity-50','disabled:cursor-not-allowed','cursor-pointer',
  'focus:outline-none','focus:ring-2','focus:ring-offset-2','focus:ring-blue-500',
]);
// Size is decided by the px/py pair; these are consumed once matched.
const SIZE_TOKENS = new Set(['px-2','px-3','px-4','px-5','px-6','px-8','py-0','py-1','py-1.5','py-2','py-2.5','py-3','text-xs','text-sm','text-base','gap-1','gap-1.5','gap-2','gap-3','space-x-1','space-x-2','space-x-3']);

function pickSize(cls) {
  const has = t => cls.includes(t);
  if (has('px-6') && (has('py-3'))) return 'xl';
  if (has('px-6') || has('px-5') || has('px-8')) return 'lg';
  if (has('px-3') || has('px-2')) return 'sm';
  return 'md'; // px-4 py-2 — the default, omitted
}

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.tsx$/.test(e.name) && !/\.test\./.test(e.name)) files.push(p);
  }
})(ONLY);

let converted = 0, filesTouched = 0, skipped = 0;

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  if (!/bg-blue-600/.test(src)) continue;

  const edits = [];
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const visit = node => {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText() === 'button') {
      const open = node.openingElement;
      const classAttr = open.attributes.properties.find(
        a => ts.isJsxAttribute(a) && a.name.getText() === 'className');
      if (classAttr && ts.isJsxAttribute(classAttr) && classAttr.initializer) {
        const init = classAttr.initializer;
        // Static string only. Template literals and conditionals are left alone.
        let raw = null;
        if (ts.isStringLiteral(init)) raw = init.text;
        else if (ts.isJsxExpression(init) && init.expression && ts.isStringLiteral(init.expression)) raw = init.expression.text;

        if (raw && raw.includes('bg-blue-600')) {
          const cls = raw.split(/\s+/).filter(Boolean);
          const size = pickSize(cls);
          const fullWidth = cls.includes('w-full') || cls.includes('flex-1');
          const residual = cls.filter(c =>
            !PROVIDED.has(c) && !SIZE_TOKENS.has(c) && c !== 'w-full' && c !== 'flex-1');

          const props = [];
          if (size !== 'md') props.push(`size="${size}"`);
          if (fullWidth) props.push('fullWidth');
          if (residual.length) props.push(`className="${residual.join(' ')}"`);

          // Replace the className attribute with the mapped props.
          edits.push({ start: classAttr.getStart(), end: classAttr.getEnd(), text: props.join(' ') });
          // <button ...> -> <Button ...>
          const tagNode = open.tagName;
          edits.push({ start: tagNode.getStart(), end: tagNode.getEnd(), text: 'Button' });
          const closeTag = node.closingElement.tagName;
          edits.push({ start: closeTag.getStart(), end: closeTag.getEnd(), text: 'Button' });
          converted++;
        } else if (raw === null) {
          skipped++;
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  if (!edits.length) continue;
  edits.sort((a, b) => b.start - a.start);
  for (const e of edits) src = src.slice(0, e.start) + e.text + src.slice(e.end);

  // Add the import if any conversion happened in this file.
  if (!/from ['"].*components\/ui\/Button['"]/.test(src)) {
    const rel = path.relative(path.dirname(file), 'src/components/ui/Button').split(path.sep).join('/');
    const spec = rel.startsWith('.') ? rel : './' + rel;
    const m = src.match(/^import .*?;$/m);
    src = m ? src.replace(m[0], `${m[0]}\nimport { Button } from '${spec}';`) : src;
  }
  // Collapse the blank lines an emptied attribute can leave behind.
  src = src.replace(/\n\s*\n(\s*>)/g, '\n$1');
  fs.writeFileSync(file, src);
  filesTouched++;
}
console.log(`  converted: ${converted} buttons across ${filesTouched} files`);
console.log(`  left alone (non-static className): ${skipped}`);
