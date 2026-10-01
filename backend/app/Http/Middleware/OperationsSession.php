<?php
namespace App\Http\Middleware;
use App\Support\SessionState;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Exceptions\HttpResponseException;

class OperationsSession
{
    public function handle(Request $request, Closure $next)
    {
        SessionState::$data = $request->session()->get('operations', []);
        SessionState::$user = null;
        app_log_start($request->method(), '/'.$request->path());
        app_log_session($request->session()->getId());
        try {
            // JSON API clients do not receive a Blade token; strict origin + custom
            // header + JSON content type form the CSRF boundary on these routes.
            if (!in_array($request->method(), ['GET','HEAD','OPTIONS'], true)) {
                require_same_origin();
                if ($request->header('X-Requested-With') !== 'XMLHttpRequest') api_fail('FORBIDDEN','Request aplikasi tidak valid.',403);
                if ((int)$request->header('Content-Length',0) > 0 && !$request->isJson() && !str_starts_with((string)$request->header('Content-Type'),'multipart/form-data')) api_fail('VALIDATION_ERROR','Gunakan JSON atau form unggahan.',415);
            }
            $response = $next($request);
        } catch (HttpResponseException $exception) {
            $response = $exception->getResponse();
        } finally {
            $request->session()->put('operations', SessionState::$data);
            SessionState::$data = [];
            SessionState::$user = null;
        }
        $response->headers->set('X-Request-ID', app_log_state()['request_id']);
        $response->headers->set('X-Content-Type-Options','nosniff');
        $response->headers->set('Referrer-Policy','strict-origin-when-cross-origin');
        http_response_code($response->getStatusCode());
        app_log_finish();
        return $response;
    }
}
