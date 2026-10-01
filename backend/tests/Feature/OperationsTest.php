<?php
namespace Tests\Feature;
use Tests\TestCase;

class OperationsTest extends TestCase
{
    public function test_health_uses_laravel_and_request_id(): void {
        $this->getJson('/api/health')->assertOk()->assertJsonPath('data.runtime','laravel')->assertHeader('X-Request-ID');
    }
    public function test_anonymous_session_has_no_user(): void {
        $this->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data',null);
    }
    public function test_private_operations_require_login(): void {
        foreach (['admin','seller','consumer','tickets','import'] as $area) $this->getJson('/api/v1/view/'.$area)->assertUnauthorized()->assertJsonPath('error.code','UNAUTHORIZED');
    }
    public function test_cross_origin_write_is_rejected(): void {
        $this->withHeaders(['Origin'=>'https://evil.example','X-Requested-With'=>'XMLHttpRequest'])->postJson('/api/v1/auth/login',[])->assertForbidden();
    }
    public function test_invalid_login_and_custom_header(): void {
        $this->postJson('/api/v1/auth/login',[])->assertForbidden();
        $this->withHeaders(['X-Requested-With'=>'XMLHttpRequest'])->postJson('/api/v1/auth/login',[])->assertStatus(400)->assertJsonPath('error.code','VALIDATION_ERROR');
    }
    public function test_route_validation_and_fallback(): void {
        $this->getJson('/api/v1/road-route?from=40,106&to=-7,112')->assertStatus(400)->assertJsonPath('error','Titik rute tidak valid.');
        $this->getJson('/api/v1/not-real')->assertNotFound()->assertJsonPath('error.code','NOT_FOUND');
    }
    public function test_laravel_session_persists_domain_state(): void {
        $this->withSession(['operations'=>['assistant_rate'=>['test'=>['count'=>3]]]])->getJson('/api/v1/auth/me')->assertOk()->assertSessionHas('operations.assistant_rate.test.count',3);
    }
}
