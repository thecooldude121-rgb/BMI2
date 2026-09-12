import { describe, it, expect } from 'vitest';
import { NEW_MENU_ITEMS } from './TopBar';
import { isReservedRecordSegment } from '../../utils/reservedRouteSegments';

/**
 * Three of the five items in the global "+ New" menu were broken, and the two
 * worst pointed at `/crm/deals/new` and `/accounts/new` — paths with no route,
 * which fell through to the id routes and rendered "Deal not found" and
 * "Account not found" for records the user had just asked to create.
 *
 * This is a cheap guard against the specific regression: the menu is five string
 * literals, and a literal is exactly the kind of thing a careless edit changes
 * without producing a type error or a failing test.
 */
describe('the + New menu points at create surfaces', () => {
  it('has an entry for each record type, and no /accounts/new outside /crm', () => {
    const hrefs = NEW_MENU_ITEMS.map(i => i.href);
    expect(hrefs).toEqual([
      '/crm/deals/new',
      '/crm/contacts/new',
      '/crm/leads/new',
      '/crm/accounts/new',
      '/crm/tasks?new=1',
    ]);
  });

  it('never points the Task item at a create PAGE — there is none, it is a modal', () => {
    const task = NEW_MENU_ITEMS.find(i => i.label === 'New Task');
    expect(task?.href).toBe('/crm/tasks?new=1');
    // The old value. A task create route does not exist and should not: creating
    // a task is TaskFormModal, already built and already wired to the API.
    expect(task?.href).not.toBe('/crm/tasks/new');
  });

  it('every path-based item ends in a segment that is reserved, never an id', () => {
    for (const { label, href } of NEW_MENU_ITEMS) {
      const path = href.split('?')[0];
      const last = path.split('/').filter(Boolean).pop();
      if (href.includes('?')) continue; // query-driven items address a list, not a record
      expect(isReservedRecordSegment(last), `${label} ends in "${last}", which would read as a record id`).toBe(true);
    }
  });
});
