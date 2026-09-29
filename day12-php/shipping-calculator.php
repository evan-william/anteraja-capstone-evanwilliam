<?php

declare(strict_types=1);

// Tarif latihan untuk demo lokal; bukan tarif resmi Anteraja.
$tiers = [
    ['code' => 'light', 'label' => 'Hingga 1 kg', 'max_kg' => 1.0, 'base_price' => 10000.0],
    ['code' => 'medium', 'label' => 'Di atas 1–3 kg', 'max_kg' => 3.0, 'base_price' => 17000.0],
    ['code' => 'heavy', 'label' => 'Di atas 3–5 kg', 'max_kg' => 5.0, 'base_price' => 25000.0],
];

$extraWeightPricePerKg = 5000.0;
$includedDistanceKm = 10.0;
$extraDistancePricePerKm = 1250.0;

$sampleShipments = [
    ['name' => 'Dokumen kantor', 'weight_kg' => 0.5, 'distance_km' => 4.0],
    ['name' => 'Buku dan alat tulis', 'weight_kg' => 1.0, 'distance_km' => 10.0],
    ['name' => 'Paket pakaian', 'weight_kg' => 2.4, 'distance_km' => 12.2],
    ['name' => 'Peralatan dapur', 'weight_kg' => 4.8, 'distance_km' => 18.0],
    ['name' => 'Paket perlengkapan toko', 'weight_kg' => 6.2, 'distance_km' => 25.5],
];

/** Hitung berapa kali fungsi tarif dipakai selama satu request PHP. */
function calculationCount(bool $increment = false): int
{
    static $count = 0;
    if ($increment) {
        $count++;
    }
    return $count;
}

/** Pilih tier berat, lalu tambahkan biaya berat/jarak yang melewati batas. */
function calculateTierPrice(float $weight, float $distanceKm): float
{
    global $tiers, $extraWeightPricePerKg, $includedDistanceKm, $extraDistancePricePerKm;

    if (!is_finite($weight) || !is_finite($distanceKm) || $weight <= 0 || $distanceKm < 0) {
        throw new InvalidArgumentException('Berat harus lebih dari 0 kg dan jarak tidak boleh negatif.');
    }

    if ($weight <= $tiers[0]['max_kg']) {
        $tierCode = 'light';
    } elseif ($weight <= $tiers[1]['max_kg']) {
        $tierCode = 'medium';
    } else {
        $tierCode = 'heavy';
    }

    $basePrice = 0.0;
    foreach ($tiers as $tier) {
        if ($tier['code'] === $tierCode) {
            $basePrice = $tier['base_price'];
            break;
        }
    }

    $extraWeightKg = max(0.0, ceil($weight - $tiers[2]['max_kg']));
    $extraDistanceKm = max(0.0, ceil($distanceKm - $includedDistanceKm));
    calculationCount(true);

    return $basePrice
        + $extraWeightKg * $extraWeightPricePerKg
        + $extraDistanceKm * $extraDistancePricePerKm;
}

function formatCurrency(float $amount): string
{
    return 'Rp' . number_format($amount, 0, ',', '.');
}

/** Memakai kedua fungsi di atas untuk membentuk satu baris keluaran. */
function describeShipment(array $shipment): string
{
    $price = calculateTierPrice((float) $shipment['weight_kg'], (float) $shipment['distance_km']);
    return $shipment['name'] . ' — ' . $shipment['weight_kg'] . ' kg / '
        . $shipment['distance_km'] . ' km: ' . formatCurrency($price);
}

/** Base case: tidak ada shipment tersisa; selain itu hitung satu dan lanjutkan. */
function sumShipmentCosts(array $shipments, int $index = 0): float
{
    if ($index >= count($shipments)) {
        return 0.0;
    }

    $shipment = $shipments[$index];
    if (!isset($shipment['weight_kg'], $shipment['distance_km'])) {
        throw new InvalidArgumentException('Data shipment harus memiliki weight_kg dan distance_km.');
    }

    return calculateTierPrice((float) $shipment['weight_kg'], (float) $shipment['distance_km'])
        + sumShipmentCosts($shipments, $index + 1);
}

// Perintah `php shipping-calculator.php` menampilkan lima contoh dan totalnya.
if (PHP_SAPI === 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    echo "KALKULATOR TARIF PENGIRIMAN (SIMULASI)\n";
    echo str_repeat('─', 48) . "\n";
    foreach ($sampleShipments as $number => $shipment) {
        echo ($number + 1) . '. ' . describeShipment($shipment) . "\n";
    }
    echo str_repeat('─', 48) . "\n";
    echo 'Total 5 kiriman: ' . formatCurrency(sumShipmentCosts($sampleShipments)) . "\n";
    echo 'Fungsi tarif dipanggil: ' . calculationCount() . " kali\n";
}
