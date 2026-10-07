<?php
namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class PerformanceSafetyTest extends TestCase
{
    public function test_count_parser_accepts_empty_and_paginated_results(): void
    {
        $this->assertSame(300, supabase_result_count(['headers' => ['content-range' => '0-24/300']]));
        $this->assertSame(0, supabase_result_count(['headers' => ['content-range' => '*/0']]));
    }

    public function test_count_parser_fails_closed_for_unknown_total(): void
    {
        $this->expectException(\Illuminate\Http\Exceptions\HttpResponseException::class);
        supabase_result_count(['headers' => ['content-range' => '0-24/*']]);
    }

    public function test_road_geometry_cache_returns_without_upstream_call(): void
    {
        $base = rtrim(project_config()['road_router_url'] ?: 'https://router.project-osrm.org', '/');
        $key = 'road-route:v1:' . hash('sha256', $base . ':106.845600,-6.208800;106.810600,-6.261500');
        $path = [[-6.2088, 106.8456], [-6.2615, 106.8106]];
        Cache::put($key, $path, 60);
        try {
            $this->getJson('/api/v1/road-route?from=-6.2088,106.8456&to=-6.2615,106.8106')
                ->assertOk()->assertExactJson(['path' => $path]);
        } finally {
            Cache::forget($key);
        }
    }
}
