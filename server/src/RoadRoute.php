<?php
declare(strict_types=1);

function road_point(?string $value): ?array
{
    if ($value === null || strlen($value) > 40) return null;
    $parts = explode(',', $value);
    if (count($parts) !== 2 || !is_numeric($parts[0]) || !is_numeric($parts[1])) return null;
    $lat = (float) $parts[0]; $lng = (float) $parts[1];
    if ($lat < -11 || $lat > 7 || $lng < 95 || $lng > 142) return null;
    return [$lat, $lng];
}

function road_route(): never
{
    $from = road_point(isset($_GET['from']) ? (string) $_GET['from'] : null);
    $to = road_point(isset($_GET['to']) ? (string) $_GET['to'] : null);
    if (!$from || !$to) {
        http_response_code(400); header('Content-Type: application/json'); echo json_encode(['error' => 'Titik rute tidak valid.']); exit;
    }
    $config = project_config();
    $base = rtrim($config['road_router_url'] ?: 'https://router.project-osrm.org', '/');
    $parsed = parse_url($base);
    if (!$parsed || ($parsed['scheme'] ?? '') !== 'https' || isset($parsed['user']) || isset($parsed['pass'])) {
        http_response_code(503); header('Content-Type: application/json'); echo json_encode(['error' => 'Layanan rute belum dikonfigurasi.']); exit;
    }
    $coordinates = sprintf('%.6F,%.6F;%.6F,%.6F', $from[1], $from[0], $to[1], $to[0]);
    $url = $base . '/route/v1/driving/' . $coordinates . '?overview=simplified&geometries=geojson&steps=false';
    $handle = curl_init($url);
    curl_setopt_array($handle, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_FOLLOWLOCATION => false, CURLOPT_SSL_VERIFYPEER => true]);
    $raw = curl_exec($handle);
    $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    curl_close($handle);
    $body = is_string($raw) && $status === 200 ? json_decode($raw, true) : null;
    $coordinates = ($body['code'] ?? '') === 'Ok' ? ($body['routes'][0]['geometry']['coordinates'] ?? null) : null;
    if (!is_array($coordinates) || count($coordinates) < 2 || count($coordinates) > 15000) {
        http_response_code(503); header('Content-Type: application/json'); echo json_encode(['error' => 'Jalur jalan belum tersedia. Titik kota tetap dapat dilihat di peta.']); exit;
    }
    $path = [];
    foreach ($coordinates as $point) {
        if (!is_array($point) || count($point) < 2 || !is_numeric($point[0]) || !is_numeric($point[1])) {
            http_response_code(503); header('Content-Type: application/json'); echo json_encode(['error' => 'Geometri rute tidak valid.']); exit;
        }
        $path[] = [(float) $point[1], (float) $point[0]];
    }
    header('Content-Type: application/json'); header('Cache-Control: public, max-age=3600, stale-while-revalidate=86400');
    echo json_encode(['path' => $path], JSON_THROW_ON_ERROR); exit;
}
