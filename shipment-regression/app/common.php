<?php
declare(strict_types=1);
require_once __DIR__.'/ShipmentRequest.php';
ini_set('session.use_strict_mode', '1');
$sessionDirectory = dirname(__DIR__).'/.private-sessions';
if (!is_dir($sessionDirectory)) mkdir($sessionDirectory, 0700, true);
session_save_path($sessionDirectory);
session_set_cookie_params(['httponly'=>true,'samesite'=>'Lax','secure'=>isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off']);
session_start();
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));
function e(mixed $value): string { return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8'); }
function rupiah(float $value): string { return 'Rp'.number_format($value, 0, ',', '.'); }
function pageStart(string $title): void {
    echo '<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'.e($title).'</title><link rel="stylesheet" href="style.css"><body><header><a href="shipment-form.html">anteraja <small>latihan pengiriman</small></a><nav><a href="shipment-form.html">Buat permintaan</a><a href="request-history.php">Riwayat</a></nav></header><main>';
}
function pageEnd(): void { echo '</main><footer>Simulasi belajar · bukan tarif resmi Anteraja</footer></body></html>'; }
