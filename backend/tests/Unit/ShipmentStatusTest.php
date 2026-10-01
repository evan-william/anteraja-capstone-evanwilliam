<?php
namespace Tests\Unit;
use Tests\TestCase;
class ShipmentStatusTest extends TestCase
{
    public function test_all_original_timeliness_cases(): void {
        $now = new \DateTimeImmutable('2026-09-30 10:00:00+07:00');
        $cases = [
            [['delivery_status'=>'in_transit','risk_status'=>'on_track','estimated_delivery_at'=>'2026-09-30T15:00:00+07:00'],'on_time'],
            [['delivery_status'=>'in_transit','risk_status'=>'on_track','estimated_delivery_at'=>'2026-09-30T11:00:00+07:00'],'approaching'],
            [['delivery_status'=>'in_transit','risk_status'=>'on_track','estimated_delivery_at'=>'2026-09-30T09:00:00+07:00'],'delayed'],
            [['delivery_status'=>'in_transit','risk_status'=>'at_risk','estimated_delivery_at'=>'2026-09-30T15:00:00+07:00'],'at_risk'],
            [['delivery_status'=>'in_transit','risk_status'=>'action_required','exception_code'=>'ALAMAT'],'action_required'],
            [['delivery_status'=>'failed_delivery','risk_status'=>'resolved','estimated_delivery_at'=>'2026-09-29T09:00:00+07:00'],'resolved'],
            [['delivery_status'=>'delivered'],'delivered'],
            [['delivery_status'=>'in_transit'],'unknown'],
            [['delivery_status'=>'in_transit','estimated_delivery_at'=>'not-a-date'],'unknown'],
        ];
        foreach ($cases as [$shipment,$expected]) {
            $actual=\ShipmentStatus::describe($shipment,$now);
            $this->assertSame($expected,$actual['code']); $this->assertNotEmpty($actual['label']); $this->assertNotEmpty($actual['message']);
        }
        $this->assertStringContainsString('Alamat',\ShipmentStatus::issueMessage(['exception_code'=>'ALAMAT']));
    }
}
