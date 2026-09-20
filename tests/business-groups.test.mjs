import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const external = createRequire(import.meta.url);
const refreshModule = { exports: {} };
new Function('module', 'exports', ts.transpileModule(readFileSync(new URL('../src/modules/business-groups/reportRefresh.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(refreshModule, refreshModule.exports);
const { startReportRefresh } = refreshModule.exports;
const source = ts.transpileModule(readFileSync(new URL('../src/modules/business-groups/BusinessGroupsPage.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;

// Supply deterministic hook state to the real page; no network or browser globals.
function fixture({ group = null, inbox = [], report = null, loading = false, busy = false, error = '', environment = 'live' } = {}) {
  const calls = [];
  const states = { 0: group, 5: 'workspace', 6: 'workspace', 7: inbox, 9: environment, 12: report, 14: busy, 15: loading, 17: error };
  let index = 0;
  const module = { exports: {} };
  const api = {
    get: async (url) => ({ data: url.endsWith('/owned-workspaces') ? { items: [], next: null } : { group } }),
    post: async (url, body) => { calls.push({ url, body }); return { data: {} }; },
    put: async (url, body) => { calls.push({ url, body }); return { data: {} }; },
  };
  new Function('require', 'module', 'exports', source)((name) => {
    if (name === 'react') return { ...React, useEffect() {}, useCallback: (f) => f, useRef: (current) => ({ current }),
      useState: (initial) => { const key = index++; return [Object.hasOwn(states, key) ? states[key] : typeof initial === 'function' ? initial() : initial, () => {}]; } };
    if (name === '@api/api') return { api };
    if (name === './reportRefresh') return refreshModule.exports;
    if (name === '@components/ui/Button') return { Button: (props) => React.createElement('button', props) };
    return external(name);
  }, module, module.exports);
  const tree = module.exports.default();
  const nodes = [];
  function walk(node) { if (!node || typeof node !== 'object') return; if (Array.isArray(node)) return node.forEach(walk); nodes.push(node); walk(node.props?.children); }
  walk(tree);
  return { html: renderToStaticMarkup(tree), calls, button: (text) => nodes.find((n) => n.props?.children === text && n.props?.onClick) };
}
const group = { id: 'group-owner', name: 'My group', links: [{ workspaceId: 'workspace', requestId: 'request-1', status: 'active', name: '<Restaurant>' }] };
test('group page renders loading, error and unconfigured states without showing commerce totals', () => {
  assert.match(fixture({ loading: true }).html, /Loading Business Groups/);
  const html = fixture({ error: 'Offline. Retry.' }).html;
  assert.match(html, /role="alert"/); assert.match(html, /Create your reporting group/); assert.doesNotMatch(html, /Combined commerce report/);
});
test('report displays read-only metrics, precise financial semantics and escaped names', () => {
  const report = { rows: [{ workspaceId: 'workspace', name: '<Restaurant>', orders: 2, paidOrders: 1, completedOrders: 1, payments: [{ currency: 'INR', capturedPaise: 15000, refundedPaise: 2000 }] }], uniqueOrderCustomers: 1, uniqueContactNumbers: 4, orders: [], next: null };
  const html = fixture({ group, report, environment: 'test' }).html;
  assert.match(html, /&lt;Restaurant&gt;/); assert.doesNotMatch(html, /<Restaurant>/);
  assert.match(html, /150\.00/); assert.match(html, /20\.00/); assert.match(html, /first recorded the verified payment/);
  assert.match(html, /do not have Test\/Live separation/); assert.match(html, /No orders in this period/);
  assert.match(html, /value="test" selected=""/); assert.doesNotMatch(html, /Refund payment|Edit order/);
});
test('connect, approval, rejection and revoke controls send scoped explicit actions', async () => {
  const f = fixture({ group, inbox: [{ groupId: 'requester', groupName: 'Another group', workspaceId: 'workspace', requestId: 'pending-1', status: 'pending' }] });
  await f.button('Connect workspace').props.onClick();
  await f.button('Approve reporting').props.onClick();
  await f.button('Reject').props.onClick();
  await f.button('Disconnect').props.onClick();
  assert.deepEqual(f.calls.map((c) => c.body), [{ workspaceId: 'workspace' }, { requestId: 'pending-1', decision: 'approve' }, { requestId: 'pending-1', decision: 'reject' }, { requestId: 'request-1', decision: 'revoke' }]);
  assert.equal(f.calls[1].url, '/business-groups/requester/links/workspace/decision');
  assert.equal(f.calls[3].url, '/business-groups/group-owner/links/workspace/decision');
});
test('busy state disables permission mutation controls', () => {
  const f = fixture({ group, busy: true });
  assert.equal(f.button('Connect workspace').props.disabled, true); assert.equal(f.button('Disconnect').props.disabled, true);
});
test('four panel order summaries and combined captures appear in one dashboard', () => {
  const rows = Array.from({ length: 4 }, (_, i) => ({ workspaceId: `panel-${i}`, name: `Restaurant ${i}`, orders: 1, paidOrders: 1, completedOrders: 0,
    payments: [{ currency: 'INR', capturedPaise: 10000, refundedPaise: 500 }] }));
  const report = { rows, generatedAt: '2026-09-19T12:00:00Z', uniqueOrderCustomers: 3, uniqueContactNumbers: 8, next: null,
    orders: rows.map((r, i) => ({ _id: `order-${i}`, workspaceId: r.workspaceId, orderNumber: `AWC-${i}`, status: 'confirmed', paymentStatus: 'captured', totalPaise: 10000, currency: 'INR' })) };
  const html = fixture({ group, report }).html;
  for (let i = 0; i < 4; i++) { assert.match(html, new RegExp(`AWC-${i}`)); assert.match(html, new RegExp(`Restaurant ${i}`)); }
  assert.match(html, /Combined captured \(INR\)/); assert.match(html, /400\.00/); assert.match(html, /20\.00/);
  assert.match(html, /Auto-refresh every 30 seconds/); assert.match(html, /Last updated:/);
});
test('refresh waits for completion, suppresses overlapping requests and aborts on cleanup', async (t) => {
  const timers = [];
  t.mock.method(globalThis, 'setTimeout', (fn, delay) => { assert.equal(delay, 30000); timers.push(fn); return 1; });
  t.mock.method(globalThis, 'clearTimeout', () => {});
  let complete, signal, requests = 0;
  const published = [];
  const run = startReportRefresh({ load: (s) => { requests++; signal = s; return new Promise((resolve) => { complete = resolve; }); },
    onSuccess: (data) => published.push(data), onError: () => assert.fail('unexpected error'), onLoading() {}, canRefresh: () => true, repeat: true });
  await run.refresh(); assert.equal(requests, 1); assert.equal(timers.length, 0);
  complete('first'); await new Promise(setImmediate);
  assert.deepEqual(published, ['first']); assert.equal(timers.length, 1);
  timers.shift()(); assert.equal(requests, 2);
  run.stop(); assert.equal(signal.aborted, true);
  complete('stale'); await new Promise(setImmediate);
  assert.deepEqual(published, ['first']); assert.equal(timers.length, 0);
});
test('refresh skips hidden/offline views and retries failures without overlapping requests', async (t) => {
  const timers = [];
  t.mock.method(globalThis, 'setTimeout', (fn) => { timers.push(fn); return 1; });
  t.mock.method(globalThis, 'clearTimeout', () => {});
  let visible = false, requests = 0, failures = 0, successes = 0;
  const run = startReportRefresh({ load: async () => { if (++requests === 1) throw new Error('offline'); return 'recovered'; },
    onSuccess: () => successes++, onError: () => failures++, onLoading() {}, canRefresh: () => visible, repeat: true });
  assert.equal(requests, 0); visible = true;
  timers.shift()(); await new Promise(setImmediate); assert.equal(failures, 1);
  timers.shift()(); await new Promise(setImmediate); assert.equal(successes, 1); run.stop();
});
test('manual mode makes one request and schedules no polling', async (t) => {
  t.mock.method(globalThis, 'setTimeout', () => assert.fail('manual mode must not poll'));
  const run = startReportRefresh({ load: async () => 'data', onSuccess() {}, onError() {}, onLoading() {}, canRefresh: () => true, repeat: false });
  await new Promise(setImmediate); run.stop();
});
