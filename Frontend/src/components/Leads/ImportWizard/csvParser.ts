/**
 * Lead-import sample file.
 *
 * The parser that used to live here moved to utils/csvParse.ts when contacts
 * and accounts gained CSV import — one parser, one set of tests, rather than
 * three feature-local copies drifting apart. Two silent bugs were fixed in the
 * move (a quoted field containing a newline was torn into two rows, and a blank
 * header shifted every later column); see that file for the details. This
 * wizard reads the fixed parser through the re-exports below, so its behaviour
 * changed only in that those two cases now work.
 */

export { parseCsv as parseCSV, readFileAsText, MAX_ROWS } from '../../../utils/csvParse';

export function generateSampleCSV(): string {
  const header = 'First Name,Last Name,Email,Phone,Company,Job Title,Industry,LinkedIn URL,Tags,Notes';
  const rows = [
    'Jane,Smith,jane@acme.com,+1 555 100 2000,Acme Corp,VP of Engineering,Technology,https://linkedin.com/in/janesmith,"enterprise, hot-lead",Met at SaaStr',
    'Bob,Jones,bob@globex.com,,Globex Inc,Sales Director,Manufacturing,,,Follow up Q3',
  ];
  return [header, ...rows].join('\n');
}
