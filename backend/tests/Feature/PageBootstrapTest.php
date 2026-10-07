<?php
namespace Tests\Feature;
use Tests\TestCase;

class PageBootstrapTest extends TestCase
{
    public function test_anonymous_bootstrap_never_returns_private_data(): void
    {
        $this->getJson('/api/v1/bootstrap?resources%5B%5D=%2Fapi%2Fv1%2Fview%2Fadmin')
            ->assertOk()->assertJsonPath('data.user', null)->assertJsonPath('data.resources', []);
    }

    public function test_resource_whitelist_rejects_writes_external_urls_and_nested_parameters(): void
    {
        foreach (['https://evil.example/api/v1/categories', '/api/v1/auth/login', '/api/v1/imports/preview', '/api/v1/view/admin?q[]=secret'] as $path) {
            $this->getJson('/api/v1/bootstrap?' . http_build_query(['resources' => [$path]]))
                ->assertStatus(400)->assertJsonPath('error.code', 'VALIDATION_ERROR');
        }
    }

    public function test_batch_size_is_bounded(): void
    {
        $this->getJson('/api/v1/bootstrap?' . http_build_query(['resources' => array_fill(0, 3, '/api/v1/view/admin')]))->assertStatus(400);
        $this->getJson('/api/v1/bootstrap?resources=invalid')->assertStatus(400);
    }
}
