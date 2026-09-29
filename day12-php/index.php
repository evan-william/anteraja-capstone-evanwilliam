<?php

declare(strict_types=1);

require_once __DIR__ . '/shipping-calculator.php';

function escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$weightRaw = $_POST['weight_kg'] ?? '';
$distanceRaw = $_POST['distance_km'] ?? '';
$weightInput = is_string($weightRaw) ? trim($weightRaw) : '';
$distanceInput = is_string($distanceRaw) ? trim($distanceRaw) : '';
$calculatedPrice = null;
$error = '';
$weightInvalid = false;
$distanceInvalid = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $weightInvalid = !is_numeric($weightInput) || !is_finite((float) $weightInput) || (float) $weightInput <= 0;
    $distanceInvalid = !is_numeric($distanceInput) || !is_finite((float) $distanceInput) || (float) $distanceInput < 0;
    if ($weightInvalid || $distanceInvalid) {
        $error = 'Masukkan berat dan jarak dalam angka yang valid.';
    } else {
        try {
            $calculatedPrice = calculateTierPrice((float) $weightInput, (float) $distanceInput);
        } catch (InvalidArgumentException $exception) {
            $error = $exception->getMessage();
        }
    }
}

$sampleRows = [];
foreach ($sampleShipments as $shipment) {
    $sampleRows[] = [
        'name' => $shipment['name'],
        'weight' => $shipment['weight_kg'],
        'distance' => $shipment['distance_km'],
        'price' => calculateTierPrice((float) $shipment['weight_kg'], (float) $shipment['distance_km']),
    ];
}
$sampleTotal = sumShipmentCosts($sampleShipments);
?>
<!doctype html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#f7f4f1">
    <title>Simulasi tarif pengiriman — Anteraja</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="site-header">
        <div class="page-width header-inner">
            <img class="brand-logo" src="assets/anteraja-wordmark.png" alt="Anteraja" width="172" height="54">
            <p class="header-caption">Kalkulator tarif · latihan PHP</p>
        </div>
    </header>

    <main class="page-width">
        <section class="intro" aria-labelledby="page-title">
            <p class="section-label">Pengiriman domestik</p>
            <h1 id="page-title">Simulasi tarif pengiriman</h1>
            <p>Masukkan berat dan jarak untuk melihat tarif berdasarkan tiga tier berat. Perhitungan dilakukan di server menggunakan PHP.</p>
        </section>

        <div class="work-area">
            <section class="calculator" aria-labelledby="calculator-title">
                <div class="section-heading">
                    <h2 id="calculator-title">Hitung satu kiriman</h2>
                    <p>Angka desimal menggunakan titik, misalnya 2.5 kg.</p>
                </div>

                <form method="post" action="#hasil" novalidate>
                    <div class="form-grid">
                        <div class="field">
                            <label for="weight_kg">Berat paket <span>(kg)</span></label>
                            <input id="weight_kg" name="weight_kg" type="number" inputmode="decimal" min="0.01" step="0.01" placeholder="Contoh: 2.5" value="<?= escape($weightInput) ?>" required aria-invalid="<?= $weightInvalid ? 'true' : 'false' ?>" aria-describedby="weight-help<?= $weightInvalid ? ' form-error' : '' ?>">
                            <p id="weight-help">Lebih dari 0 kg.</p>
                        </div>
                        <div class="field">
                            <label for="distance_km">Jarak kirim <span>(km)</span></label>
                            <input id="distance_km" name="distance_km" type="number" inputmode="decimal" min="0" step="0.01" placeholder="Contoh: 12.5" value="<?= escape($distanceInput) ?>" required aria-invalid="<?= $distanceInvalid ? 'true' : 'false' ?>" aria-describedby="distance-help<?= $distanceInvalid ? ' form-error' : '' ?>">
                            <p id="distance-help">Mulai dari 0 km.</p>
                        </div>
                    </div>
                    <button class="calculate-button" type="submit">Hitung tarif <span aria-hidden="true">→</span></button>
                </form>

                <div id="hasil" class="result-area" aria-live="polite">
                    <?php if ($error !== ''): ?>
                        <p id="form-error" class="form-error" role="alert"><?= escape($error) ?></p>
                    <?php elseif ($calculatedPrice !== null): ?>
                        <p class="result-label">Estimasi untuk kiriman ini</p>
                        <p class="result-price"><?= escape(formatCurrency($calculatedPrice)) ?></p>
                        <p class="result-note"><?= escape($weightInput) ?> kg · <?= escape($distanceInput) ?> km. Tarif simulasi, bukan penawaran resmi.</p>
                    <?php else: ?>
                        <p class="result-placeholder">Hasil perhitungan akan muncul di sini.</p>
                    <?php endif; ?>
                </div>
            </section>

            <aside class="rules" aria-labelledby="rules-title">
                <p class="section-label">Aturan tarif</p>
                <h2 id="rules-title">Dasar hitung</h2>
                <ol class="tier-list">
                    <?php foreach ($tiers as $tier): ?>
                        <li><span><?= escape($tier['label']) ?></span><strong><?= escape(formatCurrency($tier['base_price'])) ?></strong></li>
                    <?php endforeach; ?>
                </ol>
                <p>Jarak 10 km pertama sudah termasuk. Setelah itu, setiap km tambahan atau bagiannya dikenai <?= escape(formatCurrency($extraDistancePricePerKm)) ?>.</p>
                <p>Untuk berat di atas 5 kg, setiap kg tambahan atau bagiannya dikenai <?= escape(formatCurrency($extraWeightPricePerKg)) ?>.</p>
            </aside>
        </div>

        <section class="examples" aria-labelledby="examples-title">
            <div class="section-heading">
                <div>
                    <p class="section-label">Contoh perhitungan</p>
                    <h2 id="examples-title">Lima kiriman, satu total</h2>
                </div>
                <p>Data contoh dihitung dengan fungsi yang sama seperti formulir.</p>
            </div>
            <div class="table-scroll">
                <table>
                    <thead><tr><th scope="col">Kiriman</th><th scope="col">Berat</th><th scope="col">Jarak</th><th scope="col">Tarif</th></tr></thead>
                    <tbody>
                        <?php foreach ($sampleRows as $row): ?>
                            <tr>
                                <th scope="row"><?= escape($row['name']) ?></th>
                                <td><?= escape((string) $row['weight']) ?> kg</td>
                                <td><?= escape((string) $row['distance']) ?> km</td>
                                <td class="money"><?= escape(formatCurrency($row['price'])) ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                    <tfoot><tr><th scope="row" colspan="3">Total lima kiriman</th><td class="money"><?= escape(formatCurrency($sampleTotal)) ?></td></tr></tfoot>
                </table>
            </div>
        </section>
    </main>

    <footer class="site-footer">
        <div class="page-width">Contoh pembelajaran PHP · tarif tidak terhubung dengan layanan pengiriman nyata.</div>
    </footer>
</body>
</html>
