import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatIsoDateFr, todayIsoInParis } from '../lib/format-date';

describe('formatIsoDateFr', () => {
  it('día normal', () => {
    assert.equal(formatIsoDateFr('2026-11-19'), '19 novembre 2026');
  });

  it('el día 1 sale como « 1er »', () => {
    assert.equal(formatIsoDateFr('2028-01-01'), '1er janvier 2028');
  });

  it('mes con acento', () => {
    assert.equal(formatIsoDateFr('2026-08-15'), '15 août 2026');
    assert.equal(formatIsoDateFr('2027-02-03'), '3 février 2027');
  });
});

describe('todayIsoInParis', () => {
  it('usa la hora de París: 23:30 UTC del 31 dic ya es 1 ene en París', () => {
    assert.equal(todayIsoInParis(new Date('2026-12-31T23:30:00Z')), '2027-01-01');
  });

  it('mediodía UTC: mismo día', () => {
    assert.equal(todayIsoInParis(new Date('2026-11-19T12:00:00Z')), '2026-11-19');
  });
});
