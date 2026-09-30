<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/src/ShipmentStatus.php';

$now = new DateTimeImmutable('2026-09-30 10:00:00+07:00');
$cases = [
    ['future', ['delivery_status' => 'in_transit', 'risk_status' => 'on_track', 'estimated_delivery_at' => '2026-09-30T15:00:00+07:00'], 'on_time'],
    ['soon', ['delivery_status' => 'in_transit', 'risk_status' => 'on_track', 'estimated_delivery_at' => '2026-09-30T11:00:00+07:00'], 'approaching'],
    ['late', ['delivery_status' => 'in_transit', 'risk_status' => 'on_track', 'estimated_delivery_at' => '2026-09-30T09:00:00+07:00'], 'delayed'],
    ['risk', ['delivery_status' => 'in_transit', 'risk_status' => 'at_risk', 'estimated_delivery_at' => '2026-09-30T15:00:00+07:00'], 'at_risk'],
    ['action', ['delivery_status' => 'in_transit', 'risk_status' => 'action_required', 'exception_code' => 'ALAMAT'], 'action_required'],
    ['resolved', ['delivery_status' => 'failed_delivery', 'risk_status' => 'resolved', 'estimated_delivery_at' => '2026-09-29T09:00:00+07:00'], 'resolved'],
    ['delivered', ['delivery_status' => 'delivered'], 'delivered'],
    ['missing eta', ['delivery_status' => 'in_transit'], 'unknown'],
    ['invalid eta', ['delivery_status' => 'in_transit', 'estimated_delivery_at' => 'not-a-date'], 'unknown'],
];

foreach ($cases as [$name, $shipment, $expected]) {
    $actual = ShipmentStatus::describe($shipment, $now);
    if ($actual['code'] !== $expected || $actual['label'] === '' || $actual['message'] === '') {
        throw new RuntimeException("Status case {$name} failed.");
    }
}

if (!str_contains(ShipmentStatus::issueMessage(['exception_code' => 'ALAMAT']), 'Alamat')) {
    throw new RuntimeException('Address issue translation failed.');
}
echo 'ShipmentStatus: ' . count($cases) . ' cases passed.' . PHP_EOL;
