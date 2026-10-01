<?php
declare(strict_types=1);
require __DIR__.'/ShipmentRequest.php';
$checks = 0;
function check(bool $condition, string $label): void {
    global $checks;
    if (!$condition) throw new RuntimeException('FAIL: '.$label);
    $checks++; echo "PASS: $label\n";
}
foreach ([[.5,4,10000],[1,10,10000],[2.4,12.2,20750],[4.8,18,35000],[6.2,25.5,55000]] as [$weight,$distance,$expected]) {
    check((new ShipmentRequest('ANT-100015',$weight,$distance))->calculateCost() === (float)$expected, "tarif $weight kg / $distance km");
}
check(validateShipment([]) !== [], 'kolom kosong');
foreach (['0','-1','abc','1e999',['bad']] as $value) {
    check(validateShipment(['tracking_number'=>'ANT-X','weight_kg'=>$value,'distance_km'=>1]) !== [], 'berat tidak valid');
    check(validateShipment(['tracking_number'=>'ANT-X','weight_kg'=>1,'distance_km'=>$value]) !== [], 'jarak tidak valid');
}
check(validateShipment(['tracking_number'=>'ANT-X','weight_kg'=>1,'distance_km'=>1]) === [], 'data valid');
check(is_array((new ShipmentRequest('ANT-X',1,1))->toArray()), 'payload sesi array');
echo "$checks checks passed\n";
