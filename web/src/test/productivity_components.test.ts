import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  fuzzyMatch,
  normalizeSubject,
  extractPlaceholders,
  interpolateString,
  applyOperationToItem,
  validateSendTime,
  validateGracePeriod,
  calculateSnoozeTimestamp,
} from '../../../api/src/modules/productivity';

describe('Web Productivity Components & Client Helpers', () => {
  it('should test fuzzyMatch for Command Palette in client environment', () => {
    const res = fuzzyMatch('send later', 'Schedule Send (Send Later)');
    assert.equal(res.matched, true);
    assert.ok(res.score > 0);
  });

  it('should format templates with client context', () => {
    const tpl = 'Hello {{name | capitalize}}, meeting at {{time}}.';
    const res = interpolateString(tpl, { name: 'john doe', time: '2:00 PM' });
    assert.equal(res.text, 'Hello John Doe, meeting at 2:00 PM.');
  });

  it('should validate send later timestamp for modal submission', () => {
    const future = Date.now() + 60000;
    const val = validateSendTime(future);
    assert.equal(val.valid, true);
  });

  it('should test grace period bounds for Undo Send banner', () => {
    const val = validateGracePeriod(15);
    assert.equal(val.clampedSeconds, 15);
  });

  it('should test snooze presets for SnoozeMenu', () => {
    const res = calculateSnoozeTimestamp('later_today');
    assert.ok(res.timestamp > Date.now());
  });

  it('should test client batch action optimistic mutation', () => {
    const item = { id: '1', read: false, starred: false };
    const { updated } = applyOperationToItem(item, 'star');
    assert.equal(updated.starred, true);
  });

  it('should normalize subjects for tree view thread clustering', () => {
    assert.equal(normalizeSubject('Re: [Support] Ticket #100'), 'ticket #100');
  });
});
