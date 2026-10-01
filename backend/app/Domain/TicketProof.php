<?php
declare(strict_types=1);

/** Optional ticket evidence stays outside the public web root. */
final class TicketProof
{
    public const MAX_BYTES = 2 * 1024 * 1024;

    private static function directory(): string
    {
        return dirname(base_path()) . '/.private/ticket-proofs';
    }

    private static function path(string $ticketId, string $extension): string
    {
        return self::directory() . '/' . $ticketId . '.' . $extension;
    }

    public static function validate(?array $file): ?string
    {
        if ($file === null || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) return null;
        if (($file['error'] ?? null) !== UPLOAD_ERR_OK || !is_string($file['tmp_name'] ?? null)) {
            api_fail('VALIDATION_ERROR', 'Foto tidak berhasil diunggah. Coba lagi.', 400);
        }
        if (!is_int($file['size'] ?? null) || $file['size'] <= 0 || $file['size'] > self::MAX_BYTES) {
            api_fail('VALIDATION_ERROR', 'Foto maksimal 2 MB.', 400);
        }
        if (!is_uploaded_file($file['tmp_name'])) {
            api_fail('VALIDATION_ERROR', 'Berkas unggahan tidak valid.', 400);
        }
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        $image = @getimagesize($file['tmp_name']);
        $extension = match ($mime) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            default => null,
        };
        if ($extension === null || $image === false || $image['mime'] !== $mime) {
            api_fail('VALIDATION_ERROR', 'Foto harus berupa gambar JPG atau PNG yang valid.', 400);
        }
        return $extension;
    }

    public static function store(string $ticketId, array $file, string $extension): bool
    {
        $directory = self::directory();
        if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) return false;
        return move_uploaded_file($file['tmp_name'], self::path($ticketId, $extension));
    }

    public static function existingPath(string $ticketId): ?string
    {
        foreach (['jpg', 'png'] as $extension) {
            $path = self::path($ticketId, $extension);
            if (is_file($path)) return $path;
        }
        return null;
    }

    public static function download(string $ticketId): never
    {
        require_user(['admin']);
        $ticketId = valid_uuid($ticketId);
        // Verify the ticket is still visible to this Admin before reading its file.
        $rows = view_rows('support_tickets', ['select' => 'id', 'id' => 'eq.' . $ticketId, 'limit' => '1'], current_token());
        if ($rows === []) api_fail('NOT_FOUND', 'Tiket tidak ditemukan.', 404);
        $path = self::existingPath($ticketId);
        if ($path === null) api_fail('NOT_FOUND', 'Foto bukti tidak tersedia.', 404);
        $extension = pathinfo($path, PATHINFO_EXTENSION);
        throw new \Illuminate\Http\Exceptions\HttpResponseException(response()->download($path, 'bukti-tiket-' . $ticketId . '.' . $extension, ['Cache-Control'=>'private, no-store', 'X-Content-Type-Options'=>'nosniff']));
    }
}

function ticket_request(): array
{
    $contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
    if (str_starts_with($contentType, 'multipart/form-data')) {
        if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > TicketProof::MAX_BYTES + 1024 * 1024) {
            api_fail('VALIDATION_ERROR', 'Foto maksimal 2 MB.', 400);
        }
        $note = text_field($_POST, 'note', 0, 500, 'Catatan maksimal 500 karakter.');
        $file = $_FILES['foto'] ?? null;
        $extension = TicketProof::validate(is_array($file) ? $file : null);
        return [$note, $file, $extension];
    }
    return [text_field(raw_json(), 'note', 0, 500, 'Catatan maksimal 500 karakter.'), null, null];
}

function ticket_response(array $data, ?array $file, ?string $extension): never
{
    $ticketId = (string) ($data['ticket_id'] ?? '');
    if ($extension !== null && $file !== null) {
        if (!preg_match('/^[0-9a-f-]{36}$/iD', $ticketId) || !TicketProof::store($ticketId, $file, $extension)) {
            $data['proof_warning'] = 'Tiket berhasil dibuat, tetapi foto belum tersimpan. Hubungi CS dengan nomor tiket ini.';
            app_log('ticket.proof', ['outcome' => 'store_failed'], 'warning');
        } else {
            $data['proof_attached'] = true;
            app_log('ticket.proof', ['outcome' => 'attached']);
        }
    }
    app_log('ticket.created', ['outcome' => 'success']);
    api_ok($data, 201);
}
