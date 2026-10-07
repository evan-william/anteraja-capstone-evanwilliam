<?php
declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Throwable;

final class OperationsCache
{
    private bool $unavailable = false;

    public function get(string $key): mixed
    {
        return $this->redis('get', $key);
    }

    public function put(string $key, mixed $value, int $ttl): void
    {
        $this->redis('put', $key, $value, $ttl);
    }

    private function redis(string $operation, string $key, mixed $value = null, int $ttl = 0): mixed
    {
        if (!config('operations_cache.enabled') || $this->unavailable) return null;
        try {
            $store = Cache::store(config('operations_cache.store'));
            $result = $operation === 'get' ? $store->get($key) : $store->put($key, $value, $ttl);
            $this->log('cache.'.($operation === 'get' ? ($result === null ? 'miss' : 'hit') : 'stored'), $key);
            return $result;
        } catch (Throwable) {
            // One failed connection per request, never log credentials or cached values.
            $this->unavailable = true;
            $this->log('cache.unavailable', $key);
            return null;
        }
    }

    public function categories(string $userId, array $query, callable $load): array
    {
        $generation = $this->generation($userId);
        if ($generation === null) return $load();
        ksort($query);
        $key = 'operations:v1:categories:'.hash('sha256', $userId.':'.$generation.':'.json_encode($query));
        $cached = $this->get($key);
        if (is_array($cached) && ($cached['status'] ?? null) === 200 && is_array($cached['data'] ?? null)) return $cached;
        $result = $load();
        // Errors and credentials must not enter Redis. Keep only the public result shape.
        if (($result['status'] ?? null) === 200 && is_array($result['data'] ?? null)) {
            $this->put($key, ['status' => 200, 'data' => $result['data']], config('operations_cache.categories_ttl'));
        }
        return $result;
    }

    private function generation(string $userId): ?string
    {
        try {
            return Cache::store(config('operations_cache.generation_store'))->rememberForever(
                'operations:category-generation:'.hash('sha256', $userId), fn () => (string) Str::uuid()
            );
        } catch (Throwable) {
            // If invalidation metadata cannot be read, read the database directly.
            return null;
        }
    }

    public function invalidateCategories(string $userId): void
    {
        // Local generation survives a Redis outage; old keys cannot return after recovery.
        // Refuse to claim success if the generation cannot be persisted.
        $saved = Cache::store(config('operations_cache.generation_store'))->forever(
            'operations:category-generation:'.hash('sha256', $userId), (string) Str::uuid()
        );
        if (!$saved) throw new \RuntimeException('Category cache invalidation failed.');
    }

    private function log(string $event, string $key): void
    {
        if (function_exists('app_log')) app_log($event, ['target' => str_starts_with($key, 'road-route:') ? 'road-route' : 'categories', 'provider' => 'redis'], $event === 'cache.unavailable' ? 'warning' : 'info');
    }
}
