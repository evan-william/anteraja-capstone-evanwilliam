<?php
namespace Database\Seeders;
use App\Models\Courier;
use App\Models\Shipment;
use Illuminate\Database\Seeder;
class ShipmentSeeder extends Seeder {
    public function run(): void {
        foreach ([['Dimas Pratama',4.8],['Ayu Lestari',4.9],['Rizky Saputra',4.7]] as [$name,$rating]) Courier::firstOrCreate(['name'=>$name],['rating'=>$rating]);
        $couriers = Courier::orderBy('id')->get();
        foreach (range(1,12) as $number) Shipment::firstOrCreate(['tracking_number'=>'ANT-DEMO-'.str_pad((string)$number,4,'0',STR_PAD_LEFT)], [
            'weight_kg'=>0.5+($number%6),'status'=>array_keys(Shipment::STATUSES)[$number%3],
            'courier_id'=>$couriers[($number-1)%$couriers->count()]->id,
        ]);
    }
}
