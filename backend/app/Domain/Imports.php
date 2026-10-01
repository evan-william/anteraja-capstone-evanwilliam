<?php
declare(strict_types=1);

function import_rows(array $rows, bool $saving): array
{
    if (count($rows) > 50_000 || ($saving && $rows === [])) api_fail('VALIDATION_ERROR', 'Jumlah baris impor tidak valid.', 400);
    foreach ($rows as $index => $row) {
        if (!is_array($row) || !is_int($row['row_number'] ?? null) || $row['row_number'] < 1
            || !is_string($row['fingerprint'] ?? null) || strlen($row['fingerprint']) < 1 || strlen($row['fingerprint']) > 500
            || !in_array($row['status'] ?? null, ['new', 'matched', 'error'], true)
            || !array_key_exists('transaction_date', $row) || !array_key_exists('description', $row)
            || !array_key_exists('amount', $row) || !array_key_exists('type', $row)
            || !array_key_exists('error_message', $row)) {
            api_fail('VALIDATION_ERROR', 'Format baris ' . ($index + 1) . ' tidak valid.', 400);
        }
        if ($row['transaction_date'] !== null && (!is_string($row['transaction_date']) || !preg_match('/^\d{4}-\d{2}-\d{2}$/D', $row['transaction_date']))) api_fail('VALIDATION_ERROR', 'Tanggal mutasi tidak valid.', 400);
        if ($row['description'] !== null && (!is_string($row['description']) || mb_strlen($row['description']) > 200)) api_fail('VALIDATION_ERROR', 'Deskripsi mutasi terlalu panjang.', 400);
        if ($row['amount'] !== null && (!is_int($row['amount']) || $row['amount'] < 1)) api_fail('VALIDATION_ERROR', 'Nominal mutasi tidak valid.', 400);
        if ($row['type'] !== null && !in_array($row['type'], ['expense', 'income'], true)) api_fail('VALIDATION_ERROR', 'Jenis mutasi tidak valid.', 400);
        if ($row['error_message'] !== null && (!is_string($row['error_message']) || mb_strlen($row['error_message']) > 500)) api_fail('VALIDATION_ERROR', 'Pesan kesalahan mutasi terlalu panjang.', 400);
        if ($saving) {
            foreach (['category_id', 'matched_transaction_id'] as $field) {
                if (isset($row[$field])) valid_uuid((string) $row[$field]);
            }
        }
    }
    return $rows;
}

function normalized_description(?string $value): string
{
    return mb_strtolower(trim((string) preg_replace('/\s+/u', ' ', trim($value ?? ''))), 'UTF-8');
}

function import_preview(): never
{
    $user = require_user(['seller']);
    $body = raw_json(32 * 1024 * 1024);
    $rows = import_rows($body['rows'] ?? [], false);
    api_ok(match_preview_rows($rows, $user));
}

function match_preview_rows(array $rows, array $user): array
{
    if ($rows === []) api_fail('VALIDATION_ERROR', 'File tidak berisi transaksi.', 400);
    $token = current_token();
    $categories = view_rows('categories', ['select' => 'id,name,type', 'user_id' => 'eq.' . $user['id'], 'is_archived' => 'eq.false'], $token);
    if ($categories === []) api_fail('CATEGORY_REQUIRED', 'Buat minimal satu kategori aktif sebelum mengimpor.', 409);
    $rules = view_rows('category_rules', ['select' => 'id,category_id,keyword,type,created_at', 'user_id' => 'eq.' . $user['id']], $token);
    $dates = array_values(array_filter(array_column($rows, 'transaction_date')));
    sort($dates);
    $transactions = [];
    if ($dates !== []) {
        // Supabase/PostgREST defaults to 1000 rows; page through the date range.
        for ($offset = 0; ; $offset += 1000) {
            $chunk = view_rows('transactions', [
                'select' => 'id,transaction_date,amount,description,categories(type)',
                'user_id' => 'eq.' . $user['id'], 'is_deleted' => 'eq.false',
                'transaction_date' => 'gte.' . $dates[0],
                'and' => '(transaction_date.lte.' . $dates[count($dates) - 1] . ')',
                'order' => 'created_at.asc,id.asc', 'limit' => '1000', 'offset' => (string) $offset,
            ], $token);
            array_push($transactions, ...$chunk);
            if (count($chunk) < 1000) break;
        }
    }
    $active = array_fill_keys(array_column($categories, 'id'), true);
    $rules = array_values(array_filter($rules, fn($r) => isset($active[$r['category_id']])));
    usort($rules, fn($a, $b) => mb_strlen($b['keyword']) <=> mb_strlen($a['keyword']) ?: strcmp($a['created_at'], $b['created_at']) ?: strcmp($a['id'], $b['id']));
    $indexed = [];
    foreach ($transactions as $transaction) {
        $key = implode('|', [$transaction['transaction_date'], $transaction['amount'], $transaction['categories']['type'] ?? '', normalized_description($transaction['description'])]);
        $indexed[$key][] = $transaction['id'];
    }
    $output = [];
    foreach ($rows as $row) {
        $item = [...$row, 'category_id' => null, 'matched_transaction_id' => null, 'suggested_by_rule' => null];
        if ($row['status'] === 'error' || !$row['transaction_date'] || !$row['type'] || !$row['amount']) { $output[] = $item; continue; }
        $normalized = normalized_description($row['description']);
        $key = implode('|', [$row['transaction_date'], $row['amount'], $row['type'], $normalized]);
        if (!empty($indexed[$key])) {
            $item['status'] = 'matched';
            $item['matched_transaction_id'] = array_shift($indexed[$key]);
        } else {
            $item['status'] = 'new';
            foreach ($rules as $rule) {
                if ($rule['type'] === $row['type'] && str_contains($normalized, normalized_description($rule['keyword']))) {
                    $item['category_id'] = $rule['category_id'];
                    $item['suggested_by_rule'] = $rule['keyword'];
                    break;
                }
            }
        }
        $output[] = $item;
    }
    return ['rows' => $output, 'categories' => $categories];
}

function csv_date(string $value, string $bank): ?string
{
    $value = trim($value);
    $pattern = $bank === 'bank_a' ? '/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/D' : '/^(\d{4})-(\d{1,2})-(\d{1,2})$/D';
    if (!preg_match($pattern, $value, $match)) return null;
    $year = (int) ($bank === 'bank_a' ? $match[3] : $match[1]);
    $month = (int) $match[2];
    $day = (int) ($bank === 'bank_a' ? $match[1] : $match[3]);
    return checkdate($month, $day, $year) ? sprintf('%04d-%02d-%02d', $year, $month, $day) : null;
}

function csv_amount(string $value, string $bank): ?int
{
    $compact = preg_replace('/\s+/u', '', trim($value)) ?? '';
    if ($bank === 'bank_a') {
        if ($compact === '') return 0;
        if (!preg_match('/^([0-9]{1,3}(?:\.[0-9]{3})*|[0-9]+)(?:,([0-9]{2}))?$/D', $compact, $match)) return null;
        if (isset($match[2]) && $match[2] !== '00') return null;
        $number = str_replace('.', '', $match[1]);
    } else {
        if (!preg_match('/^[+-]?\d+$/D', $compact)) return null;
        $number = $compact;
    }
    if (strlen(ltrim($number, '+-0')) > 15) return null;
    $amount = (int) $number;
    return abs($amount) <= 9007199254740991 && ($bank === 'bank_a' || $amount !== 0) ? $amount : null;
}

function parse_bank_csv(string $text): array
{
    $text = preg_replace('/^\xEF\xBB\xBF/', '', $text) ?? $text;
    if (!mb_check_encoding($text, 'UTF-8')) api_fail('VALIDATION_ERROR', 'File CSV harus menggunakan UTF-8.', 400);
    $sample = substr($text, 0, 8192);
    if (str_contains($sample, 'Tanggal;Keterangan;Debet/Kredit;Nominal;Saldo')) {
        $bank = 'bank_a';
        $text = substr($text, strpos($text, 'Tanggal;Keterangan;Debet/Kredit;Nominal;Saldo'));
    } elseif (str_contains($sample, 'date,description,amount,balance')) $bank = 'bank_b';
    else api_fail('VALIDATION_ERROR', 'Format tidak dikenali. Gunakan CSV Bank A atau Bank B sesuai contoh.', 400);
    $stream = fopen('php://temp', 'w+');
    if (!$stream) api_fail('INTERNAL_ERROR', 'File belum dapat dibaca.', 500);
    fwrite($stream, $text); rewind($stream);
    $delimiter = $bank === 'bank_a' ? ';' : ',';
    fgetcsv($stream, 0, $delimiter, '"', '\\'); // Header.
    $index = 0; $rows = []; $occurrences = [];
    while (($cells = fgetcsv($stream, 0, $delimiter, '"', '\\')) !== false) {
        $index++;
        if (count($cells) === 1 && trim((string) $cells[0]) === '') continue;
        $rowNumber = $index + 1 + ($bank === 'bank_a' ? 4 : 0);
        if ($bank === 'bank_a') {
            if (count($cells) > 5) $cells = [$cells[0], implode(';', array_slice($cells, 1, -3)), ...array_slice($cells, -3)];
            if (!preg_match('/^\d{1,2}\/\d{1,2}\/\d{4}$/D', trim((string) ($cells[0] ?? '')))) continue;
            if (mb_strtoupper(trim((string) ($cells[1] ?? ''))) === 'SALDO AWAL') continue;
        }
        $date = csv_date((string) ($cells[0] ?? ''), $bank);
        $description = trim((string) ($cells[1] ?? '')) ?: null;
        $amount = null; $type = null; $error = $date ? null : 'Tanggal tidak valid.';
        if ($bank === 'bank_a') {
            $direction = mb_strtoupper(trim((string) ($cells[2] ?? '')));
            $parsed = csv_amount((string) ($cells[3] ?? ''), $bank);
            if ($parsed === null) $error ??= 'Nominal harus rupiah utuh; pecahan tidak dibulatkan.';
            elseif (!in_array($direction, ['DB', 'CR'], true) || $parsed === 0) $error ??= 'Kode Debet/Kredit harus DB atau CR dan nominal harus positif.';
            else { $type = $direction === 'DB' ? 'expense' : 'income'; $amount = $parsed; }
        } else {
            $signed = csv_amount((string) ($cells[2] ?? ''), $bank);
            if ($signed === null) $error ??= 'Amount harus bilangan bulat selain nol.';
            else { $type = $signed < 0 ? 'expense' : 'income'; $amount = abs($signed); }
        }
        if ($error || !$date || !$type || !$amount) {
            $rows[] = ['row_number' => $rowNumber, 'fingerprint' => "$bank|error|$rowNumber", 'transaction_date' => $date,
                'description' => $description, 'amount' => $amount, 'type' => $type, 'status' => 'error', 'error_message' => $error ?: 'Baris tidak valid.'];
        } else {
            $base = implode('|', [$bank, $date, $type, $amount, normalized_description($description)]);
            $occurrences[$base] = ($occurrences[$base] ?? 0) + 1;
            $rows[] = ['row_number' => $rowNumber, 'fingerprint' => $base . '|' . $occurrences[$base], 'transaction_date' => $date,
                'description' => $description, 'amount' => $amount, 'type' => $type, 'status' => 'new', 'error_message' => null];
        }
        if (count($rows) > 50_000) api_fail('VALIDATION_ERROR', 'Maksimal 50.000 baris per file.', 400);
    }
    fclose($stream);
    return ['bank' => $bank, 'rows' => $rows];
}

function import_preview_file(): never
{
    $user = require_user(['seller']);
    $file = $_FILES['file'] ?? null;
    if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file((string) $file['tmp_name'])) {
        api_fail('VALIDATION_ERROR', 'Pilih file CSV yang dapat dibaca.', 400);
    }
    if ((int) $file['size'] > 10 * 1024 * 1024) api_fail('VALIDATION_ERROR', 'Ukuran file maksimal 10 MB.', 400);
    $text = file_get_contents($file['tmp_name']);
    if ($text === false) api_fail('VALIDATION_ERROR', 'File belum dapat dibaca.', 400);
    $parsed = parse_bank_csv($text);
    api_ok(['bank' => $parsed['bank'], ...match_preview_rows($parsed['rows'], $user)]);
}

function imports(string $method): never
{
    $user = require_user(['seller']);
    $token = current_token();
    if ($method === 'GET') {
        api_ok(view_rows('bank_imports', ['select' => 'id,file_name,bank,new_count,matched_count,error_count,status,cancelled_at,created_at', 'user_id' => 'eq.' . $user['id'], 'order' => 'created_at.desc', 'limit' => '50'], $token));
    }
    if ($method === 'POST') {
        $body = raw_json(32 * 1024 * 1024);
        $file = trim((string) ($body['file_name'] ?? ''));
        $bank = $body['bank'] ?? '';
        if ($file === '' || mb_strlen($file) > 255 || !in_array($bank, ['bank_a', 'bank_b'], true)) api_fail('VALIDATION_ERROR', 'Nama file atau format bank tidak valid.', 400);
        $rows = import_rows($body['rows'] ?? [], true);
        foreach ($rows as $row) if ($row['status'] === 'new' && empty($row['category_id'])) api_fail('VALIDATION_ERROR', 'Pilih kategori untuk baris ' . $row['row_number'] . '.', 400);
        $rules = $body['rules'] ?? [];
        if (!is_array($rules) || count($rules) > 500) api_fail('VALIDATION_ERROR', 'Aturan kategori tidak valid.', 400);
        foreach ($rules as $rule) {
            if (!is_array($rule) || !is_string($rule['keyword'] ?? null) || mb_strlen(trim($rule['keyword'])) < 2 || mb_strlen(trim($rule['keyword'])) > 100 || !in_array($rule['type'] ?? null, ['expense', 'income'], true)) api_fail('VALIDATION_ERROR', 'Aturan kategori tidak valid.', 400);
            valid_uuid((string) ($rule['category_id'] ?? ''));
        }
        $result = supabase_rpc('save_bank_import', ['p_file_name' => $file, 'p_bank' => $bank, 'p_rows' => $rows, 'p_rules' => $rules], $token);
        if ($result['status'] !== 200) api_fail('INTERNAL_ERROR', 'Impor gagal disimpan. Tidak ada perubahan yang diterapkan.', 500);
        app_log('import.saved', ['result_count' => count($rows), 'outcome' => 'success']);
        api_ok(['id' => $result['data']], 201);
    }
    api_fail('METHOD_NOT_ALLOWED', 'Metode request tidak didukung.', 405);
}

function cancel_import(string $id): never
{
    require_user(['seller']);
    valid_uuid($id);
    $result = supabase_rpc('cancel_bank_import', ['p_import_id' => $id], current_token());
    if ($result['status'] !== 200) api_fail('INTERNAL_ERROR', 'Gagal membatalkan impor.', 500);
    app_log('import.cancelled', ['outcome' => 'success']);
    api_ok($result['data']);
}
