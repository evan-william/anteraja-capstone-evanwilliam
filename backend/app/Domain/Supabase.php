<?php
declare(strict_types=1);

function supabase_request(string $method, string $path, ?array $body = null, array $headers = [], ?string $jwt = null): array
{
    $config = project_config();
    if (!str_starts_with($path, '/rest/v1/') && !str_starts_with($path, '/auth/v1/')) {
        throw new InvalidArgumentException('Path Supabase tidak diizinkan.');
    }
    $url = $config['supabase_url'] . $path;
    $startedAt = hrtime(true);
    $target = parse_url($path, PHP_URL_PATH) ?: '/unknown';
    $handle = \App\Support\SupabaseConnection::acquire();
    if ($handle === false) {
        app_log('upstream.failed', ['provider' => 'supabase', 'target' => $target, 'error_code' => 'CLIENT_INIT'], 'error');
        throw new RuntimeException('HTTP client tidak tersedia.');
    }
    $responseHeaders = [];
    $requestHeaders = [
        'apikey: ' . $config['supabase_key'],
        'Accept: application/json',
    ];
    if ($jwt !== null && $jwt !== '') $requestHeaders[] = 'Authorization: Bearer ' . $jwt;
    foreach ($headers as $header) $requestHeaders[] = $header;
    if ($body !== null) $requestHeaders[] = 'Content-Type: application/json';
    curl_setopt_array($handle, [
        CURLOPT_URL => $url,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_NOBODY => $method === 'HEAD',
        CURLOPT_ENCODING => '',
        CURLOPT_TCP_KEEPALIVE => 1,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_HTTPHEADER => $requestHeaders,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_HEADERFUNCTION => static function ($curl, string $line) use (&$responseHeaders): int {
            $parts = explode(':', $line, 2);
            if (count($parts) === 2) $responseHeaders[strtolower(trim($parts[0]))] = trim($parts[1]);
            return strlen($line);
        },
    ]);
    if ($body !== null) curl_setopt($handle, CURLOPT_POSTFIELDS, json_encode($body, JSON_THROW_ON_ERROR));
    $raw = curl_exec($handle);
    $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    $error = curl_error($handle);
    $duration = round((hrtime(true) - $startedAt) / 1_000_000, 2);
    app_log('upstream.completed', ['provider' => 'supabase', 'target' => $target,
        'operation' => $method, 'http_status' => $status, 'duration_ms' => $duration,
        'outcome' => $raw === false ? 'transport_error' : ($status >= 400 ? 'http_error' : 'ok')],
        $raw === false || $status >= 500 ? 'error' : ($status >= 400 ? 'warning' : 'info'));
    if ($raw === false) return ['status' => 0, 'data' => null, 'error' => $error, 'headers' => $responseHeaders];
    try {
        $data = $raw === '' ? null : json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        app_log('upstream.invalid_json', ['provider' => 'supabase', 'target' => $target, 'http_status' => $status], 'error');
        return ['status' => $status, 'data' => null, 'error' => 'Respons database bukan JSON.', 'headers' => $responseHeaders];
    }
    $message = is_array($data) ? ($data['message'] ?? $data['msg'] ?? null) : null;
    return ['status' => $status, 'data' => $data, 'error' => $status >= 400 ? ($message ?? 'Layanan data gagal.') : null, 'headers' => $responseHeaders];
}

function supabase_rpc(string $name, array $args, ?string $jwt = null): array
{
    if (!preg_match('/^[a-z][a-z0-9_]*$/D', $name)) throw new InvalidArgumentException('Nama RPC tidak valid.');
    return supabase_request('POST', '/rest/v1/rpc/' . $name, $args, [], $jwt);
}

function supabase_table(string $table, array $query = [], ?string $jwt = null): array
{
    if (!preg_match('/^[a-z][a-z0-9_]*$/D', $table)) throw new InvalidArgumentException('Nama tabel tidak valid.');
    return supabase_request('GET', '/rest/v1/' . $table . '?' . http_build_query($query, '', '&', PHP_QUERY_RFC3986), null, [], $jwt);
}

function supabase_mutate(string $method, string $table, array $query, ?array $body, string $jwt): array
{
    if (!preg_match('/^[a-z][a-z0-9_]*$/D', $table)) throw new InvalidArgumentException('Nama tabel tidak valid.');
    $path = '/rest/v1/' . $table . '?' . http_build_query($query, '', '&', PHP_QUERY_RFC3986);
    return supabase_request($method, $path, $body, ['Prefer: return=representation'], $jwt);
}

function supabase_count(string $table, array $filters, string $jwt): int
{
    if (!preg_match('/^[a-z][a-z0-9_]*$/D', $table)) throw new InvalidArgumentException('Nama tabel tidak valid.');
    $query = ['select' => 'id', ...$filters, 'limit' => '1'];
    $path = '/rest/v1/' . $table . '?' . http_build_query($query, '', '&', PHP_QUERY_RFC3986);
    $result = supabase_request('HEAD', $path, null, ['Prefer: count=exact'], $jwt);
    if ($result['status'] < 200 || $result['status'] >= 300) api_fail('INTERNAL_ERROR', 'Jumlah data belum dapat dibaca.', 500);
    return supabase_result_count($result);
}

function supabase_result_count(array $result): int
{
    $range = (string) ($result['headers']['content-range'] ?? '');
    if (!preg_match('#/(\d+)$#D', $range, $match)) api_fail('INTERNAL_ERROR', 'Jumlah data belum dapat dibaca.', 500);
    return (int) $match[1];
}

function supabase_read_many(array $queries, string $jwt): array
{
    // parallel reads only, after caller authorization; mutations keep their order.
    if ($queries === [] || count($queries) > 4) throw new InvalidArgumentException('Batch harus berisi satu sampai empat pembacaan.');
    foreach ($queries as $query) {
        if (!preg_match('/^[a-z][a-z0-9_]*$/D', $query['table'] ?? '') || !in_array($query['method'] ?? 'GET', ['GET', 'HEAD'], true)) throw new InvalidArgumentException('Batch hanya mengizinkan pembacaan tabel.');
    }
    $config = project_config();
    $multi = curl_multi_init();
    $handles = []; $headers = []; $results = [];
    try {
        foreach ($queries as $key => $query) {
            $handle = $handles === [] ? \App\Support\SupabaseConnection::acquire() : curl_init();
            if ($handle === false) throw new RuntimeException('HTTP client tidak tersedia.');
            $handles[$key] = $handle;
            $headers[$key] = [];
            $method = $query['method'] ?? 'GET';
            $requestHeaders = ['apikey: ' . $config['supabase_key'], 'Accept: application/json', 'Authorization: Bearer ' . $jwt];
            if ($method === 'HEAD') $requestHeaders[] = 'Prefer: count=exact';
            curl_setopt_array($handle, [
                CURLOPT_URL => $config['supabase_url'] . '/rest/v1/' . $query['table'] . '?' . http_build_query($query['query'] ?? [], '', '&', PHP_QUERY_RFC3986),
                CURLOPT_SHARE => \App\Support\SupabaseConnection::share(),
                CURLOPT_HTTPHEADER => $requestHeaders, CURLOPT_CUSTOMREQUEST => $method,
                CURLOPT_NOBODY => $method === 'HEAD', CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '', CURLOPT_CONNECTTIMEOUT => 4, CURLOPT_TIMEOUT => 12,
                CURLOPT_SSL_VERIFYPEER => true, CURLOPT_FOLLOWLOCATION => false,
                CURLOPT_PROTOCOLS => CURLPROTO_HTTPS, CURLOPT_PIPEWAIT => true,
                CURLOPT_HEADERFUNCTION => static function ($curl, string $line) use (&$headers, $key): int {
                    $parts = explode(':', $line, 2);
                    if (count($parts) === 2) $headers[$key][strtolower(trim($parts[0]))] = trim($parts[1]);
                    return strlen($line);
                },
            ]);
            if (curl_multi_add_handle($multi, $handle) !== CURLM_OK) throw new RuntimeException('HTTP batch tidak dapat dimulai.');
        }
        do {
            $status = curl_multi_exec($multi, $running);
            if ($status !== CURLM_OK) throw new RuntimeException('HTTP batch gagal.');
            if ($running && curl_multi_select($multi, 0.5) === -1) usleep(1000);
        } while ($running);
        foreach ($handles as $key => $handle) {
            $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
            $error = curl_errno($handle) !== 0 ? 'Layanan data tidak dapat dihubungi.' : null;
            $data = null;
            if ($error === null) {
                $raw = curl_multi_getcontent($handle);
                try { $data = $raw === '' ? null : json_decode($raw, true, 512, JSON_THROW_ON_ERROR); }
                catch (JsonException) { $error = 'Respons database bukan JSON.'; }
            }
            if ($error !== null) $status = 0;
            if ($status >= 400) $error = 'Layanan data gagal.';
            $results[$key] = ['status' => $status, 'data' => $data, 'error' => $error, 'headers' => $headers[$key]];
            app_log('upstream.completed', ['provider' => 'supabase', 'target' => '/rest/v1/' . $queries[$key]['table'],
                'operation' => $queries[$key]['method'] ?? 'GET', 'http_status' => $status,
                'duration_ms' => round(curl_getinfo($handle, CURLINFO_TOTAL_TIME) * 1000, 2),
                'mode' => 'parallel', 'outcome' => $error === null ? 'ok' : 'error'], $error === null ? 'info' : 'warning');
        }
        return $results;
    } finally {
        $first = true;
        foreach ($handles as $handle) {
            curl_multi_remove_handle($multi, $handle);
            if (!$first) curl_close($handle);
            $first = false;
        }
        curl_multi_close($multi);
    }
}
