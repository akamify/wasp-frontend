import type { Campaign } from "./types";

export const broadcastCampaigns: Campaign[] = [
  { id: "b1", name: "Flash Sale Broadcast", template: "Promo + Coupon", audienceLabel: "Segment: High intent", deliveredLabel: "44,980 / 45,000", statusLabel: "Sending", statusTone: "info", updatedLabel: "Updated: 2m ago" },
  { id: "b2", name: "Store Pickup Reminder", template: "Order Update", audienceLabel: "1,240 buyers", deliveredLabel: "1,240 / 1,240", statusLabel: "Delivered", statusTone: "success", updatedLabel: "Updated: 18m ago" },
  { id: "b3", name: "Winback 7-Day", template: "Offer + CTA", audienceLabel: "3 segments", deliveredLabel: "8,680 / 9,120", statusLabel: "Scheduled", statusTone: "warning", updatedLabel: "Updated: in 35m" },
];

export const csvCampaigns: Campaign[] = [
  { id: "c1", name: "Festive List Upload", template: "New Launch", audienceLabel: "CSV: 12,400 rows", deliveredLabel: "12,084 / 12,400", statusLabel: "Running", statusTone: "info", updatedLabel: "Updated: 6m ago" },
  { id: "c2", name: "Renewal Reminder", template: "Subscription", audienceLabel: "CSV: 3,100 rows", deliveredLabel: "3,100 / 3,100", statusLabel: "Completed", statusTone: "success", updatedLabel: "Updated: 42m ago" },
  { id: "c3", name: "Event RSVP", template: "Invite + QR", audienceLabel: "CSV: 980 rows", deliveredLabel: "870 / 980", statusLabel: "Paused", statusTone: "warning", updatedLabel: "Updated: 1h ago" },
];

export function fallbackApiCampaigns(): Campaign[] {
  return [
    { id: "a1", name: "Abandoned Cart (API)", template: "Cart Recovery", audienceLabel: "Dynamic: event stream", deliveredLabel: "Auto-scaling", statusLabel: "Live", statusTone: "info", updatedLabel: "Updated: just now" },
    { id: "a2", name: "Post-Purchase Upsell", template: "Product Recommendation", audienceLabel: "Dynamic: customers", deliveredLabel: "Rules-based", statusLabel: "Delivered", statusTone: "success", updatedLabel: "Updated: 9m ago" },
    { id: "a3", name: "Lead Qualification Bot", template: "Questions + Tags", audienceLabel: "Dynamic: inbound", deliveredLabel: "24/7 routing", statusLabel: "Running", statusTone: "info", updatedLabel: "Updated: 1m ago" },
  ];
}
