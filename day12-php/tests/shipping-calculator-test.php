<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/shipping-calculator.php';

function expectSame(string $label, mixed $actual, mixed $expected): void
{
    if ($actual !== $expected) {
        fwrite(STDERR, "GAGAL: {$label}; didapat " . var_export($actual, true)
            . ', diharapkan ' . var_export($expected, true) . "\n");
        exit(1);
    }
    echo "OK: {$label}\n";
}

expectSame('tier ringan tepat 1 kg', calculateTierPrice(1.0, 10.0), 10000.0);
expectSame('tier sedang tepat 3 kg', calculateTierPrice(3.0, 10.0), 17000.0);
expectSame('tier berat tepat 5 kg', calculateTierPrice(5.0, 10.0), 25000.0);
expectSame('kelebihan berat dibulatkan ke atas', calculateTierPrice(5.1, 10.0), 30000.0);
expectSame('kelebihan jarak dibulatkan ke atas', calculateTierPrice(1.0, 10.1), 11250.0);
expectSame('format Rupiah', formatCurrency(30250.0), 'Rp30.250');
expectSame('rekursi tanpa kiriman', sumShipmentCosts([]), 0.0);
expectSame('rekursi beberapa kiriman', sumShipmentCosts([
    ['weight_kg' => 1.0, 'distance_km' => 10.0],
    ['weight_kg' => 3.0, 'distance_km' => 10.0],
]), 27000.0);

try {
    calculateTierPrice(0.0, 10.0);
    fwrite(STDERR, "GAGAL: berat nol harus ditolak\n");
    exit(1);
} catch (InvalidArgumentException $error) {
    echo "OK: berat nol ditolak\n";
}

echo "Semua 9 pengujian lulus.\n";
