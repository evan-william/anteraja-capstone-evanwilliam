<?php
declare(strict_types=1);
namespace App\Support;

use Illuminate\Http\Exceptions\HttpResponseException;

final class PageBootstrap
{
    public static function respond(): never
    {
        $resources = request()->query('resources', []);
        if (!is_array($resources) || count($resources) > 2) api_fail('VALIDATION_ERROR', 'Maksimal dua sumber data halaman.', 400);
        foreach ($resources as $resource) self::validate($resource);
        $user = current_user();
        if ($user === null) api_ok(['user' => null, 'resources' => []]);
        if ($resources === [] && request()->query('home') === '1') {
            $resources = ['/api/v1/view/' . match ($user['role']) { 'admin' => 'admin', 'seller' => 'seller', default => 'consumer' }];
        }
        $results = [];
        foreach ($resources as $resource) {
            $query = [];
            parse_str((string) parse_url($resource, PHP_URL_QUERY), $query);
            $original = request()->query->all();
            request()->query->replace($query);
            try {
                self::dispatch((string) parse_url($resource, PHP_URL_PATH));
            } catch (HttpResponseException $exception) {
                // preserve the original endpoint envelope, including denied/empty/error states.
                $results[] = ['path' => $resource, 'envelope' => json_decode($exception->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)];
            } finally {
                request()->query->replace($original);
            }
        }
        api_ok(['user' => $user, 'resources' => $results]);
    }

    public static function validate(mixed $resource): void
    {
        if (!is_string($resource) || strlen($resource) > 2048) api_fail('VALIDATION_ERROR', 'Sumber data tidak valid.', 400);
        $parts = parse_url($resource);
        if (!$parts || isset($parts['host']) || isset($parts['scheme']) || isset($parts['fragment'])) api_fail('VALIDATION_ERROR', 'Sumber data tidak valid.', 400);
        $path = $parts['path'] ?? '';
        if (!preg_match('#^/api/v1/(?:view/(?:consumer|seller|seller-shipments|admin|admin-shipments|tickets|import)|view/(?:seller|admin)/shipment/[A-Za-z0-9%-]+|categories|transactions)$#D', $path)) {
            api_fail('VALIDATION_ERROR', 'Sumber data tidak diizinkan.', 400);
        }
        parse_str($parts['query'] ?? '', $query);
        foreach ($query as $key => $value) {
            if (!in_array($key, ['q', 'risiko', 'halaman', 'status', 'limit'], true) || !is_string($value)) api_fail('VALIDATION_ERROR', 'Parameter halaman tidak valid.', 400);
        }
    }

    private static function dispatch(string $path): never
    {
        if ($path === '/api/v1/categories') finance_categories('GET');
        if ($path === '/api/v1/transactions') finance_transactions('GET');
        if (preg_match('#^/api/v1/view/(admin|seller)/shipment/([^/]+)$#D', $path, $match)) shipment_detail_data($match[1], rawurldecode($match[2]));
        page_data(substr($path, strlen('/api/v1/view/')));
    }
}
