import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sampleDataRobots } from '../lib/zfe-source.ts';

describe('sampleDataRobots', () => {
  it('con datos de ejemplo: noindex, follow', () => {
    assert.deepEqual(sampleDataRobots(true), { index: false, follow: true });
  });

  it('con datos oficiales: sin meta robots', () => {
    assert.equal(sampleDataRobots(false), undefined);
  });
});
