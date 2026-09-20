import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import axios from 'axios';
async function fixture() {
  const data = new Map(), events = [];
  const context = vm.createContext({ URL, Date, Map, Set, Promise, atob, console, setTimeout, clearTimeout,
    localStorage: { getItem: (key) => data.get(key) || null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) },
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } },
    window: { location: { hostname: 'localhost' }, dispatchEvent: (event) => events.push(event) },
  });
  const source = await readFile(new URL('../src/api/api.js', import.meta.url), 'utf8');
  const module = new vm.SourceTextModule(source, { context, initializeImportMeta: (meta) => { meta.env = {}; } });
  await module.link(async (specifier) => {
    const name = specifier === 'axios' ? 'default' : 'build' + specifier.split('/').at(-1).replace(/^a/, 'A');
    return new vm.SyntheticModule([name], function () { this.setExport(name, specifier === 'axios' ? axios : () => ({})); }, { context });
  });
  await module.evaluate(); const api = module.namespace;
  api.setWorkspaceId('a'); data.set(api.TOKEN_KEY, 'test-token');
  return { ...Object.fromEntries(Object.keys(api).map((key) => [key, api[key]])), data, events };
}
test('actual Axios interceptor blocks a scoped mutation after workspace switching', async () => {
  const f = await fixture(); let calls = 0;
  f.api.defaults.adapter = async (config) => { calls++; return { config, status: 200, data: {}, headers: {} }; };
  await f.api.request({ url: '/commerce/products', expectedWorkspaceId: 'a', method: 'POST', data: {} }); assert.equal(calls, 1);
  f.setWorkspaceId('b');
  await assert.rejects(f.api.request({ url: '/commerce/products', expectedWorkspaceId: 'a', method: 'POST', data: {} }), (e) => e.code === 'ERR_CANCELED');
  assert.equal(calls, 1);
});
test('Commerce GETs use independent dispatch and ordinary GET coalescing stays intact', async () => {
  const f = await fixture(); let calls = 0;
  f.api.defaults.adapter = async (config) => { calls++; return { config, status: 200, data: {}, headers: {} }; };
  await Promise.all([f.api.request({ url: '/commerce/products', expectedWorkspaceId: 'a' }), f.api.request({ url: '/commerce/products', expectedWorkspaceId: 'a' })]);
  assert.equal(calls, 2);
  await Promise.all([f.api.request({ url: '/example' }), f.api.request({ url: '/example' })]); assert.equal(calls, 3);
});
test('token refresh cannot reset a newly selected workspace or retry the old Commerce mutation', async () => {
  const f = await fixture(); let mutations = 0, refreshes = 0;
  const token = `header.${Buffer.from(JSON.stringify({ workspaceId: 'a', role: 'user' })).toString('base64url')}.signature`;
  f.api.defaults.adapter = async (config) => {
    if (config.url === '/auth/refresh') { refreshes++; f.setWorkspaceId('b'); return { config, status: 200, data: { token }, headers: {} }; }
    mutations++; throw new axios.AxiosError('expired', 'ERR_BAD_REQUEST', config, null, { config, status: 401, data: {}, headers: {} });
  };
  await assert.rejects(f.api.request({ url: '/commerce/orders/order/payment-requests', expectedWorkspaceId: 'a', method: 'POST', data: {} }), (e) => e.code === 'ERR_CANCELED');
  assert.equal(mutations, 1); assert.equal(refreshes, 1); assert.equal(f.getWorkspaceId(), 'b'); assert.equal(f.getToken(), token);
});
