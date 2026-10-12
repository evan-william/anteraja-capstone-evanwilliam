<?php
declare(strict_types=1);

// satu objek mewakili satu kiriman; tarif sama dengan latihan sebelumnya.
final class ShipmentRequest
{
    public function __construct(public string $trackingNumber, public float $weightKg, public float $distanceKm)
    {
        if (trim($trackingNumber) === '' || !is_finite($weightKg) || !is_finite($distanceKm) || $weightKg <= 0 || $distanceKm <= 0) {
            throw new InvalidArgumentException('Resi wajib diisi; berat dan jarak harus positif.');
        }
    }

    public function calculateCost(): float
    {
        $tiers = [['max'=>1,'price'=>10000], ['max'=>3,'price'=>17000], ['max'=>5,'price'=>25000]];
        if ($this->weightKg <= $tiers[0]['max']) $price = $tiers[0]['price'];
        elseif ($this->weightKg <= $tiers[1]['max']) $price = $tiers[1]['price'];
        else $price = $tiers[2]['price'];
        return $price + max(0, ceil($this->weightKg - 5)) * 5000 + max(0, ceil($this->distanceKm - 10)) * 1250;
    }

    public function toArray(): array
    {
        return ['tracking_number'=>$this->trackingNumber, 'weight_kg'=>$this->weightKg,
            'distance_km'=>$this->distanceKm, 'cost'=>$this->calculateCost()];
    }
}

function validateShipment(array $input): array
{
    $errors = [];
    $tracking = $input['tracking_number'] ?? '';
    if (!is_string($tracking) || trim($tracking) === '') $errors[] = 'Nomor resi wajib diisi.';
    elseif (strlen(trim($tracking)) > 80) $errors[] = 'Nomor resi maksimal 80 karakter.';
    foreach (['weight_kg'=>'Berat', 'distance_km'=>'Jarak'] as $field=>$label) {
        $value = $input[$field] ?? null;
        if (!is_scalar($value) || !is_numeric($value) || !is_finite((float)$value) || (float)$value <= 0) $errors[] = "$label harus angka lebih dari nol.";
        elseif ((float)$value > 1000000) $errors[] = "$label maksimal 1.000.000 untuk simulasi ini.";
    }
    return $errors;
}
