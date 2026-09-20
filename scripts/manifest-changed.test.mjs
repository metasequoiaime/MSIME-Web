import assert from 'node:assert/strict';
import { test } from 'node:test';
import { differsBeyondTimestamp } from './manifest-changed.mjs';

const manifest = (generatedAt, stars) => JSON.stringify({ generatedAt, totalStars: stars, repoCount: 14 });

test('a manifest that moved only its timestamp is not a change', () => {
  assert.equal(differsBeyondTimestamp(manifest('2026-09-20T00:00:00.000Z', 1554), manifest('2026-09-20T00:30:00.000Z', 1554)), false);
});

test('a real difference is still a change, timestamp or not', () => {
  assert.equal(differsBeyondTimestamp(manifest('2026-09-20T00:00:00.000Z', 1554), manifest('2026-09-20T00:30:00.000Z', 1555)), true);
  assert.equal(differsBeyondTimestamp(manifest('2026-09-20T00:00:00.000Z', 1554), manifest('2026-09-20T00:00:00.000Z', 1555)), true);
});

test('key order and nesting are compared, not just the fields this file knows about', () => {
  const before = JSON.stringify({ generatedAt: 'a', contributors: [{ login: 'houko', contributions: 2119 }] });
  const after = JSON.stringify({ generatedAt: 'b', contributors: [{ login: 'houko', contributions: 2120 }] });
  assert.equal(differsBeyondTimestamp(before, after), true);
  const reordered = JSON.stringify({ generatedAt: 'b', contributors: [{ contributions: 2119, login: 'houko' }] });
  assert.equal(differsBeyondTimestamp(before, reordered), true, 'a generator that reorders its output has changed it');
});

test('a missing or unreadable previous manifest proposes the change rather than swallowing it', () => {
  assert.equal(differsBeyondTimestamp('', manifest('2026-09-20T00:00:00.000Z', 1554)), true);
  assert.equal(differsBeyondTimestamp('not json', manifest('2026-09-20T00:00:00.000Z', 1554)), true);
  assert.equal(differsBeyondTimestamp(manifest('2026-09-20T00:00:00.000Z', 1554), 'truncated {'), true);
});
