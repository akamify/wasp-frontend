import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspaceScope } from '../src/modules/commerce/scope.mjs';
test('workspace request pins ownership and returns the response body', async () => {
  const calls = [], scope = createWorkspaceScope('a', async (options) => { calls.push(options); return { data: { items: [] } }; }, () => 'a');
  assert.deepEqual(await scope.request('/orders', { method: 'POST', data: { revision: 2 }, headers: { 'x-workspace-id': 'foreign' } }), { items: [] });
  assert.equal(calls[0].url, '/commerce/orders'); assert.equal(calls[0].expectedWorkspaceId, 'a'); assert.equal(calls[0].headers['x-workspace-id'], 'a');
  assert.deepEqual(calls[0].data, { revision: 2 }); scope.dispose();
});
test('switch before dispatch and disposed scopes never call transport', async () => {
  let current = 'b', calls = 0;
  const scope = createWorkspaceScope('a', async () => { calls++; return { data: {} }; }, () => current);
  await assert.rejects(scope.request('/gateways/manual'), { name: 'AbortError' }); current = 'a'; scope.dispose();
  await assert.rejects(scope.request('/gateways/manual'), { name: 'AbortError' }); assert.equal(calls, 0);
});
test('workspace changes while a response is in flight discard old data', async () => {
  let resolve, current = 'a';
  const scope = createWorkspaceScope('a', () => new Promise((done) => { resolve = done; }), () => current);
  const request = scope.request('/products'); current = 'b'; resolve({ data: { secret: 'old workspace' } });
  await assert.rejects(request, { name: 'AbortError' }); scope.dispose();
});
test('unmount aborts all requests even when transport ignores cancellation', async () => {
  const calls = [], scope = createWorkspaceScope('a', (options) => new Promise((resolve) => calls.push({ options, resolve })), () => 'a');
  const a = scope.request('/products'), b = scope.request('/orders'); scope.dispose();
  for (const call of calls) { assert.equal(call.options.signal.aborted, true); call.resolve({ data: {} }); }
  await assert.rejects(a, { name: 'AbortError' }); await assert.rejects(b, { name: 'AbortError' });
});
test('aborting one view leaves independent requests usable', async () => {
  const calls = [], scope = createWorkspaceScope('a', (options) => new Promise((resolve) => calls.push({ options, resolve })), () => 'a');
  const controller = new AbortController(), a = scope.request('/products', { signal: controller.signal }), b = scope.request('/products');
  controller.abort(); assert.equal(calls[0].options.signal.aborted, true); assert.equal(calls[1].options.signal.aborted, false);
  calls.forEach((c) => c.resolve({ data: 'ok' })); await assert.rejects(a, { name: 'AbortError' }); assert.equal(await b, 'ok'); scope.dispose();
});
test('already aborted request never dispatches; rejected request can be retried', async () => {
  let calls = 0; const scope = createWorkspaceScope('a', async () => { if (++calls === 1) throw new Error('offline'); return { data: 'recovered' }; }, () => 'a');
  await assert.rejects(scope.request('/access', { signal: AbortSignal.abort() }), { name: 'AbortError' }); assert.equal(calls, 0);
  await assert.rejects(scope.request('/access'), /offline/); assert.equal(await scope.request('/access'), 'recovered'); scope.dispose();
});
