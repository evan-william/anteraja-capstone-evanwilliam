import type { DeliveryStatus, RiskStatus } from './types';

const ACTION_EXCEPTIONS = new Set(['ADDRESS_INCOMPLETE', 'RECIPIENT_ABSENT']);
const ACTIVE_STATUSES = new Set<DeliveryStatus>(['picked_up', 'in_transit', 'out_for_delivery']);

export function evaluateRisk(input: {
  deliveryStatus: DeliveryStatus;
  lastScanAt: string | null;
  exceptionCode: string | null;
  currentRisk?: RiskStatus;
  now?: Date;
}): RiskStatus {
  if (input.currentRisk === 'resolved') return 'resolved';
  if (input.deliveryStatus === 'failed_delivery' || (input.exceptionCode && ACTION_EXCEPTIONS.has(input.exceptionCode))) return 'action_required';
  if (ACTIVE_STATUSES.has(input.deliveryStatus) && input.lastScanAt) {
    const elapsed = (input.now ?? new Date()).getTime() - new Date(input.lastScanAt).getTime();
    if (elapsed > 6 * 60 * 60 * 1000) return 'at_risk';
  }
  return 'on_track';
}
