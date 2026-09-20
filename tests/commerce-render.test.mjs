import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
const root = fileURLToPath(new URL('../src/', import.meta.url)), external = createRequire(import.meta.url);
// Render the real TSX with deterministic API hook results. No browser, database or provider is contacted.
function fixture({ permissions = [], capabilities = {}, responses = {}, failure = '', loading = false, environment = 'test' } = {}) {
  const requested = [], cache = new Map();
  const context = { useCommerce: () => ({ environment, setEnvironment() {}, workspaceId: 'workspace',
    can: (key) => permissions.includes(key), access: { permissions, capabilities: { catalog: true, orders: true, payments: true, checkout: true, gateway: true, oauth: true, ...capabilities } } }),
    useCommerceQuery: (url) => { if (url) requested.push(url); return { data: url ? responses[url] : undefined, loading: !!url && loading, error: url ? failure : '', reload() {} }; },
    useCommerceAction: () => ({ busy: false, error: '', run() {} }),
    useWorkspaceId: () => 'workspace', CommerceProvider: ({ children }) => children,
  };
  function load(filename) {
    if (filename.endsWith('commerceContext.tsx')) return context;
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const source = ts.transpileModule(readFileSync(filename, 'utf8').replaceAll('import.meta.env', '({})'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const resolve = (name) => {
      if (name === '@api/api') return { API: { baseUrl: '/api' } };
      if (!name.startsWith('.') && !/^@(components|modules|shared)\//.test(name)) return external(name);
      const base = name.startsWith('.') ? path.resolve(path.dirname(filename), name) : path.join(root, name.slice(1));
      const resolved = ['', '.tsx', '.ts', '.js', '/index.tsx', '/index.ts'].map((ext) => base + ext).find(existsSync);
      if (!resolved) throw new Error(`Unresolved UI test dependency: ${name}`); return load(resolved);
    };
    new Function('require', 'module', 'exports', source)(resolve, module, module.exports); return module.exports;
  }
  const render = (name, props = {}, exported = 'default') => renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ['/app/commerce/settings'] }, React.createElement(load(path.join(root, 'modules/commerce', `${name}.tsx`))[exported], props)));
  return { render, requested, component: (name, exported = 'default') => load(path.join(root, 'modules/commerce', /\.[jt]sx?$/.test(name) ? name : `${name}.tsx`))[exported] };
}
const product = { id: 'product', sku: 'tea', name: '<script>untrusted</script>', pricePaise: 1234, stockOnHand: 5, stockReserved: 2, trackInventory: true, syncStatus: 'synced', revision: 1, syncedRevision: 1, available: true };

test('new catalog setup exposes creation and safe recovery states', () => {
  const render = (setup) => fixture({ responses: { '/catalog/setup': { setup } } }).render('CreateCatalog', { connected() {} }, 'CreateCatalog');
  assert.match(render(null), /Create &amp; connect/);
  assert.match(render({ name: 'Menu', catalogId: '123', state: 'created', activePhoneMatches: true }), /Catalog 123 has already been created/);
  assert.match(render({ name: 'Menu', catalogId: '', state: 'creating', activePhoneMatches: true }), /Existing catalog ID for recovery/);
  assert.match(render({ name: 'Menu', catalogId: '', state: 'creating', activePhoneMatches: false }), /fieldset disabled/);
});

test('product creation is disabled until the catalog product query succeeds', () => {
  const permissions = ['commerce.products.manage', 'commerce.catalog.manage'];
  const failed = fixture({ permissions, failure: 'Connect a catalog' }).render('ProductsPage');
  assert.match(failed, /disabled=""[^>]*>Add product/);
  assert.match(failed, /Open catalog setup/);
  const ready = fixture({ permissions, responses: { '/products': { products: [], nextCursor: null } } }).render('ProductsPage');
  assert.doesNotMatch(ready, /disabled=""[^>]*>Add product/);
});

test('branch queue displays acceptance links and bounded pickup capacity without claiming assignment', () => {
  const html = fixture({ responses: { '/outlets/branch/dispatch': { orders: [{ id: 'order', orderNumber: 'AWC-1' }], couriers: [{ _id: 'rider', name: '<rider>', distance: 1200, batchLoad: 12, batchCapacity: 30 }], eligiblePickupCouriers: 1, freeSlots: 18 } } }).render('BranchDispatch', { outletId: 'branch' });
  assert.match(html, /18 remaining slots/); assert.match(html, /12\/30/); assert.match(html, /1.2 km straight-line/); assert.match(html, /&lt;rider&gt;/); assert.match(html, /orders\/order/);
  assert.match(fixture({ responses: { '/outlets/branch/dispatch': { orders: [], couriers: [], eligiblePickupCouriers: 0, freeSlots: 0 } } }).render('BranchDispatch', { outletId: 'branch' }), /No automatically selected orders/);
});

test('order acceptance exposes nearest branch recommendation and retains explicit acceptance', () => {
  const html = fixture({ responses: { '/orders/order/delivery': { delivery: null, recommendation: { outletId: 'branch', name: 'Branch A', status: 'suggested' } }, '/outlets': { items: [] } } }).render('DeliveryManagement', { orderId: 'order', revision: 2, refreshed() {} }, 'OrderDelivery');
  assert.match(html, /Find nearest eligible branch/); assert.match(html, /Selected branch: Branch A/); assert.match(html, /Accept at branch/);
});

test('dispatch settings separate branch selection from courier priority and automatic offers', () => {
  const html = fixture({ responses: { '/delivery-settings': { routingEnabled: true, autoDispatchAvailable: true, branchAutoSelect: true, batchPriority: 'nearest_pickup', strategy: 'SMART' } }, permissions: ['commerce.delivery.manage'] }).render('RoutingAssistance', {}, 'DispatchSettings');
  for (const text of ['Automatically select nearest eligible branch', 'Nearest restaurant pickup first', 'Fill compatible loading trips first', 'Auto Dispatch ON/OFF']) assert.ok(html.includes(text));
});

test('routing assistance is flag gated, explicit and provides all three merchant-controlled modes', () => {
  const config = { routingEnabled: true, routeShortlist: 5, pickupRadiusMetres: 8000 };
  const props = { deliveryId: 'delivery', revision: 1, onSelect() {} };
  assert.equal(fixture({ responses: { '/delivery-settings': { ...config, routingEnabled: false } } }).render('RoutingAssistance', props, 'RoutingAssistance'), '');
  const html = fixture({ responses: { '/delivery-settings': config } }).render('RoutingAssistance', props, 'RoutingAssistance');
  for (const text of ['Nearest Pickup', 'Nearest Customer', 'Suggested Rider', 'Get recommendations', '5 eligible riders', '8 km']) assert.ok(html.includes(text));
});

test('dispatch settings expose all bounded values but only managers can save', () => {
  const config = { routingEnabled: true, newDispatchEnabled: true, revision: 1, pickupRadiusMetres: 8000, locationMaxAgeSeconds: 60, maxAccuracyMetres: 100, routeShortlist: 5, offerSeconds: 20 };
  const responses = { '/delivery-settings': config };
  const viewer = fixture({ responses }).render('RoutingAssistance', {}, 'DispatchSettings'); assert.match(viewer, /fieldset disabled/); assert.doesNotMatch(viewer, /Save dispatch settings/);
  const manager = fixture({ responses, permissions: ['commerce.delivery.manage'] }).render('RoutingAssistance', {}, 'DispatchSettings');
  for (const title of ['Pickup radius', 'Location freshness', 'Maximum GPS uncertainty', 'Route shortlist', 'Offer lifetime', 'Save dispatch settings']) assert.ok(manager.includes(title));
});

test('smart settings expose opt-in automation, vehicle rules and handover allowance with the server gate', () => {
  const config = { routingEnabled: true, newDispatchEnabled: true, autoDispatchAvailable: false, revision: 1, strategy: 'SMART', autoDispatch: false, allowedVehicles: ['car'], handoverSeconds: 120 };
  const render = (overrides = {}) => fixture({ responses: { '/delivery-settings': { ...config, ...overrides } }, permissions: ['commerce.delivery.manage'] }).render('RoutingAssistance', {}, 'DispatchSettings');
  const html = render();
  for (const text of ['SMART (recommended)', 'Nearest Pickup', 'Nearest Customer', 'Manual', 'Auto Dispatch ON/OFF', 'Handover allowance', 'Allowed vehicles', 'rider must still accept']) assert.ok(html.includes(text), text);
  assert.match(html, /type="checkbox" disabled=""/); assert.match(html, /unavailable on this server/);
  const enabled = render({ autoDispatchAvailable: true, autoDispatch: true }); assert.doesNotMatch(enabled, /unavailable on this server/); assert.match(enabled, /checked=""/);
});

test('manual takeover and resume remain visible only to managers on unassigned deliveries', () => {
  const delivery = { id: 'delivery', orderId: 'order', outletId: 'branch', status: 'offer_sent', revision: 3, autoDispatchPaused: false, preparationStatus: 'ready' };
  const render = (patch = {}, permissions = ['commerce.delivery.manage']) => fixture({ permissions, responses: { '/deliveries/delivery': { delivery: { ...delivery, ...patch } }, '/couriers': { items: [] } } }).render('DeliveryManagement', { id: 'delivery' }, 'DeliveryDetails');
  assert.match(render(), /Take manual control \/ withdraw offer/);
  assert.match(render({ autoDispatchPaused: true, status: 'awaiting_rider' }), /Resume automatic dispatch/);
  assert.doesNotMatch(render({}, []), /Take manual control|Resume automatic/);
  assert.doesNotMatch(render({ status: 'picked_up' }), /Take manual control|Resume automatic/);
  const manual = render({ status: 'awaiting_manual_assignment', autoDispatchPaused: true });
  assert.match(manual, /Manual assignment required/); assert.match(manual, /Offer delivery to rider/); assert.match(manual, /Resume automatic dispatch/);
});

test('operational alerts display persisted manual assignment and retry notices with order links', () => {
  const html = fixture({ responses: { '/delivery-notifications': { items: [{ id: 'notice', kind: 'awaiting_manual_assignment', orderId: 'order', reason: 'No eligible rider' }, { id: 'retry', kind: 'auto_dispatch_retry', orderId: 'order2', reason: 'Retry scheduled' }] } } }).render('DeliveryManagement', {}, 'DispatchAlerts');
  assert.match(html, /role="alert"/); assert.match(html, /No eligible rider/); assert.match(html, /Retry scheduled/); assert.match(html, /\/app\/commerce\/orders\/order/);
});

test('batch screens show zone gates, courier capacity, bulk review and respect manager permissions', () => {
  const responses = { '/delivery-zones': { enabled: true, items: [{ id: 'zone', name: 'Hazratganj', outletId: 'outlet', radiusMetres: 4000, active: true, autoAssign: false, priority: 1 }] }, '/couriers': { items: [{ id: 'rider', name: 'Rider', batchLoad: 7, batchCapacity: 10 }] }, '/deliveries': { items: [] } };
  const manager = fixture({ responses, permissions: ['commerce.delivery.manage'] });
  const zones = manager.render('BatchingManagement', { section: 'delivery-zones' }); assert.match(zones, /Hazratganj/); assert.match(zones, /4 km/); assert.match(zones, /Add zone/);
  assert.doesNotMatch(fixture({ responses }).render('BatchingManagement', { section: 'delivery-zones' }), /Add zone|Edit zone/);
  const batching = manager.render('BatchingManagement', { section: 'batch-dispatch' }); assert.match(batching, /7\/10 slots/); assert.match(batching, /Review assignment/); assert.match(batching, /Rider acceptance is required/);
  assert.match(fixture({ responses: { '/delivery-zones': { enabled: false, items: [] } } }).render('BatchingManagement', { section: 'batch-dispatch' }), /not enabled/);
});

test('zone map exposes location search and destination radius controls without a third-party drawing library', () => {
  const html = fixture().render('ZoneMap', { value: { latitude: 26, longitude: 80, radiusMetres: 4000 }, onChange() {} });
  assert.match(html, /Search delivery zone location/); assert.match(html, /Delivery zone radius map/); assert.match(html, /customer destinations/);
});

test('recommendations show attributed road estimates, missing-route state and a separate selection action', () => {
  const props = { result: { mode: 'suggested', generatedAt: '2026-09-17T12:00:00Z', warning: '', suggestedCourierId: 'rider', candidates: [{ courierId: 'rider', name: '<unsafe>', vehicle: 'car', pickupEtaSeconds: 60, pickupRoadMetres: 1000, customerDirectEtaSeconds: null, deliveryEtaSeconds: 600, gpsAt: '2026-09-17T12:00:00Z', accuracyMetres: 10 }] }, disabled: true, onSelect() {} };
  const html = fixture().render('RoutingAssistance', props, 'RecommendationResults');
  assert.match(html, /Google Maps/); assert.match(html, /Suggested Rider/); assert.match(html, /Customer direct: Unavailable/); assert.match(html, /does not assign/); assert.match(html, /disabled=""/); assert.match(html, /&lt;unsafe&gt;/);
});

test('delivery navigation requires both the delivery flag and workspace permission', () => {
  const props = {}, render = (options) => fixture(options).render('CommercePage', props, 'CommerceDashboard');
  assert.doesNotMatch(render({ permissions: ['commerce.delivery.view'] }), /Live Dispatch|Courier Partners/);
  assert.doesNotMatch(render({ capabilities: { delivery: true } }), /Live Dispatch|Courier Partners/);
  const html = render({ capabilities: { delivery: true }, permissions: ['commerce.delivery.view'] });
  for (const name of ['Live Dispatch', 'Courier Partners', 'Dispatch Settings', 'Reports &amp; Activity', 'Restaurants &amp; Branches']) assert.ok(html.includes(name));
});

test('rider login returns to its app while ordinary merchant and staff login routes stay unchanged', () => {
  const destination = fixture().component('../../shared/utils/authNavigation.ts', 'loginDestination');
  assert.equal(destination('user', null, '/rider'), '/rider');
  assert.equal(destination('user', null, '/app/commerce'), '/workspaces');
  assert.equal(destination('user', null, 'https://untrusted.example'), '/workspaces');
  assert.equal(destination('admin'), '/admin'); assert.equal(destination('super_admin'), '/super-admin');
});

test('branch and rider controls require management permissions and show current workload', () => {
  const responses = { '/outlets': { items: [{ id: 'branch', name: 'Cafe', address: 'Main road', active: true, prepMinutes: 15, radiusMetres: 2000 }] },
    '/couriers': { items: [{ id: 'rider', name: 'Rider', phone: '919999999999', active: true, online: true, currentDeliveryId: 'delivery', vehicle: 'bicycle' }] } };
  assert.doesNotMatch(fixture({ responses }).render('DeliveryManagement', { section: 'outlets' }), /Add branch|Edit branch|Manage stock/);
  const manager = fixture({ responses, permissions: ['commerce.delivery.manage', 'commerce.products.manage'] });
  assert.match(manager.render('DeliveryManagement', { section: 'outlets' }), /Add branch/);
  const riders = manager.render('DeliveryManagement', { section: 'couriers' }); assert.match(riders, /Online/); assert.match(riders, /Busy/); assert.match(riders, /disabled=""[^>]*>Edit rider/);
});

test('dispatch shows real branch, destination and separate payment/preparation state', () => {
  const html = fixture({ responses: { '/deliveries': { items: [{ id: 'delivery', orderId: 'order', orderNumber: 'AWC-101', status: 'awaiting_rider', paymentStatus: 'captured', preparationStatus: 'preparing', pickup: { name: 'Cafe Central' }, destination: { city: 'Lucknow' } }] } } }).render('DeliveryManagement', { section: 'dispatch' });
  for (const text of ['AWC-101', 'Cafe Central', 'Lucknow', 'captured', 'preparing', 'awaiting rider', 'Dispatch follows your merchant settings']) assert.ok(html.includes(text));
  assert.doesNotMatch(html, /force.assign|Auto Dispatch/);
});

test('location picker requires an explicit unchecked confirmation for a new GPS selection', () => {
  const html = fixture().render('LocationPicker', { value: { latitude: 26, longitude: 80, source: 'gps', accuracy: 20, confirmed: false }, onChange() {} });
  assert.match(html, /Use current location/); assert.match(html, /Choose on map/); assert.match(html, /I confirm this is the delivery destination/);
  assert.match(html, /26\.000000, 80\.000000/); assert.doesNotMatch(html, /checked=""/);
});

test('manual delivery orders cannot use the legacy fulfillment action to bypass the PIN lifecycle', () => {
  const order = { id: 'order', manualDeliveryId: 'delivery', environment: 'test', status: 'confirmed', paymentStatus: 'captured', items: [], totalPaise: 100, fulfillmentMethod: 'delivery', revision: 1 };
  const html = fixture({ permissions: ['commerce.orders.manage'], responses: { '/orders/order': { order } } }).render('OrdersPage', { id: 'order' });
  assert.doesNotMatch(html, /Mark processing|Mark completed/);
});
test('attachment menu opens catalog and preserves all media callbacks; disabled menu has no actions', () => {
  const f = fixture(), Menu = f.component('../conversations/components/AttachmentMenu', 'AttachmentMenu'), picked = [];
  let catalogs = 0;
  const props = { panelRef: { current: null }, onPick: (kind) => picked.push(kind), onCatalog: () => catalogs++ };
  const buttons = React.Children.toArray(Menu(props).props.children);
  buttons.forEach((button) => button.props.onClick());
  assert.equal(catalogs, 1); assert.deepEqual(picked, ['image', 'video', 'audio', 'document']);
  assert.equal(Menu({ ...props, disabled: true }), null);
  assert.match(f.render('../conversations/components/AttachmentMenu', props, 'AttachmentMenu'), /Catalog/);
  assert.doesNotMatch(f.render('../conversations/components/AttachmentMenu', { ...props, onCatalog: undefined }, 'AttachmentMenu'), /Catalog/);
});

test('hosted payment send control requires a link and all send permissions; native requests cannot be resent', () => {
  const permissions = ['commerce.messages.send', 'inbox.reply', 'commerce.payments.view'];
  const attempt = { id: 'attempt', mode: 'razorpay_payment_link', status: 'pending', paymentUrl: 'https://rzp.io/test' };
  const props = { attempt, to: '919999999999', onSent() {} };
  assert.match(fixture({ permissions }).render('PaymentRequestButton', props), /Send payment request on WhatsApp/);
  for (const permission of permissions) assert.doesNotMatch(fixture({ permissions: permissions.filter((p) => p !== permission) }).render('PaymentRequestButton', props), /<button/);
  assert.doesNotMatch(fixture({ permissions }).render('PaymentRequestButton', { ...props, attempt: { ...attempt, paymentUrl: null } }), /<button/);
  const native = fixture({ permissions }).render('PaymentRequestButton', { ...props, attempt: { ...attempt, mode: 'whatsapp_native', status: 'requires_attention' } });
  assert.match(native, /requires attention/); assert.doesNotMatch(native, /<button/);
});

test('catalog picker renders inside its caller and blocks sending without permissions or an open window', () => {
  const permissions = ['commerce.messages.send', 'inbox.reply', 'commerce.products.view'];
  const props = { to: '919999999999', onSent() {} };
  assert.match(fixture({ permissions }).render('InboxCommerce', props), /Send catalog/);
  assert.match(fixture({ permissions }).render('InboxCommerce', { ...props, disabled: true }), /disabled=""[^>]*>Send catalog/);
  assert.doesNotMatch(fixture({ permissions: ['inbox.reply'] }).render('InboxCommerce', props), /Send catalog/);
  assert.doesNotMatch(fixture({ permissions, capabilities: { catalog: false } }).render('InboxCommerce', props), /Send catalog/);
});
test('products render authoritative money, available stock and escaped names; viewer has no mutations', () => {
  const f = fixture({ responses: { '/products': { products: [product], nextCursor: null } } }), html = f.render('ProductsPage');
  assert.match(html, /12\.34/); assert.match(html, /3 available \/ 2 reserved/); assert.match(html, /&lt;script&gt;/); assert.doesNotMatch(html, /<script>|Add product|>Edit<|>Archive</);
});
test('product manager sees controls and disabled catalog does not query products', () => {
  const f = fixture({ permissions: ['commerce.products.manage'], responses: { '/products': { products: [product] } } });
  assert.match(f.render('ProductsPage'), /Add product/);
  const disabled = fixture({ capabilities: { catalog: false } }); assert.match(disabled.render('ProductsPage'), /Catalog is not enabled/); assert.equal(disabled.requested.length, 0);
});
test('loading, empty and backend error states have visible feedback', () => {
  assert.match(fixture({ loading: true }).render('ProductsPage'), /role="status"/);
  assert.match(fixture({ responses: { '/products': { products: [] } } }).render('ProductsPage'), /No records to show/);
  assert.match(fixture({ failure: 'Catalog connection changed' }).render('ProductsPage'), /role="alert"/);
});
test('unpaid reviewed orders expose checkout only with payment and order management permissions', () => {
  const order = { id: 'order', orderNumber: 'A-1', environment: 'test', status: 'needs_review', paymentStatus: 'unpaid', customerPhone: '919999999999', items: [], totalPaise: 1234, deliveryPaise: 0, includedTaxPaise: null, fulfillmentMethod: 'pickup', reviewedAt: '2026-09-10', revision: 2 };
  const responses = { '/orders/order': { order }, '/orders/order/quote': { quote: { items: [], warnings: [], blockers: [], totalPaise: 1234 } }, '/orders/order/payment-requests': { items: [] }, '/orders/order/notifications': { items: [] } };
  const viewer = fixture({ permissions: ['commerce.orders.view'], responses });
  const html = viewer.render('OrdersPage', { id: 'order' }); assert.doesNotMatch(html, /Create payment request|Mark processing|Edit details/); assert.match(html, /Included tax: Not specified/);
  const manager = fixture({ permissions: ['commerce.orders.manage', 'commerce.payments.view', 'commerce.payments.manage'], responses });
  assert.match(manager.render('OrdersPage', { id: 'order' }), /Create payment request/);
});
test('captured orders show fulfillment progress and hide editable checkout controls', () => {
  const order = { id: 'order', orderNumber: 'A-1', status: 'confirmed', paymentStatus: 'captured', environment: 'test', items: [], totalPaise: 1234, deliveryPaise: 0, fulfillmentMethod: 'pickup', revision: 3 };
  const html = fixture({ permissions: ['commerce.orders.manage'], responses: { '/orders/order': { order } } }).render('OrdersPage', { id: 'order' });
  assert.match(html, /Mark processing/); assert.doesNotMatch(html, /Edit details|Create payment request|Approve review/);
});
test('settings support manual keys and OAuth while gateway permission prevents credential forms', () => {
  const viewer = fixture({ permissions: ['commerce.catalog.view'] }); assert.doesNotMatch(viewer.render('SettingsPage'), /Razorpay key secret|Connect with Razorpay OAuth/);
  const owner = fixture({ permissions: ['commerce.gateway.manage'], responses: { '/gateways': { gateways: [] } } });
  const html = owner.render('SettingsPage'); assert.match(html, /Connect manual keys/); assert.match(html, /Connect with Razorpay OAuth/); assert.match(html, /type="password"/); assert.match(html, /Native WhatsApp payments require a verified live configuration/);
});

test('manual gateway setup explains live hosted payments without mandatory OAuth identity', () => {
  const gateway = { id: 'gateway', environment: 'live', authType: 'api_keys', status: 'connected', active: true, revision: 1, identityVerified: false, webhookStatus: 'needs_setup' };
  const html = fixture({ environment: 'live', permissions: ['commerce.gateway.manage'], responses: { '/gateways': { gateways: [gateway] } } }).render('SettingsPage');
  assert.match(html, /Partner OAuth is not required for hosted payments/);
  assert.match(html, /Optional account identity proof for native WhatsApp payments/);
  assert.match(html, /Generate webhook secret/);
  assert.doesNotMatch(html, /Verify merchant identity for live payments/);
});
test('checkout settings explain required initialization and expose a refresh after revision conflicts', () => {
  const html = fixture({ permissions: ['commerce.payments.view', 'commerce.payments.manage'], responses: { '/payments/settings': { settings: { revision: 0, liveCheckoutEnabled: false, reservationMinutes: 30, checkoutEnabled: true, liveEnabled: false } } } }).render('SettingsPage');
  assert.match(html, /Save order settings first/); assert.match(html, /Refresh settings/); assert.match(html, /<fieldset disabled=""/);
});
test('native checkout option requires a live order, platform gate and both send permissions', () => {
  const order = { id: 'order', orderNumber: 'A-1', environment: 'live', status: 'needs_review', paymentStatus: 'unpaid', items: [], totalPaise: 1234, deliveryPaise: 0, fulfillmentMethod: 'pickup', reviewedAt: '2026-09-15', revision: 2 };
  const permissions = ['commerce.orders.manage', 'commerce.payments.view', 'commerce.payments.manage', 'commerce.messages.send', 'inbox.reply'];
  const responses = { '/orders/order': { order }, '/orders/order/payment-requests': { items: [] }, '/orders/order/notifications': { items: [] } };
  const render = (overrides = {}) => fixture({ permissions, responses, capabilities: { native: true }, ...overrides }).render('OrdersPage', { id: 'order' });
  assert.match(render(), /Native WhatsApp Review and Pay/);
  assert.doesNotMatch(render({ capabilities: { native: false } }), /Native WhatsApp Review and Pay/);
  assert.doesNotMatch(render({ permissions: permissions.filter((key) => key !== 'inbox.reply') }), /Native WhatsApp Review and Pay/);
  assert.doesNotMatch(render({ responses: { ...responses, '/orders/order': { order: { ...order, environment: 'test' } } } }), /Native WhatsApp Review and Pay/);
});
test('native settings expose separate Meta linkage and require verified merchant identity', () => {
  const gateway = { id: 'gateway', environment: 'live', authType: 'api_keys', status: 'connected', active: true, revision: 1, identityVerified: false, nativePaymentStatus: 'unverified', webhookStatus: 'verified' };
  const html = fixture({ environment: 'live', permissions: ['commerce.gateway.manage'], responses: { '/gateways': { gateways: [gateway] } } }).render('SettingsPage');
  assert.match(html, /Meta payment configuration name/); assert.match(html, /separate authorization/);
  assert.match(html, /Verify the merchant identity first/); assert.match(html, /disabled=""[^>]*>Verify native configuration/);
  assert.doesNotMatch(html, /Native checkout is available/);
});
test('inbox cart uses quantities and SKUs without claiming payment; outbound payment links open the matching order', () => {
  const f = fixture(), render = (message) => f.render('../conversations/components/MessageContent', { message, mediaErrors: {}, mediaLoading: {}, mediaUrls: {}, ensureMediaUrl() {}, setSelectedImage() {} }, 'MessageContent');
  const cart = render({ direction: 'inbound', payload: { type: 'order', order: { product_items: [{ product_retailer_id: '<unsafe>', quantity: '2' }], text: 'Please deliver' } } });
  assert.match(cart, /Customer cart/); assert.match(cart, /2.*&lt;unsafe&gt;/); assert.doesNotMatch(cart, /captured|Payment received/);
  const payment = render({ direction: 'outbound', text: 'Total INR 12.34', payload: { commerce: { kind: 'payment_request', orderId: '100000000000000000000001', orderNumber: 'A-1' } } });
  assert.match(payment, /Payment request/); assert.match(payment, /\/app\/commerce\/orders\/100000000000000000000001/);
  const status = render({ direction: 'outbound', text: 'Order is shipped.', payload: { commerce: { kind: 'order_status', orderId: '100000000000000000000001', orderNumber: 'A-1' } } });
  assert.match(status, /Order update/); assert.match(status, /Order is shipped/); assert.match(status, /\/app\/commerce\/orders\/100000000000000000000001/);
  assert.doesNotMatch(status, /Payment request/);
});
