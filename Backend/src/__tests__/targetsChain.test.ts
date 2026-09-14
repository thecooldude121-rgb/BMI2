import { describe, it, expect } from 'vitest';
import { chainAbove, type ManagerEdge } from '../utils/reportingLine';
import { canReadTargetsOf, canSetTargetsFor, type TargetSubject } from '../utils/targets';

/**
 * The reporting-chain rule, unit-tested without a database.
 *
 * The round-trip suite (roundTrip.targetsVisibility.test.ts) proves the same
 * boundary through the real endpoints; this file exists because the cases that
 * matter most here are the ones that are AWKWARD TO CREATE THROUGH THE API —
 * a cycle, a manager_id pointing at nobody, a chain deeper than any real org.
 * `wouldCreateCycle` refuses to write a cycle, so the only way to test that the
 * walk survives one is to hand it the edges directly.
 *
 * Both rules are transitive over the SAME array, which is the property worth
 * pinning: "may set" and "may see" cannot come to disagree about who oversees
 * whom, because there is one chain and two readings of it.
 */

/** vp <- mid <- rep <- junior, plus someone reporting to nobody. */
const ORG: ManagerEdge[] = [
  { id: 1, manager_id: null },   // vp
  { id: 2, manager_id: 1 },      // mid
  { id: 3, manager_id: 2 },      // rep
  { id: 4, manager_id: 3 },      // junior
  { id: 9, manager_id: null },   // outsider
];

const subject = (id: number, role: string, edges: ManagerEdge[] = ORG): TargetSubject =>
  ({ id, role, managerChain: chainAbove(edges, id) });

describe('chainAbove — the one definition of "in someone\'s management chain"', () => {
  it('collects every ancestor, nearest first, to the top of the tree', () => {
    expect(chainAbove(ORG, 4)).toEqual([3, 2, 1]);
    expect(chainAbove(ORG, 3)).toEqual([2, 1]);
    expect(chainAbove(ORG, 2)).toEqual([1]);
  });

  it('is empty at the top, and for someone who reports to nobody', () => {
    expect(chainAbove(ORG, 1)).toEqual([]);
    expect(chainAbove(ORG, 9)).toEqual([]);
  });

  it('is empty for an id that is not in the workspace at all', () => {
    expect(chainAbove(ORG, 404)).toEqual([]);
  });

  it('does NOT collect a manager_id with no row here — a cross-workspace edge ends the walk', () => {
    // users.id is a global primary key, so manager_id CAN name a user in
    // another workspace. loadManagerEdges is tenant-scoped, so that id simply
    // has no row, and it must not be reported as an ancestor: doing so would
    // hand someone in workspace B a read of workspace A's targets.
    const edges: ManagerEdge[] = [{ id: 1, manager_id: 777 }, { id: 2, manager_id: 1 }];
    expect(chainAbove(edges, 1)).toEqual([]);
    expect(chainAbove(edges, 2)).toEqual([1]);
  });

  it('TERMINATES on a cycle, and keeps the ancestors that are real', () => {
    // Migration 041's CHECK stops A -> A. Nothing in Postgres stops A -> B -> A,
    // and this data is reachable by direct SQL even though the API refuses it.
    const cyclic: ManagerEdge[] = [
      { id: 1, manager_id: 2 },
      { id: 2, manager_id: 1 },
      { id: 3, manager_id: 1 },
    ];
    expect(chainAbove(cyclic, 3)).toEqual([1, 2]);
    // From inside the loop: 1's manager is 2, and 2's manager is 1 — the walker
    // itself, which is not its own ancestor. It stops there rather than
    // reporting the person as above themselves.
    expect(chainAbove(cyclic, 1)).toEqual([2]);
  });

  it('stops at MAX_DEPTH rather than walking a pathological chain forever', () => {
    // 200 people in a line. The walk is bounded at 64.
    const deep: ManagerEdge[] = Array.from({ length: 200 }, (_, i) => ({
      id: i + 1, manager_id: i === 0 ? null : i,
    }));
    expect(chainAbove(deep, 200).length).toBe(64);
  });
});

describe('canSetTargetsFor — the write rule is the SUBTREE, not direct reports', () => {
  const vp = { id: 1, role: 'manager' };
  const mid = { id: 2, role: 'manager' };
  const admin = { id: 99, role: 'admin' };

  it('a manager sets targets for a report TWO levels down', () => {
    expect(canSetTargetsFor(vp, subject(3, 'sales'), false)).toBe(true);
  });

  it('and THREE levels down — the depth is not bounded, the tree is', () => {
    expect(canSetTargetsFor(vp, subject(4, 'sales'), false)).toBe(true);
  });

  it('but never for someone outside their subtree', () => {
    expect(canSetTargetsFor(vp, subject(9, 'sales'), false)).toBe(false);
  });

  it('and never UPWARD — a manager cannot reach their own manager', () => {
    expect(canSetTargetsFor(mid, subject(1, 'manager'), false)).toBe(false);
  });

  it('canActOn still bounds it: a manager cannot set an admin\'s targets, subtree or not', () => {
    expect(canSetTargetsFor(vp, subject(3, 'admin'), false)).toBe(false);
  });

  it('a SALES rep with reports of their own still sets nobody\'s targets', () => {
    // id 3 is above id 4, but role decides the write. This is the asymmetry
    // with canReadTargetsOf below, and it is deliberate.
    expect(canSetTargetsFor({ id: 3, role: 'sales' }, subject(4, 'sales'), false)).toBe(false);
  });

  it('an admin sets anyone\'s; the self case still needs the workspace toggle', () => {
    expect(canSetTargetsFor(admin, subject(9, 'sales'), false)).toBe(true);
    expect(canSetTargetsFor(vp, subject(1, 'manager'), false)).toBe(false);
    expect(canSetTargetsFor(vp, subject(1, 'manager'), true)).toBe(true);
  });

  it('an unrecognised role sets nothing', () => {
    expect(canSetTargetsFor({ id: 1, role: 'wizard' }, subject(3, 'sales'), true)).toBe(false);
  });
});

describe('canReadTargetsOf — visible to yourself, to everyone above you, and to admins', () => {
  it('a person reads their own, with no toggle involved', () => {
    expect(canReadTargetsOf({ id: 3, role: 'sales' }, subject(3, 'sales'))).toBe(true);
  });

  it('reads UP the chain, more than one level', () => {
    expect(canReadTargetsOf({ id: 2, role: 'manager' }, subject(4, 'sales'))).toBe(true);
    expect(canReadTargetsOf({ id: 1, role: 'manager' }, subject(4, 'sales'))).toBe(true);
  });

  it('a colleague outside the chain reads nothing of theirs', () => {
    expect(canReadTargetsOf({ id: 9, role: 'sales' }, subject(4, 'sales'))).toBe(false);
    expect(canReadTargetsOf({ id: 4, role: 'sales' }, subject(3, 'sales'))).toBe(false);
  });

  it('is one-directional: a report cannot read their manager\'s', () => {
    expect(canReadTargetsOf({ id: 3, role: 'sales' }, subject(2, 'manager'))).toBe(false);
  });

  it('an admin reads everyone\'s', () => {
    expect(canReadTargetsOf({ id: 99, role: 'admin' }, subject(9, 'sales'))).toBe(true);
  });

  it('a SALES rep DOES read their own report\'s — role does not gate the read', () => {
    // The counterpart of the write case above. Chain membership is the rule as
    // decided, and a rep only sits above someone because an admin or manager
    // put them there.
    expect(canReadTargetsOf({ id: 3, role: 'sales' }, subject(4, 'sales'))).toBe(true);
  });

  it('an unrecognised role reads nothing — not even its own row', () => {
    expect(canReadTargetsOf({ id: 3, role: 'wizard' }, subject(3, 'wizard'))).toBe(false);
  });
});

describe('the two rules agree: everything editable is readable', () => {
  it('holds for every actor/subject pair in the org, with the toggle both ways', () => {
    const actors = [
      { id: 1, role: 'manager' }, { id: 2, role: 'manager' },
      { id: 3, role: 'sales' }, { id: 4, role: 'sales' },
      { id: 9, role: 'sales' }, { id: 99, role: 'admin' },
    ];
    for (const actor of actors) {
      for (const id of [1, 2, 3, 4, 9]) {
        for (const toggle of [false, true]) {
          const s = subject(id, id <= 2 ? 'manager' : 'sales');
          if (canSetTargetsFor(actor, s, toggle)) {
            expect(
              canReadTargetsOf(actor, s),
              `actor ${actor.id} may set ${id} but not read them`,
            ).toBe(true);
          }
        }
      }
    }
  });
});
