<?php
namespace Tests\Feature;

use App\Support\OperationsCache;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class OperationsCacheTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['operations_cache.enabled' => true, 'operations_cache.store' => 'array', 'operations_cache.generation_store' => 'array']);
    }

    public function test_reads_once_then_hits_cache_and_separates_accounts_and_queries(): void
    {
        $cache = new OperationsCache;
        $calls = 0;
        $load = function () use (&$calls) { $calls++; return ['status' => 200, 'data' => [['name' => 'Biaya']]]; };
        $first = $cache->categories('seller-a', ['status' => 'active'], $load);
        $this->assertSame($first, $cache->categories('seller-a', ['status' => 'active'], $load));
        $this->assertSame(1, $calls);
        $cache->categories('seller-b', ['status' => 'active'], $load);
        $cache->categories('seller-a', ['status' => 'archived'], $load);
        $this->assertSame(3, $calls);
        $cache->invalidateCategories('seller-a');
        $cache->categories('seller-a', ['status' => 'active'], $load);
        $this->assertSame(4, $calls);
    }

    public function test_errors_are_never_cached_and_entries_expire(): void
    {
        $cache = new OperationsCache;
        $calls = 0;
        $load = function () use (&$calls) { $calls++; return ['status' => 500, 'data' => null]; };
        $cache->categories('seller-a', [], $load);
        $cache->categories('seller-a', [], $load);
        $this->assertSame(2, $calls);
        $cache->put('test:ttl', ['ok' => true], 30);
        $this->assertSame(['ok' => true], $cache->get('test:ttl'));
        $this->travel(31)->seconds();
        $this->assertNull($cache->get('test:ttl'));
    }

    public function test_redis_outage_bypasses_cache_and_recovery_cannot_restore_invalidated_data(): void
    {
        $cache = new OperationsCache;
        $cache->categories('seller-a', [], fn () => ['status' => 200, 'data' => [['name' => 'Lama']]]);
        config(['operations_cache.store' => 'missing-store']);
        $offline = new OperationsCache;
        $offline->invalidateCategories('seller-a');
        $this->assertSame(['name' => 'Baru'], $offline->categories('seller-a', [], fn () => ['status' => 200, 'data' => [['name' => 'Baru']]])['data'][0]);
        config(['operations_cache.store' => 'array']);
        $this->assertSame(['name' => 'Baru'], (new OperationsCache)->categories('seller-a', [], fn () => ['status' => 200, 'data' => [['name' => 'Baru']]])['data'][0]);
    }

    public function test_disabled_cache_and_unavailable_generation_read_the_source(): void
    {
        config(['operations_cache.generation_store' => 'missing-store']);
        $calls = 0;
        $cache = new OperationsCache;
        $load = function () use (&$calls) { $calls++; return ['status' => 200, 'data' => []]; };
        $cache->categories('seller-a', [], $load);
        $cache->categories('seller-a', [], $load);
        $this->assertSame(2, $calls);
        config(['operations_cache.enabled' => false]);
        $cache->put('test:disabled', ['ok' => true], 30);
        $this->assertNull($cache->get('test:disabled'));
    }
}
