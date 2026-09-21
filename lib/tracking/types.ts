export type RiskStatus = 'on_track' | 'at_risk' | 'action_required' | 'resolved';
export type DeliveryStatus =
  | 'created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'failed_delivery'
  | 'delivered'
  | 'returned'
  | 'cancelled';

export type TrackingEvent = {
  id: string;
  event_code: string;
  status_label: string;
  description: string;
  location: string | null;
  occurred_at: string;
};

export type PublicTracking = {
  id: string;
  tracking_number: string;
  service_type: string;
  delivery_status: DeliveryStatus;
  risk_status: RiskStatus;
  recipient_name: string | null;
  recipient_phone: string | null;
  origin_city: string | null;
  destination_city: string | null;
  destination_district: string | null;
  estimated_delivery_at: string | null;
  last_scan_at: string | null;
  exception_code: string | null;
  exception_reason: string | null;
  current_location: string | null;
  events: TrackingEvent[];
  available_actions: string[];
};

export type SellerShipment = {
  id: string;
  tracking_number: string;
  service_type: string;
  delivery_status: DeliveryStatus;
  risk_status: RiskStatus;
  recipient_name: string | null;
  destination_city: string | null;
  estimated_delivery_at: string | null;
  last_scan_at: string | null;
  exception_reason: string | null;
  current_location: string | null;
};
