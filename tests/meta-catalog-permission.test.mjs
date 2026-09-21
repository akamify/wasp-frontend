import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const external = createRequire(import.meta.url);
const cache = new Map();
function load(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} }; cache.set(filename, module);
  const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const resolve = (name) => {
    if (!name.startsWith('.') && !/^@(components|shared)\//.test(name)) return external(name);
    const base = name.startsWith('.') ? path.resolve(path.dirname(filename), name) : path.join(root, name.slice(1));
    const resolved = ['', '.tsx', '.ts', '.js', '/index.tsx', '/index.ts'].map((ext) => base + ext).find(existsSync);
    if (!resolved) throw new Error(`Unresolved dependency: ${name}`);
    return load(resolved);
  };
  new Function('require', 'module', 'exports', source)(resolve, module, module.exports);
  return module.exports;
}
const componentPath = path.join(root, 'pages/user/components/CatalogPermissionControl.tsx');
const { CatalogPermissionControl } = load(componentPath);
const render = (props) => renderToStaticMarkup(React.createElement(CatalogPermissionControl, { authorize() {}, ...props }));

test('catalog authorization control is limited to connected accounts and shows current scope state', () => {
  assert.equal(render({ connected: false, granted: false, busy: false }), '');
  const missing = render({ connected: true, granted: false, busy: false });
  assert.match(missing, /Authorize catalog access/);
  assert.match(missing, /Catalog access: Authorization required/);
  assert.match(missing, /WhatsApp accounts and Catalogs assets/);
  assert.doesNotMatch(missing, /business management/);
  const granted = render({ connected: true, granted: true, busy: true });
  assert.match(granted, /Refresh catalog permission/);
  assert.match(granted, /Catalog access: Granted/);
  assert.match(granted, /disabled=""/);
});
