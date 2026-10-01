<?php
declare(strict_types=1);

function project_config(): array
{
    static $config = null;
    if ($config !== null) return $config;

    $path = dirname(base_path()) . DIRECTORY_SEPARATOR . '.env.local';
    if (!is_file($path)) throw new RuntimeException('Buat .env.local dari .env.example.');
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) throw new RuntimeException('Konfigurasi tidak dapat dibaca.');
    $values = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
        [$name, $value] = explode('=', $line, 2);
        $values[trim($name)] = trim(trim($value), "\"'");
    }
    $url = rtrim($values['SUPABASE_URL'] ?? $values['NEXT_PUBLIC_SUPABASE_URL'] ?? '', '/');
    $key = $values['SUPABASE_PUBLISHABLE_KEY'] ?? $values['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] ?? '';
    if (!filter_var($url, FILTER_VALIDATE_URL) || !str_starts_with($url, 'https://') || $key === '') {
        throw new RuntimeException('Supabase URL atau publishable key belum dikonfigurasi.');
    }
    $config = [
        'supabase_url' => $url, 'supabase_key' => $key,
        'gemini_key' => $values['GEMINI_API_KEY'] ?? '',
        'gemini_model' => $values['GEMINI_MODEL'] ?? 'gemini-3.5-flash-lite',
        'road_router_url' => $values['ROAD_ROUTER_URL'] ?? '',
    ];
    return $config;
}
