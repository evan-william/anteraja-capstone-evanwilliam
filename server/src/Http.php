<?php
declare(strict_types=1);

function api_ok(mixed $data, int $status = 200): never
{
    api_json(['success' => true, 'data' => $data, 'error' => null], $status);
}

function api_fail(string $code, string $message, int $status = 400): never
{
    api_json(['success' => false, 'data' => null, 'error' => ['code' => $code, 'message' => $message]], $status);
}

function api_json(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}

function raw_json(int $maxBytes = 1_048_576): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) > $maxBytes) {
        api_fail('VALIDATION_ERROR', 'Body request terlalu besar.', 400);
    }
    try {
        $object = json_decode($raw, false, 512, JSON_THROW_ON_ERROR);
        $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        api_fail('VALIDATION_ERROR', 'Body request harus berupa JSON.', 400);
    }
    if (!$object instanceof stdClass || !is_array($data)) {
        api_fail('VALIDATION_ERROR', 'Body request harus berupa objek JSON.', 400);
    }
    return $data;
}

function request_header(string $name): string
{
    $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
    return trim((string) ($_SERVER[$key] ?? ''));
}

function require_method(string $expected): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $expected) {
        header('Allow: ' . $expected);
        api_fail('METHOD_NOT_ALLOWED', 'Metode request tidak didukung.', 405);
    }
}

function require_same_origin(): void
{
    $origin = request_header('Origin');
    if ($origin === '') return;
    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    $originHost = strtolower((string) parse_url($origin, PHP_URL_HOST));
    $originPort = parse_url($origin, PHP_URL_PORT);
    $requestHost = strtolower((string) parse_url('http://' . $host, PHP_URL_HOST));
    $requestPort = parse_url('http://' . $host, PHP_URL_PORT);
    if ($originHost !== $requestHost || $originPort !== $requestPort) {
        api_fail('FORBIDDEN', 'Asal request tidak diizinkan.', 403);
    }
}

function validate_awb(string $value): string
{
    $awb = strtoupper(trim($value));
    if (!preg_match('/^ANT-[0-9]{6}$/D', $awb)) {
        api_fail('VALIDATION_ERROR', 'Nomor resi harus seperti ANT-100015.', 400);
    }
    return $awb;
}

function validate_access_code(string $value): string
{
    $code = trim($value);
    if (!preg_match('/^[0-9]{6}$/D', $code)) {
        api_fail('VALIDATION_ERROR', 'Kode akses harus terdiri dari 6 angka.', 400);
    }
    return $code;
}
