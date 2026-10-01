<?php

use Illuminate\Support\Facades\Route;

require __DIR__.'/operations.php';

// production SPA entry; assets are served only from the public web root.
Route::get('/{path?}', function () {
    $file = dirname(base_path()).'/dist/index.html';
    if (!is_file($file)) return response('Build frontend belum tersedia. Jalankan npm run build.',503);
    return response()->file($file,['Cache-Control'=>'no-cache']);
})->where('path','(?!api(?:/|$)).*');
