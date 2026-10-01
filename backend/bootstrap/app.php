<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->validateCsrfTokens(except: ['api/*']);
        $middleware->trimStrings(except: [fn($request)=>$request->is('api/*')]);
        $middleware->convertEmptyStringsToNull(except: [fn($request)=>$request->is('api/*')]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn($request,$error)=>$request->is('api/*'));
        $exceptions->render(function (\Throwable $error, \Illuminate\Http\Request $request) {
            if (!$request->is('api/*') || $error instanceof \Illuminate\Http\Exceptions\HttpResponseException) return null;
            $status = $error instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface ? $error->getStatusCode() : 500;
            $code = match ($status) { 404=>'NOT_FOUND',405=>'METHOD_NOT_ALLOWED',429=>'RATE_LIMITED',default=>'INTERNAL_ERROR' };
            if (function_exists('app_log')) app_log('php.exception',['exception_type'=>$error::class,'http_status'=>$status],'error');
            return response()->json(['success'=>false,'data'=>null,'error'=>['code'=>$code,'message'=>$status===429?'Terlalu banyak request. Tunggu sebentar.':'Request belum dapat diproses.']],$status);
        });
    })->create();
