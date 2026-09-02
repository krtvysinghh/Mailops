import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  hasPermission,
  isValidStatusTransition,
  stripInternalNotesFromOutboundEmail,
  threeWayMerge,
  extractMentions,
  highlightMentionsInText,
  resolveTagPath,
  extractCompanyFromEmail,
  calculateRelationshipHealthScore,
} from '../../../api/src/modules/collaboration';

describe('Web Collaboration Client Utilities & Component Logic Tests', () => {
  it('Validates role permissions for UI button visibility', () => {
    assert.strictEqual(hasPermission('owner', 'inbox:manage'), true);
    assert.strictEqual(hasPermission('viewer', 'inbox:manage'), false);
    assert.strictEqual(hasPermission('member', 'draft:edit'), true);
  });

  it('Validates status transitions for dropdown selector', () => {
    assert.strictEqual(isValidStatusTransition('unassigned', 'in_progress'), true);
    assert.strictEqual(isValidStatusTransition('in_progress', 'resolved'), true);
    assert.strictEqual(isValidStatusTransition('resolved', 'in_progress'), true);
  });

  it('Ensures client-side note stripping before email reply dispatch', () => {
    const draftContent = 'Hello,\n<internal-note>Review required</internal-note>\nThank you!';
    const stripped = stripInternalNotesFromOutboundEmail(draftContent);
    assert.strictEqual(stripped.includes('Review required'), false);
    assert.strictEqual(stripped.includes('Thank you!'), true);
  });

  it('Performs 3-way merge on concurrent drafts in composer', () => {
    const base = 'Initial body';
    const userA = 'Initial body with Alex edits';
    const userB = 'Initial body';
    const merge = threeWayMerge(base, userA, userB);
    assert.strictEqual(merge.hasConflicts, false);
    assert.strictEqual(merge.mergedText, 'Initial body with Alex edits');
  });

  it('Highlights mentions in comments with styled HTML badges', () => {
    const html = highlightMentionsInText('Ping @sarah and @alex');
    assert.ok(html.includes('@sarah'));
    assert.ok(html.includes('@alex'));
    assert.ok(html.includes('class="mention'));
  });

  it('Computes CRM relationship health score for sidebar meter', () => {
    const health = calculateRelationshipHealthScore(12, new Date(), 6, 6);
    assert.ok(health >= 80);
  });

  it('Parses company domain name for CRM profile card', () => {
    const { domain, companyName } = extractCompanyFromEmail('contact@spacex.com');
    assert.strictEqual(domain, 'spacex.com');
    assert.strictEqual(companyName, 'Spacex');
  });
});
