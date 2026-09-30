<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/src/Config.php';
require_once dirname(__DIR__) . '/src/Supabase.php';

$result = supabase_rpc('consume_tracking_rate_limit', [
    'p_client_key' => hash('sha256', 'php-migration-smoke-test'),
]);
echo 'Supabase RPC status: ' . $result['status'] . PHP_EOL;
echo 'Supabase RPC accepted: ' . ($result['data'] === true ? 'yes' : 'no') . PHP_EOL;
if ($result['error'] !== null) echo 'Diagnostic: ' . $result['error'] . PHP_EOL;

$tracking = supabase_rpc('get_public_tracking', ['p_awb' => 'ANT-100015', 'p_access_code' => '260926']);
echo 'Tracking RPC status: ' . $tracking['status'] . PHP_EOL;
echo 'Tracking found: ' . (is_array($tracking['data']) && ($tracking['data']['tracking_number'] ?? null) === 'ANT-100015' ? 'yes' : 'no') . PHP_EOL;
if ($tracking['error'] !== null) echo 'Tracking diagnostic: ' . $tracking['error'] . PHP_EOL;
