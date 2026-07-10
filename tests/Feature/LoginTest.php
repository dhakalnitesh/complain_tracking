<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_super_admin_can_login(): void
    {
        $response = $this->post('/login', [
            'email' => 'admin@nagariksarokar.com',
            'password' => 'admin123',
        ]);

        $response->assertRedirect();
        $this->assertAuthenticated();
    }

    public function test_invalid_credentials_fail(): void
    {
        $response = $this->post('/login', [
            'email' => 'admin@nagariksarokar.com',
            'password' => 'wrong-password',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_tu_admin_can_login(): void
    {
        $response = $this->post('/login', [
            'email' => 'tu@nagariksarokar.com',
            'password' => 'password',
        ]);

        $response->assertRedirect();
        $this->assertAuthenticated();
    }

    public function test_super_admin_can_login_via_admin(): void
    {
        $response = $this->post('/admin/login', [
            'email' => 'admin@nagariksarokar.com',
            'password' => 'admin123',
        ]);

        $response->assertRedirect();
        $this->assertAuthenticated();
    }
}
