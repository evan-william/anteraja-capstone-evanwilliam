<?php

return [
    // Redis is optional; authorization and writes never depend on this store.
    'enabled' => env('OPERATIONS_REDIS_ENABLED', true),
    'store' => 'redis',
    'generation_store' => 'file',
    'categories_ttl' => 30,
    'road_ttl' => 3600,
];
