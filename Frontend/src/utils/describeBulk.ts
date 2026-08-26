/**
 * Turn a bulk-action result into the sentence a user is shown.
 *
 * Exists because the honest number and the obvious number differ. A bulk action
 * reports `affected` (rows that actually changed) alongside `requested` (ids the
 * client sent) and `not_found` (ids that are not in this tenant). Saying
 * "3 contacts deleted" when one of them had already been deleted elsewhere is
 * a small untruth, and this page was built almost entirely out of small
 * untruths — every bulk action used to be a local setState under a
 * "✅ Contacts deleted successfully!" alert.
 */
export interface BulkOutcome {
  affected: number;
  requested: number;
  not_found: string[];
}

/**
 * `pastTense` is the completed verb phrase, already inflected — 'Deleted',
 * 'Assigned', 'Added the tag "VIP" to'. It is passed in rather than derived,
 * because deriving it by appending 'd' produces 'Assignd' and 'Archived' from
 * the same rule and only one of them is a word.
 */
export function describeBulk(r: BulkOutcome, pastTense: string): string {
  const noun = `contact${r.affected === 1 ? '' : 's'}`;
  if (r.not_found.length === 0) return `${pastTense} ${r.affected} ${noun}`;
  const missing = r.not_found.length;
  return `${pastTense} ${r.affected} of ${r.requested} ${noun} — ${missing} no longer ${missing === 1 ? 'exists' : 'exist'}`;
}
