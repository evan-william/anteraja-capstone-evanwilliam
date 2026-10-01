<?php
declare(strict_types=1);
require __DIR__.'/common.php';
$requests = $_SESSION['shipment_requests'] ?? [];
$total = array_sum(array_column($requests, 'cost'));
pageStart('Riwayat permintaan');
echo '<p class="eyebrow">Sesi pengiriman</p><h1>Riwayat permintaan.</h1>';
if (isset($_SESSION['notice'])) { echo '<p class="notice" role="status">'.e($_SESSION['notice']).'</p>'; unset($_SESSION['notice']); }
echo '<section class="panel"><div class="summary"><h2>'.count($requests).' permintaan</h2><strong>Total '.rupiah((float)$total).'</strong></div>';
if ($requests === []) echo '<p>Belum ada permintaan pada sesi ini.</p><a class="button" href="shipment-form.html">Buat permintaan pertama</a>';
else {
    echo '<div class="table-wrap"><table><caption>Permintaan pada sesi browser ini</caption><thead><tr><th>Nomor resi</th><th>Berat</th><th>Jarak</th><th>Biaya</th></tr></thead><tbody>';
    foreach ($requests as $row) echo '<tr><td>'.e($row['tracking_number']).'</td><td>'.e($row['weight_kg']).' kg</td><td>'.e($row['distance_km']).' km</td><td>'.rupiah((float)$row['cost']).'</td></tr>';
    echo '</tbody></table></div><p><a href="clear-history.php">Clear History — kosongkan riwayat</a></p>';
}
echo '</section><p>Reload tidak menghapus riwayat. Browser/sesi lain mempunyai riwayat tersendiri.</p>'; pageEnd();
