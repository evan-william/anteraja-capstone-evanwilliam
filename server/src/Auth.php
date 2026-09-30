<?php
declare(strict_types=1);

function current_token(): ?string
{
    $token = isset($_SESSION['access_token']) && is_string($_SESSION['access_token']) ? $_SESSION['access_token'] : null;
    if ($token === null) return null;
    if ((int) ($_SESSION['expires_at'] ?? 0) > time() + 60) return $token;
    $refresh = (string) ($_SESSION['refresh_token'] ?? '');
    if ($refresh === '') return $token;
    $result = supabase_request('POST', '/auth/v1/token?grant_type=refresh_token', ['refresh_token' => $refresh]);
    if ($result['status'] !== 200 || empty($result['data']['access_token'])) {
        unset($_SESSION['access_token'], $_SESSION['refresh_token'], $_SESSION['expires_at']);
        return null;
    }
    $_SESSION['access_token'] = $result['data']['access_token'];
    $_SESSION['refresh_token'] = $result['data']['refresh_token'] ?? $refresh;
    $_SESSION['expires_at'] = time() + (int) ($result['data']['expires_in'] ?? 3600);
    return $_SESSION['access_token'];
}

function current_user(): ?array
{
    $token = current_token();
    if ($token === null) return null;
    $auth = supabase_request('GET', '/auth/v1/user', null, [], $token);
    if ($auth['status'] !== 200 || !is_array($auth['data']) || !isset($auth['data']['id'])) return null;
    $id = (string) $auth['data']['id'];
    $profile = supabase_table('users', ['select' => 'id,email,name', 'id' => 'eq.' . $id], $token);
    $role = supabase_table('account_roles', ['select' => 'role', 'user_id' => 'eq.' . $id], $token);
    if ($profile['status'] >= 400 || $role['status'] >= 400) return null;
    $row = $profile['data'][0] ?? [];
    $roleRow = $role['data'][0] ?? [];
    return [
        'id' => $id,
        'email' => $row['email'] ?? $auth['data']['email'] ?? '',
        'name' => $row['name'] ?? $auth['data']['user_metadata']['name'] ?? '',
        'role' => $roleRow['role'] ?? 'consumer',
    ];
}

function require_user(array $roles = []): array
{
    $user = current_user();
    if ($user === null) api_fail('UNAUTHORIZED', 'Kamu harus masuk dulu untuk mengakses data ini.', 401);
    if ($roles !== [] && !in_array($user['role'], $roles, true)) {
        api_fail('FORBIDDEN', 'Akun ini tidak memiliki akses ke ruang kerja tersebut.', 403);
    }
    return $user;
}

function sign_in(array $body): never
{
    $email = strtolower(trim((string) ($body['email'] ?? '')));
    $password = (string) ($body['password'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
        api_fail('VALIDATION_ERROR', 'Isi email dan password yang valid.', 400);
    }
    $result = supabase_request('POST', '/auth/v1/token?grant_type=password', ['email' => $email, 'password' => $password]);
    if ($result['status'] === 0) api_fail('INTERNAL_ERROR', 'Tidak dapat menghubungi layanan masuk. Coba lagi.', 503);
    if ($result['status'] !== 200 || empty($result['data']['access_token'])) {
        api_fail('UNAUTHORIZED', 'Email atau password salah.', 401);
    }
    session_regenerate_id(true);
    $_SESSION['access_token'] = $result['data']['access_token'];
    $_SESSION['refresh_token'] = $result['data']['refresh_token'] ?? '';
    $_SESSION['expires_at'] = time() + (int) ($result['data']['expires_in'] ?? 3600);
    $user = current_user();
    if ($user === null) api_fail('INTERNAL_ERROR', 'Profil akun belum dapat dimuat.', 503);
    api_ok($user);
}

function sign_out(): never
{
    $token = current_token();
    if ($token !== null) supabase_request('POST', '/auth/v1/logout', [], [], $token);
    unset($_SESSION['access_token'], $_SESSION['refresh_token'], $_SESSION['expires_at']);
    session_regenerate_id(true);
    api_ok(['signed_out' => true]);
}

function sign_up(array $body): never
{
    $name = trim((string) ($body['name'] ?? ''));
    $email = strtolower(trim((string) ($body['email'] ?? '')));
    $password = (string) ($body['password'] ?? '');
    $role = $body['role'] ?? 'consumer';
    $code = trim((string) ($body['activation_code'] ?? ''));
    if ($name === '' || mb_strlen($name) > 60) api_fail('VALIDATION_ERROR', 'Nama wajib diisi, maksimal 60 karakter.', 400);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) api_fail('VALIDATION_ERROR', 'Format email tidak valid.', 400);
    if (strlen($password) < 8) api_fail('VALIDATION_ERROR', 'Password minimal 8 karakter.', 400);
    if (!in_array($role, ['consumer', 'seller', 'admin'], true)) api_fail('VALIDATION_ERROR', 'Peran akun tidak valid.', 400);
    if ($role === 'admin' && strlen($code) < 12) api_fail('VALIDATION_ERROR', 'Masukkan kode aktivasi Admin yang valid.', 400);
    $result = supabase_request('POST', '/auth/v1/signup', [
        'email' => $email,
        'password' => $password,
        'data' => ['name' => $name, 'requested_role' => $role === 'seller' ? 'seller' : 'consumer'],
    ]);
    if ($result['status'] === 0) api_fail('INTERNAL_ERROR', 'Pendaftaran belum dapat dihubungi.', 503);
    if ($result['status'] >= 400) api_fail('VALIDATION_ERROR', 'Akun belum dapat dibuat. Periksa email dan coba lagi.', 400);
    $token = $result['data']['access_token'] ?? null;
    if (!is_string($token) || $token === '') {
        api_ok(['pending_confirmation' => true, 'role' => $role === 'admin' ? 'consumer' : $role,
            'message' => $role === 'admin'
                ? 'Konfirmasi email, masuk, lalu buka Aktivasi Admin dengan kode yang sama.'
                : 'Akun dibuat. Buka email konfirmasi sebelum masuk.'], 201);
    }
    session_regenerate_id(true);
    $_SESSION['access_token'] = $token;
    $_SESSION['refresh_token'] = $result['data']['refresh_token'] ?? '';
    $_SESSION['expires_at'] = time() + (int) ($result['data']['expires_in'] ?? 3600);
    if ($role === 'admin') {
        $activation = supabase_rpc('redeem_admin_activation_code', ['p_code' => $code], $token);
        if ($activation['status'] !== 200 || $activation['data'] !== true) {
            api_ok(['pending_activation' => true, 'role' => 'consumer',
                'message' => 'Akun dibuat sebagai Konsumen sementara. Coba kode lagi di halaman Aktivasi Admin.'], 201);
        }
    }
    api_ok(['pending_confirmation' => false, 'user' => current_user()], 201);
}

function activate_admin(array $body): never
{
    require_user();
    $code = trim((string) ($body['code'] ?? ''));
    if (strlen($code) < 12) api_fail('VALIDATION_ERROR', 'Kode aktivasi tidak valid.', 400);
    $result = supabase_rpc('redeem_admin_activation_code', ['p_code' => $code], current_token());
    if ($result['status'] !== 200 || $result['data'] !== true) {
        api_fail('VALIDATION_ERROR', 'Kode tidak berlaku atau batas percobaan tercapai. Hubungi pengelola operasional.', 400);
    }
    api_ok(current_user());
}
