<?php
declare(strict_types=1);

namespace App\Support;

final class SupabaseConnection
{
    private static ?\CurlHandle $handle = null;
    private static ?\CurlShareHandle $share = null;

    public static function share(): \CurlShareHandle
    {
        if (self::$share === null) {
            self::$share = curl_share_init();
            foreach ([CURL_LOCK_DATA_DNS, CURL_LOCK_DATA_SSL_SESSION, CURL_LOCK_DATA_CONNECT] as $kind) {
                if (!curl_share_setopt(self::$share, CURLSHOPT_SHARE, $kind)) throw new \RuntimeException('HTTP connection sharing tidak tersedia.');
            }
        }
        return self::$share;
    }

    public static function acquire(): \CurlHandle
    {
        // keep the TLS connection, but reset headers, credentials and body each call.
        if (self::$handle === null) {
            $handle = curl_init();
            if ($handle === false) throw new \RuntimeException('HTTP client tidak tersedia.');
            self::$handle = $handle;
        } else {
            curl_reset(self::$handle);
        }
        curl_setopt(self::$handle, CURLOPT_SHARE, self::share());
        return self::$handle;
    }

    public static function release(): void
    {
        // never share transport state between users or requests, including workers.
        if (self::$handle !== null) curl_close(self::$handle);
        self::$handle = null;
        if (self::$share !== null) curl_share_close(self::$share);
        self::$share = null;
    }
}
