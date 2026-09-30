<?php
declare(strict_types=1);

require_once __DIR__ . '/src/Http.php';
require_once __DIR__ . '/src/Config.php';
require_once __DIR__ . '/src/Supabase.php';
require_once __DIR__ . '/src/Auth.php';
require_once __DIR__ . '/src/Tracking.php';
require_once __DIR__ . '/src/ShipmentStatus.php';
require_once __DIR__ . '/src/Finance.php';
require_once __DIR__ . '/src/Views.php';
require_once __DIR__ . '/src/Tickets.php';
require_once __DIR__ . '/src/TicketProof.php';
require_once __DIR__ . '/src/Imports.php';
require_once __DIR__ . '/src/RoadRoute.php';
require_once __DIR__ . '/src/Assistant.php';

ini_set('display_errors', '0');
$sessionDirectory = dirname(__DIR__) . '/.private/php-sessions';
if (!is_dir($sessionDirectory) && !mkdir($sessionDirectory, 0700, true) && !is_dir($sessionDirectory)) {
    error_log('[php-api] Cannot initialize private session directory.');
    api_fail('INTERNAL_ERROR', 'Sesi belum dapat dimulai.', 500);
}
session_save_path($sessionDirectory);
session_name('anteraja_php_session');
session_set_cookie_params([
    'httponly' => true, 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'samesite' => 'Lax', 'path' => '/',
]);
if (!session_start()) api_fail('INTERNAL_ERROR', 'Sesi belum dapat dimulai.', 500);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

// In production the PHP server serves the Vite build and every API route.
if (!str_starts_with($path, '/api/') && in_array($method, ['GET', 'HEAD'], true)) {
    $dist = realpath(dirname(__DIR__) . '/dist');
    if ($dist !== false) {
        $asset = realpath($dist . str_replace('/', DIRECTORY_SEPARATOR, $path));
        if ($asset !== false && str_starts_with($asset, $dist . DIRECTORY_SEPARATOR) && is_file($asset)) return false;
        if (is_file($dist . '/index.html')) {
            header('Content-Type: text/html; charset=utf-8');
            header('Cache-Control: no-cache');
            readfile($dist . '/index.html');
            exit;
        }
    }
}

try {
    if (!in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) require_same_origin();
    if ($path === '/api/health' && $method === 'GET') api_ok(['status' => 'ok', 'runtime' => 'php']);
    if ($path === '/api/v1/road-route' && $method === 'GET') road_route();
    if ($path === '/api/v1/auth/me' && $method === 'GET') api_ok(current_user());
    if ($path === '/api/v1/auth/login' && $method === 'POST') sign_in(raw_json());
    if ($path === '/api/v1/auth/logout' && $method === 'POST') sign_out();
    if ($path === '/api/v1/auth/register' && $method === 'POST') sign_up(raw_json());
    if ($path === '/api/v1/auth/activate-admin' && $method === 'POST') activate_admin(raw_json());
    if ($method === 'GET' && preg_match('#^/api/v1/view/(consumer|seller|seller-shipments|admin|admin-shipments|tickets|import)$#D', $path, $match)) page_data($match[1]);
    if ($method === 'GET' && preg_match('#^/api/v1/view/(seller|admin)/shipment/([^/]+)$#D', $path, $match)) shipment_detail_data($match[1], $match[2]);
    if ($method === 'POST' && preg_match('#^/api/v1/seller/shipments/([^/]+)/tickets$#D', $path, $match)) seller_ticket($match[1]);
    if ($method === 'GET' && preg_match('#^/api/v1/admin/tickets/([0-9a-f-]+)/proof$#iD', $path, $match)) TicketProof::download($match[1]);
    if ($path === '/api/v1/admin/assistant/action' && $method === 'POST') admin_ticket_status();
    if ($path === '/api/v1/admin/assistant' && $method === 'POST') admin_assistant();
    if ($path === '/api/v1/imports/preview' && $method === 'POST') import_preview();
    if ($path === '/api/v1/imports/preview-file' && $method === 'POST') import_preview_file();
    if ($path === '/api/v1/imports') imports($method);
    if ($method === 'POST' && preg_match('#^/api/v1/imports/([0-9a-f-]+)/cancel$#iD', $path, $match)) cancel_import($match[1]);

    if ($path === '/api/v1/categories') finance_categories($method);
    if (preg_match('#^/api/v1/categories/([0-9a-f-]+)$#iD', $path, $match)) finance_category($method, $match[1]);
    if ($path === '/api/v1/transactions') finance_transactions($method);
    if (preg_match('#^/api/v1/transactions/([0-9a-f-]+)$#iD', $path, $match)) finance_transaction($method, $match[1]);

    if (preg_match('#^/api/v1/tracking/([^/]+)(?:/(resolution|notifications|escalate))?$#D', $path, $match)) {
        $action = $match[2] ?? '';
        if ($action === '' && $method === 'GET') tracking_get($match[1]);
        if ($action === 'resolution' && $method === 'POST') tracking_resolution($match[1]);
        if ($action === 'notifications' && $method === 'POST') tracking_notifications($match[1]);
        if ($action === 'escalate' && $method === 'POST') tracking_escalate($match[1]);
        api_fail('METHOD_NOT_ALLOWED', 'Metode request tidak didukung.', 405);
    }
    api_fail('NOT_FOUND', 'Rute tidak ditemukan.', 404);
} catch (Throwable $error) {
    error_log('[php-api] ' . $error::class . ': ' . $error->getMessage());
    api_fail('INTERNAL_ERROR', 'Terjadi kesalahan di server.', 500);
}
