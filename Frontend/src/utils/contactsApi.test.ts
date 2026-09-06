import { describe, it, expect } from 'vitest';
import {
  mapRowToContact, mapContactToPayload, splitName,
  type ContactRow,
} from './contactsApi';

/**
 * Each case below is a defect that shipped, not a hypothetical. The contact
 * form collected 22 fields, had columns for 11, and reported success either
 * way; migration 020 added the rest and these pin the mapping in both
 * directions.
 */

const row = (over: Partial<ContactRow> = {}): ContactRow => ({
  id: 'CT001',
  first_name: 'Ada',
  last_name: 'Lovelace',
  email: 'ada@example.com',
  ...over,
});

describe('mapRowToContact', () => {
  it('maps every column added by migration 020', () => {
    const c = mapRowToContact(row({
      street: '1 Market St', city: 'San Francisco', state: 'California',
      postal_code: '94105', country: 'United States',
      timezone: 'America/Los_Angeles', notes: 'Met at a conference.',
      tags: ['VIP'], source: 'referral', status: 'inactive',
      owner_id: 7, owner_name: 'Alex Rodriguez',
    }));
    expect(c.street).toBe('1 Market St');
    expect(c.city).toBe('San Francisco');
    expect(c.state).toBe('California');
    expect(c.postalCode).toBe('94105');
    expect(c.country).toBe('United States');
    expect(c.timezone).toBe('America/Los_Angeles');
    expect(c.notes).toBe('Met at a conference.');
    expect(c.tags).toEqual(['VIP']);
    expect(c.source).toBe('referral');
    expect(c.status).toBe('inactive');
    expect(c.ownerId).toBe(7);
    expect(c.ownerName).toBe('Alex Rodriguez');
  });

  it('leaves an unowned contact with no owner rather than an empty name', () => {
    // The join used to yield '' for owner_name, which renders as a named owner
    // whose name is blank. Absent is the truth.
    const c = mapRowToContact(row({ owner_id: null, owner_name: null }));
    expect(c.ownerId).toBeUndefined();
    expect(c.ownerName).toBeUndefined();
  });

  it('drops a value outside the union rather than casting it', () => {
    // Happens if the CHECK constraint is widened without updating the client.
    // Casting would put a value the UI has no branch for into the union.
    const c = mapRowToContact(row({ source: 'carrier-pigeon', status: 'archived' }));
    expect(c.source).toBeUndefined();
    // status is NOT NULL DEFAULT 'active', so a default here is a fact about
    // the column rather than an invention.
    expect(c.status).toBe('active');
  });

  it('leaves an unrecorded source absent instead of calling it manual', () => {
    // Most existing rows have no source. Defaulting to 'manual' made the
    // contacts list report every one of them as hand-entered.
    expect(mapRowToContact(row({ source: null })).source).toBeUndefined();
    expect(mapRowToContact(row({ source: '' })).source).toBeUndefined();
  });

  it('never turns a string of tags into a char-indexed array', () => {
    // leads.tags was a semicolon-delimited text column read with
    // Array.isArray, so lead tags were invisible for months (migration 012).
    const c = mapRowToContact(row({ tags: 'VIP;Hot' as unknown as string[] }));
    expect(c.tags).toEqual([]);
  });

  it('keeps phone and mobile distinct', () => {
    // The old mapper did `phone ?? mobile`, so a contact with only a mobile
    // showed it as a landline and a round-trip moved the number to phone.
    const c = mapRowToContact(row({ phone: null, mobile: '555-9999' }));
    expect(c.phone).toBeUndefined();
    expect(c.mobile).toBe('555-9999');
  });

  it('names a contact by email when there is no name to show', () => {
    const c = mapRowToContact({ id: 'CT9', first_name: '', last_name: null, email: 'x@y.com' });
    expect(c.name).toBe('x@y.com');
  });
});

describe('mapContactToPayload', () => {
  it('sends every new field under its column name', () => {
    const p = mapContactToPayload({
      name: 'Ada Lovelace', street: '1 Market St', city: 'SF', state: 'CA',
      postalCode: '94105', country: 'US', timezone: 'America/Los_Angeles',
      notes: 'n', tags: ['VIP'], source: 'referral', status: 'do-not-contact',
      ownerId: 7, mobile: '555-9999',
    });
    expect(p).toMatchObject({
      first_name: 'Ada', last_name: 'Lovelace',
      street: '1 Market St', city: 'SF', state: 'CA', postal_code: '94105',
      country: 'US', timezone: 'America/Los_Angeles', notes: 'n',
      tags: ['VIP'], source: 'referral', status: 'do-not-contact',
      owner_id: 7, mobile: '555-9999',
    });
  });

  it('omits fields the caller did not set, so a PATCH cannot blank them', () => {
    const p = mapContactToPayload({ notes: 'only this' });
    expect(Object.keys(p)).toEqual(['notes']);
  });

  it('does not send join-only fields as columns', () => {
    // company and ownerName come from LEFT JOINs. Sending them would be
    // writing to a column that does not exist.
    const p = mapContactToPayload({ company: 'Acme', ownerName: 'Alex' });
    expect(p).toEqual({});
  });

  it('sends an explicitly emptied field so it can be cleared', () => {
    const p = mapContactToPayload({ notes: '' });
    expect(p).toEqual({ notes: '' });
  });
});

describe('splitName', () => {
  it('keeps a multi-part surname together', () => {
    expect(splitName('Ada van der Berg')).toEqual({ first_name: 'Ada', last_name: 'van der Berg' });
  });
  it('handles a single name', () => {
    expect(splitName('Prince')).toEqual({ first_name: 'Prince' });
  });
});
