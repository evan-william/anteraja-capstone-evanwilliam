<?php
declare(strict_types=1);
require __DIR__.'/common.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST'); http_response_code(405); pageStart('Metode tidak didukung');
    echo '<h1>Gunakan form pengiriman.</h1><a href="shipment-form.html">Kembali</a>'; pageEnd(); exit;
}
// form html statis: tolak origin lain dan request lintas situs.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (($origin !== '' && parse_url($origin, PHP_URL_HOST) !== parse_url('http://'.($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST)) || ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') {
    http_response_code(403); pageStart('Akses ditolak'); echo '<h1>Asal permintaan tidak diizinkan.</h1>'; pageEnd(); exit;
}
$errors = validateShipment($_POST);
if ($errors !== []) {
    http_response_code(422); pageStart('Periksa data'); echo '<h1>Periksa data kiriman.</h1><section class="panel" role="alert"><ul>';
    foreach ($errors as $error) echo '<li>'.e($error).'</li>';
    echo '</ul><a href="shipment-form.html">Kembali dan perbaiki data</a></section>'; pageEnd(); exit;
}
$shipment = new ShipmentRequest(trim($_POST['tracking_number']), (float)$_POST['weight_kg'], (float)$_POST['distance_km']);
$_SESSION['shipment_requests'][] = $shipment->toArray();
$_SESSION['notice'] = 'Permintaan '.$shipment->trackingNumber.' berhasil disimpan.';
header('Location: request-history.php', true, 303); exit;
