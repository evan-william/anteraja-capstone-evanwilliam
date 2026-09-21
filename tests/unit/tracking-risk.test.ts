import { describe, expect, it } from 'vitest';
import { evaluateRisk } from '@/lib/tracking/risk';

const now = new Date('2026-09-21T12:00:00.000Z');

describe('evaluateRisk', () => {
  it('marks an active shipment with an idle scan over six hours as at risk', () => {
    expect(evaluateRisk({ deliveryStatus: 'in_transit', lastScanAt: '2026-09-21T05:59:59.000Z', exceptionCode: null, now })).toBe('at_risk');
  });
  it('requires action for a failed address delivery', () => {
    expect(evaluateRisk({ deliveryStatus: 'failed_delivery', lastScanAt: now.toISOString(), exceptionCode: 'ADDRESS_INCOMPLETE', now })).toBe('action_required');
  });
  it('keeps a submitted resolution stable until a new operational update', () => {
    expect(evaluateRisk({ deliveryStatus: 'failed_delivery', lastScanAt: now.toISOString(), exceptionCode: 'ADDRESS_INCOMPLETE', currentRisk: 'resolved', now })).toBe('resolved');
  });
  it('keeps a recent in-transit scan on track', () => {
    expect(evaluateRisk({ deliveryStatus: 'in_transit', lastScanAt: '2026-09-21T08:00:00.000Z', exceptionCode: null, now })).toBe('on_track');
  });
});
