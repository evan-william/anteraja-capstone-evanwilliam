<?php
namespace Tests\Feature;
use App\Models\Courier;
use App\Models\Shipment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class ShipmentCrudTest extends TestCase {
    use RefreshDatabase;
    private function payload(): array {
        $courier = Courier::create(['name'=>'Kurir uji','rating'=>4.8]);
        return ['tracking_number'=>'ANT-TEST-001','weight_kg'=>2.5,'status'=>'pending','courier_id'=>$courier->id];
    }
    public function test_complete_crud(): void {
        $data = $this->payload();
        $this->get('/shipments')->assertOk()->assertSee('Belum ada kiriman');
        $this->get('/shipments/create')->assertOk();
        $this->post('/shipments',$data)->assertRedirect(); $shipment = Shipment::firstOrFail();
        $this->get('/shipments')->assertOk()->assertSee('Kurir uji')->assertSee('ANT-TEST-001');
        $this->get('/shipments/'.$shipment->id)->assertOk()->assertSee('2.500');
        $this->get('/shipments/'.$shipment->id.'/edit')->assertOk();
        $this->put('/shipments/'.$shipment->id,[...$data,'status'=>'delivered'])->assertRedirect();
        $this->assertDatabaseHas('shipments',['id'=>$shipment->id,'status'=>'delivered']);
        $this->delete('/shipments/'.$shipment->id)->assertRedirect('/shipments');
        $this->assertDatabaseMissing('shipments',['id'=>$shipment->id]);
    }
    public function test_validation(): void {
        $data = $this->payload(); Shipment::create($data);
        $this->post('/shipments',$data)->assertSessionHasErrors('tracking_number');
        $this->post('/shipments',[...$data,'tracking_number'=>'NEW','weight_kg'=>-1,'courier_id'=>999,'status'=>'fake'])->assertSessionHasErrors(['weight_kg','courier_id','status']);
        $this->post('/shipments',[])->assertSessionHasErrors(['tracking_number','weight_kg','status','courier_id']);
    }
    public function test_missing_records(): void { $this->get('/shipments/999')->assertNotFound(); $this->get('/shipments/999/edit')->assertNotFound(); }
    public function test_repeatable_seed_and_relation(): void {
        $this->seed(); $this->seed(); $this->assertDatabaseCount('couriers',3); $this->assertDatabaseCount('shipments',12);
        $this->assertNotNull(Shipment::firstOrFail()->courier);
    }
    public function test_escaped_content(): void {
        $data = $this->payload(); Shipment::create([...$data,'tracking_number'=>'<script>alert(1)</script>']);
        $this->get('/shipments')->assertDontSee('<script>alert(1)</script>',false)->assertSee('&lt;script&gt;',false);
    }
}
