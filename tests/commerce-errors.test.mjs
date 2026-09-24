import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commerceErrorMessage } from '../src/modules/commerce/errorMessage.mjs';

test('catalog diagnostics show safe authorization evidence without provider response text', () => {
  const message = commerceErrorMessage({ response: { data: {
    message: 'The current Meta token is authorized for a different catalog.',
    details: {
      diagnosticCode: 'requested_catalog_not_authorized',
      requestedCatalogId: '4351882411734068',
      authorizedCatalogIds: ['999'],
      providerTraceId: 'trace_123',
      providerError: 'secret provider text',
    },
  } } });
  assert.match(message, /requested_catalog_not_authorized/);
  assert.match(message, /Requested catalog: 4351882411734068/);
  assert.match(message, /Authorized catalogs: 999/);
  assert.match(message, /Meta trace: trace_123/);
  assert.doesNotMatch(message, /secret provider text/);
});

test('ordinary validation and fallback messages preserve their existing format', () => {
  assert.equal(commerceErrorMessage({ response: { data: { message: 'Invalid', details: { fields: ['name'] } } } }), 'Invalid: name');
  assert.equal(commerceErrorMessage({}), 'The request could not be completed. Refresh its status before retrying.');
});
