<?php
namespace Tests\Unit;

use App\Support\SupabaseConnection;
use PHPUnit\Framework\TestCase;

class SupabaseConnectionTest extends TestCase
{
    protected function tearDown(): void
    {
        SupabaseConnection::release();
        parent::tearDown();
    }

    public function test_handle_is_reused_only_within_request(): void
    {
        $first = SupabaseConnection::acquire();
        curl_setopt($first, CURLOPT_URL, 'https://example.com/private');
        $second = SupabaseConnection::acquire();
        $this->assertSame($first, $second);
        $this->assertSame('', curl_getinfo($second, CURLINFO_EFFECTIVE_URL));
        SupabaseConnection::release();
        $this->assertNotSame($first, SupabaseConnection::acquire());
    }

    public function test_release_can_be_called_twice(): void
    {
        SupabaseConnection::release();
        SupabaseConnection::release();
        $this->assertInstanceOf(\CurlHandle::class, SupabaseConnection::acquire());
    }
}
