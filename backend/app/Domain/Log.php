<?php
declare(strict_types=1);

// Only operational metadata belongs in logs. Never pass request bodies, URLs with
// query strings, credentials, response bodies, or customer details to this file.
function &app_log_state(): array
{
    static $state = [];
    return $state;
}

function app_log_route(string $path): string
{
    $known = [
        'api', 'v1', 'health', 'auth', 'me', 'login', 'logout', 'register', 'activate-admin',
        'view', 'consumer', 'seller', 'seller-shipments', 'admin', 'admin-shipments',
        'tickets', 'ticket', 'shipment', 'shipments', 'proof', 'assistant', 'action',
        'imports', 'preview', 'preview-file', 'cancel', 'categories', 'transactions',
        'tracking', 'resolution', 'notifications', 'escalate', 'road-route', 'import',
    ];
    $parts = explode('/', trim($path, '/'));
    if ($parts[0] !== 'api') return 'page_or_asset';
    return '/' . implode('/', array_map(
        static fn(string $part): string => in_array($part, $known, true) ? $part : ':id',
        $parts,
    ));
}

function app_log_start(string $method, string $path): void
{
    $state =& app_log_state();
    $state = [
        'request_id' => bin2hex(random_bytes(8)),
        'started_at' => hrtime(true),
        'method' => in_array($method, ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], true) ? $method : 'OTHER',
        'route' => app_log_route($path),
    ];


    app_log('request.started');
}

function app_log_actor(string $userId, string $role): void
{
    $state =& app_log_state();
    $state['actor_hash'] = substr(hash('sha256', $userId), 0, 16);
    $state['actor_role'] = in_array($role, ['admin', 'seller', 'consumer'], true) ? $role : 'unknown';
}

function app_log_session(string $sessionId): void
{
    if ($sessionId === '') return;
    $state =& app_log_state();
    $state['session_hash'] = substr(hash('sha256', $sessionId), 0, 16);
}

function app_log(string $event, array $details = [], string $level = 'info'): void
{
    $state =& app_log_state();
    $allowed = ['provider', 'target', 'operation', 'outcome', 'error_code', 'http_status',
        'duration_ms', 'result_count', 'round', 'mode', 'exception_type', 'source', 'line'];
    $entry = [
        'time' => gmdate('Y-m-d\TH:i:s\Z'),
        'level' => in_array($level, ['info', 'warning', 'error'], true) ? $level : 'info',
        'event' => preg_match('/^[a-z][a-z0-9_.-]{0,63}$/D', $event) ? $event : 'unknown',
        'request_id' => $state['request_id'] ?? null,
        'method' => $state['method'] ?? null,
        'route' => $state['route'] ?? null,
    ];
    if (isset($state['actor_hash'])) $entry['actor_hash'] = $state['actor_hash'];
    if (isset($state['actor_role'])) $entry['actor_role'] = $state['actor_role'];
    if (isset($state['session_hash'])) $entry['session_hash'] = $state['session_hash'];
    foreach ($details as $key => $value) {
        if (!in_array($key, $allowed, true) || !is_scalar($value)) continue;
        if (is_string($value) && (!preg_match('#^[a-zA-Z0-9_./:-]{1,120}$#D', $value))) continue;
        $entry[$key] = $value;
    }
    $directory = dirname(base_path()) . '/.private/logs';
    try {
        if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
            throw new RuntimeException('Log directory unavailable');
        }
        $file = $directory . '/events-' . gmdate('Y-m-d') . '.jsonl';
        $written = file_put_contents($file, json_encode($entry, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . "\n", FILE_APPEND | LOCK_EX);
        if ($written === false) throw new RuntimeException('Log write failed');
        if (DIRECTORY_SEPARATOR !== '\\') chmod($file, 0600);
    } catch (Throwable) {
        error_log('[php-api] Structured log unavailable.');
    }
}

function app_log_finish(): void
{
    $last = error_get_last();
    if ($last !== null && in_array($last['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR], true)) {
        app_log('php.fatal', ['error_code' => 'FATAL_' . $last['type'],
            'source' => basename($last['file']), 'line' => $last['line']], 'error');
    }
    $state =& app_log_state();
    app_log('request.completed', [
        'http_status' => (int) (http_response_code() ?: 200),
        'duration_ms' => isset($state['started_at']) ? round((hrtime(true) - $state['started_at']) / 1_000_000, 2) : 0,
    ]);
}

function app_log_capture_php_warnings(): void
{
    set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
        static $handling = false;
        if ($handling || !(error_reporting() & $severity)) return false;
        $handling = true;
        try {
            app_log('php.warning', ['error_code' => 'PHP_' . $severity,
                'source' => basename($file), 'line' => $line], 'warning');
        } finally {
            $handling = false;
        }
        // Keep PHP's normal warning behavior; only the structured entry omits
        // potentially sensitive message text.
        return false;
    });
}
