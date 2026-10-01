<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ShipmentController;

Route::redirect('/', '/shipments');
Route::resource('shipments', ShipmentController::class);
