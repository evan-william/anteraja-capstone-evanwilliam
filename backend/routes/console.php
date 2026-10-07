<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('operations:cache-check', function () {
    $key = 'operations:diagnostic:'.\Illuminate\Support\Str::uuid();
    $store = \Illuminate\Support\Facades\Cache::store('redis');
    try {
        $started = hrtime(true);
        $pong = \Illuminate\Support\Facades\Redis::connection('cache')->ping();
        $store->put($key, ['ok' => true], 10);
        if ($store->get($key) !== ['ok' => true]) throw new \RuntimeException('Read/write mismatch');
        $this->info('Redis PING + SET + GET: PASS ('.round((hrtime(true) - $started) / 1e6, 2).' ms)');
        $this->line('Temporary key TTL: 10 seconds. No customer data used.');
        return 0;
    } catch (\Throwable $error) {
        $this->error('Redis unavailable: '.$error::class.'. Check host/port; API uses fallback.');
        return 1;
    } finally {
        try { $store->forget($key); } catch (\Throwable) { /* diagnostic only */ }
    }
})->purpose('Verify Redis without exposing credentials or clearing unrelated keys');
