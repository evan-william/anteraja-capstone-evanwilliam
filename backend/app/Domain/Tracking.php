<?php
declare(strict_types=1);

function tracking_limit(): void
{
    // REMOTE_ADDR is authoritative for the built-in server. Do not trust arbitrary
    // X-Forwarded-For headers unless a production proxy is explicitly configured.
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'local');
    $key = hash('sha256', 'tracking:' . $ip);
    $result = supabase_rpc('consume_tracking_rate_limit', ['p_client_key' => $key]);
    if ($result['status'] !== 200) api_fail('RATE_LIMIT_UNAVAILABLE', 'Pengamanan akses sedang tidak tersedia.', 503);
    if ($result['data'] !== true) api_fail('RATE_LIMITED', 'Terlalu banyak percobaan. Coba lagi dalam satu menit.', 429);
}

function tracking_get(string $rawAwb): never
{
    tracking_limit();
    $awb = validate_awb(rawurldecode($rawAwb));
    $code = validate_access_code((string) ($_GET['code'] ?? ''));
    $result = supabase_rpc('get_public_tracking', ['p_awb' => $awb, 'p_access_code' => $code]);
    if ($result['status'] !== 200) api_fail('INTERNAL_ERROR', 'Status kiriman belum dapat dimuat.', 500);
    if ($result['data'] === null) api_fail('NOT_FOUND', 'Resi atau kode akses tidak cocok. Periksa kembali data pada pesan pengiriman.', 404);
    $tracking = $result['data'];
    $tracking['timeliness'] = ShipmentStatus::describe($tracking);
    api_ok($tracking);
}

function tracking_code_header(): string
{
    return validate_access_code(request_header('x-tracking-code'));
}

function text_field(array $data, string $field, int $min, int $max, string $message): string
{
    $raw = $data[$field] ?? '';
    if (!is_string($raw)) api_fail('VALIDATION_ERROR', $message, 400);
    $value = trim($raw);
    $length = mb_strlen($value, 'UTF-8');
    if ($length < $min || $length > $max) api_fail('VALIDATION_ERROR', $message, 400);
    return $value;
}

function phone_field(array $data): string
{
    $raw = $data['phone'] ?? '';
    if (!is_string($raw)) api_fail('VALIDATION_ERROR', 'Nomor telepon tidak valid.', 400);
    $phone = trim($raw);
    if (!preg_match('/^\+?[0-9]{9,15}$/D', $phone)) api_fail('VALIDATION_ERROR', 'Nomor telepon tidak valid.', 400);
    return $phone;
}

function resolution_payload(array $data): array
{
    $type = $data['type'] ?? null;
    if ($type === 'update_address') return [$type, [
        'district' => text_field($data, 'district', 2, 80, 'Kecamatan wajib diisi.'),
        'street' => text_field($data, 'street', 5, 180, 'Nama jalan terlalu pendek.'),
        'landmark' => text_field($data, 'landmark', 3, 150, 'Petunjuk lokasi terlalu pendek.'),
        'phone' => phone_field($data),
    ]];
    if ($type === 'reschedule') {
        $date = (string) ($data['delivery_date'] ?? '');
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/D', $date)) api_fail('VALIDATION_ERROR', 'Tanggal pengiriman tidak valid.', 400);
        return [$type, ['delivery_date' => $date, 'note' => text_field($data, 'note', 0, 150, 'Catatan maksimal 150 karakter.')]];
    }
    if ($type === 'safe_drop') return [$type, [
        'landmark' => text_field($data, 'landmark', 3, 150, 'Lokasi penitipan wajib diisi.'),
        'phone' => phone_field($data),
    ]];
    api_fail('VALIDATION_ERROR', 'Jenis instruksi tidak valid.', 400);
}

function tracking_resolution(string $rawAwb): never
{
    tracking_limit();
    $awb = validate_awb(rawurldecode($rawAwb));
    [$type, $payload] = resolution_payload(raw_json());
    $code = tracking_code_header();
    $result = supabase_rpc('submit_tracking_resolution', [
        'p_awb' => $awb, 'p_access_code' => $code,
        'p_resolution_type' => $type, 'p_payload' => $payload,
    ]);
    $message = strtolower((string) ($result['error'] ?? ''));
    if (str_contains($message, 'already submitted')) api_fail('CONFLICT', 'Instruksi untuk resi ini sudah dikirim hari ini.', 409);
    if (str_contains($message, 'does not require')) api_fail('CONFLICT', 'Kiriman ini tidak lagi membutuhkan instruksi tambahan.', 409);
    if (str_contains($message, 'access invalid')) api_fail('VALIDATION_ERROR', 'Resi atau kode akses tidak cocok.', 400);
    if ($result['status'] !== 200) api_fail('INTERNAL_ERROR', 'Instruksi belum dapat disimpan. Coba lagi.', 500);
    app_log('tracking.resolution_saved', ['outcome' => 'success']);
    api_ok($result['data'], 201);
}

function tracking_notifications(string $rawAwb): never
{
    tracking_limit();
    $awb = validate_awb(rawurldecode($rawAwb));
    $data = raw_json();
    foreach (['whatsapp', 'email', 'push'] as $field) {
        if (isset($data[$field]) && !is_bool($data[$field])) api_fail('VALIDATION_ERROR', 'Preferensi notifikasi tidak valid.', 400);
    }
    $code = tracking_code_header();
    $result = supabase_rpc('set_tracking_notifications', [
        'p_awb' => $awb, 'p_access_code' => $code,
        'p_whatsapp' => $data['whatsapp'] ?? false,
        'p_email' => $data['email'] ?? false,
        'p_push' => $data['push'] ?? false,
    ]);
    if (str_contains(strtolower((string) ($result['error'] ?? '')), 'access invalid')) {
        api_fail('VALIDATION_ERROR', 'Resi atau kode akses tidak cocok.', 400);
    }
    if ($result['status'] !== 200) api_fail('INTERNAL_ERROR', 'Preferensi notifikasi belum dapat disimpan.', 500);
    app_log('tracking.notifications_saved', ['outcome' => 'success']);
    api_ok($result['data']);
}

function tracking_escalate(string $rawAwb): never
{
    $user = require_user(['consumer', 'seller']);
    tracking_limit();
    $awb = validate_awb(rawurldecode($rawAwb));
    [$note, $file, $extension] = ticket_request();
    $code = tracking_code_header();
    $result = supabase_rpc('create_tracking_ticket', [
        'p_awb' => $awb, 'p_access_code' => $code, 'p_note' => $note,
    ], current_token());
    if (str_contains(strtolower((string) ($result['error'] ?? '')), 'access invalid')) {
        api_fail('VALIDATION_ERROR', 'Resi atau kode akses tidak cocok.', 400);
    }
    if ($result['status'] !== 200) api_fail('INTERNAL_ERROR', 'Tiket belum dapat dibuat. Coba lagi.', 500);
    ticket_response($result['data'], $file, $extension);
}
