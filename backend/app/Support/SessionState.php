<?php
namespace App\Support;

// per-request domain state; transport/persistence belongs to Laravel's encrypted session.
final class SessionState
{
    public static array $data = [];
    public static ?array $user = null;
}
