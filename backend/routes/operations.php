<?php
use App\Http\Controllers\OperationsController as C;
use App\Http\Middleware\OperationsSession;
use Illuminate\Support\Facades\Route;

Route::prefix('api')->middleware(OperationsSession::class)->group(function () {
    Route::get('health',[C::class,'health']);
    Route::prefix('v1')->group(function () {
        Route::get('bootstrap',[C::class,'bootstrap']);
        Route::get('road-route',[C::class,'roadRoute']);
        Route::get('auth/me',[C::class,'me']);
        Route::post('auth/login',[C::class,'login'])->middleware('throttle:20,1');
        Route::post('auth/logout',[C::class,'logout']);
        Route::post('auth/register',[C::class,'register'])->middleware('throttle:10,1');
        Route::post('auth/activate-admin',[C::class,'activateAdmin'])->middleware('throttle:10,1');
        Route::get('view/{area}',[C::class,'view'])->where('area','consumer|seller|seller-shipments|admin|admin-shipments|tickets|import');
        Route::get('view/{role}/shipment/{id}',[C::class,'shipment'])->where('role','seller|admin');
        Route::post('seller/shipments/{awb}/tickets',[C::class,'sellerTicket']);
        Route::get('admin/tickets/{id}/proof',[C::class,'proof'])->where('id','[0-9a-fA-F-]+');
        Route::post('admin/assistant/action',[C::class,'assistantAction']);
        Route::post('admin/assistant',[C::class,'assistant']);
        Route::post('imports/preview',[C::class,'preview']);
        Route::post('imports/preview-file',[C::class,'previewFile']);
        Route::match(['GET','POST'],'imports',[C::class,'imports']);
        Route::post('imports/{id}/cancel',[C::class,'cancelImport'])->where('id','[0-9a-fA-F-]+');
        Route::match(['GET','POST'],'categories',[C::class,'categories']);
        Route::match(['PATCH','DELETE'],'categories/{id}',[C::class,'category'])->where('id','[0-9a-fA-F-]+');
        Route::match(['GET','POST'],'transactions',[C::class,'transactions']);
        Route::match(['PATCH','DELETE'],'transactions/{id}',[C::class,'transaction'])->where('id','[0-9a-fA-F-]+');
        Route::get('tracking/{awb}',[C::class,'tracking']);
        Route::post('tracking/{awb}/resolution',[C::class,'resolution']);
        Route::post('tracking/{awb}/notifications',[C::class,'notifications']);
        Route::post('tracking/{awb}/escalate',[C::class,'escalate']);
    });
    Route::fallback(fn()=>api_fail('NOT_FOUND','Rute tidak ditemukan.',404));
});
