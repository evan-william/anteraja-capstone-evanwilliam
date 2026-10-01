<?php
declare(strict_types=1);

const CATEGORY_FIELDS = 'id,user_id,name,type,is_archived,created_at,updated_at';
const TRANSACTION_FIELDS = 'id,user_id,category_id,amount,description,transaction_date,is_deleted,created_at,updated_at';

function valid_uuid(string $value): string
{
    if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iD', $value)) {
        api_fail('VALIDATION_ERROR', 'ID tidak valid.', 400);
    }
    return $value;
}

function single_result(array $result, string $failure, string $missing): array
{
    if ($result['status'] >= 400 || $result['status'] === 0) api_fail('INTERNAL_ERROR', $failure, 500);
    $item = $result['data'][0] ?? null;
    if (!is_array($item)) api_fail('NOT_FOUND', $missing, 404);
    return $item;
}

function category_input(array $body, bool $update = false): array
{
    $output = [];
    if (!$update || array_key_exists('name', $body)) {
        $name = $body['name'] ?? null;
        if (!is_string($name) || trim($name) === '') api_fail('VALIDATION_ERROR', 'Nama kategori wajib diisi.', 400);
        if (mb_strlen(trim($name)) > 30) api_fail('VALIDATION_ERROR', 'Nama kategori maksimal 30 karakter.', 400);
        $output['name'] = trim($name);
    }
    if (!$update) {
        if (!in_array($body['type'] ?? null, ['expense', 'income'], true)) api_fail('VALIDATION_ERROR', 'Jenis kategori harus pengeluaran atau pemasukan.', 400);
        $output['type'] = $body['type'];
    }
    if ($update && array_key_exists('is_archived', $body)) {
        if (!is_bool($body['is_archived'])) api_fail('VALIDATION_ERROR', 'Status arsip tidak valid.', 400);
        $output['is_archived'] = $body['is_archived'];
    }
    if ($update && $output === []) api_fail('VALIDATION_ERROR', 'Tidak ada perubahan yang dikirim.', 400);
    return $output;
}

function category_conflict(array $result): void
{
    if (($result['data']['code'] ?? '') === '23505') api_fail('CONFLICT', 'Kategori dengan nama itu sudah ada.', 409);
}

function finance_categories(string $method): never
{
    $user = require_user(['seller']);
    $token = current_token();
    if ($method === 'GET') {
        $query = ['select' => CATEGORY_FIELDS, 'user_id' => 'eq.' . $user['id'], 'order' => 'type.asc,name.asc'];
        $status = $_GET['status'] ?? '';
        if ($status === 'active') $query['is_archived'] = 'eq.false';
        if ($status === 'archived') $query['is_archived'] = 'eq.true';
        $result = supabase_table('categories', $query, $token);
        if ($result['status'] !== 200) api_fail('INTERNAL_ERROR', 'Gagal mengambil daftar kategori.', 500);
        api_ok($result['data']);
    }
    if ($method === 'POST') {
        $input = category_input(raw_json());
        $result = supabase_mutate('POST', 'categories', ['select' => CATEGORY_FIELDS], ['user_id' => $user['id'], ...$input], $token);
        category_conflict($result);
        $row = single_result($result, 'Gagal membuat kategori.', 'Kategori tidak ditemukan.');
        app_log('finance.category_created', ['outcome' => 'success']);
        api_ok($row, 201);
    }
    api_fail('METHOD_NOT_ALLOWED', 'Metode request tidak didukung.', 405);
}

function finance_category(string $method, string $id): never
{
    $user = require_user(['seller']);
    valid_uuid($id);
    $token = current_token();
    $query = ['id' => 'eq.' . $id, 'user_id' => 'eq.' . $user['id']];
    if ($method === 'PATCH') {
        $input = category_input(raw_json(), true);
        $result = supabase_mutate('PATCH', 'categories', [...$query, 'select' => CATEGORY_FIELDS], $input, $token);
        category_conflict($result);
        $row = single_result($result, 'Gagal mengubah kategori.', 'Kategori tidak ditemukan.');
        app_log('finance.category_updated', ['outcome' => 'success']);
        api_ok($row);
    }
    if ($method === 'DELETE') {
        $used = supabase_table('transactions', ['select' => 'id', 'user_id' => 'eq.' . $user['id'], 'category_id' => 'eq.' . $id, 'limit' => '1'], $token);
        if ($used['status'] !== 200) api_fail('INTERNAL_ERROR', 'Gagal memeriksa pemakaian kategori.', 500);
        if (($used['data'] ?? []) !== []) api_fail('CONFLICT', 'Kategori ini sudah dipakai transaksi. Arsipkan saja, jangan dihapus.', 409);
        $result = supabase_mutate('DELETE', 'categories', [...$query, 'select' => 'id'], null, $token);
        $row = single_result($result, 'Gagal menghapus kategori.', 'Kategori tidak ditemukan.');
        app_log('finance.category_deleted', ['outcome' => 'success']);
        api_ok(['id' => $row['id']]);
    }
    api_fail('METHOD_NOT_ALLOWED', 'Metode request tidak didukung.', 405);
}

function transaction_input(array $body, bool $update = false): array
{
    $output = [];
    if (!$update || array_key_exists('category_id', $body)) $output['category_id'] = valid_uuid((string) ($body['category_id'] ?? ''));
    if (!$update || array_key_exists('amount', $body)) {
        $amount = $body['amount'] ?? null;
        if (!is_int($amount) || $amount <= 0 || $amount > 9007199254740991) api_fail('VALIDATION_ERROR', 'Nominal harus rupiah utuh dan lebih besar dari nol.', 400);
        $output['amount'] = $amount;
    }
    if (array_key_exists('description', $body)) {
        if (!is_string($body['description']) || mb_strlen(trim($body['description'])) > 200) api_fail('VALIDATION_ERROR', 'Deskripsi maksimal 200 karakter.', 400);
        $output['description'] = trim($body['description']) ?: null;
    }
    if (!$update || array_key_exists('transaction_date', $body)) {
        $date = (string) ($body['transaction_date'] ?? '');
        $valid = preg_match('/^\d{4}-\d{2}-\d{2}$/D', $date) && DateTimeImmutable::createFromFormat('!Y-m-d', $date)?->format('Y-m-d') === $date;
        if (!$valid) api_fail('VALIDATION_ERROR', 'Format tanggal harus YYYY-MM-DD.', 400);
        $output['transaction_date'] = $date;
    }
    if ($update && array_key_exists('is_deleted', $body)) {
        if (!is_bool($body['is_deleted'])) api_fail('VALIDATION_ERROR', 'Status transaksi tidak valid.', 400);
        $output['is_deleted'] = $body['is_deleted'];
    }
    if ($update && $output === []) api_fail('VALIDATION_ERROR', 'Tidak ada perubahan yang dikirim.', 400);
    return $output;
}

function validate_owned_category(string $id, array $user, string $token): void
{
    $result = supabase_table('categories', ['select' => 'id,is_archived', 'id' => 'eq.' . $id, 'user_id' => 'eq.' . $user['id'], 'limit' => '1'], $token);
    if ($result['status'] !== 200) api_fail('INTERNAL_ERROR', 'Gagal memeriksa kategori.', 500);
    $row = $result['data'][0] ?? null;
    if (!$row) api_fail('VALIDATION_ERROR', 'Kategori tidak ditemukan.', 400);
    if ($row['is_archived']) api_fail('VALIDATION_ERROR', 'Kategori itu sudah diarsipkan.', 400);
}

function finance_transactions(string $method): never
{
    $user = require_user(['seller']);
    $token = current_token();
    if ($method === 'GET') {
        $limit = filter_var($_GET['limit'] ?? 50, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ?: 50;
        $result = supabase_table('transactions', ['select' => TRANSACTION_FIELDS . ',categories(id,name,type)', 'user_id' => 'eq.' . $user['id'], 'is_deleted' => 'eq.false', 'order' => 'transaction_date.desc,created_at.desc', 'limit' => min($limit, 200)], $token);
        if ($result['status'] !== 200) api_fail('INTERNAL_ERROR', 'Gagal mengambil daftar transaksi.', 500);
        api_ok($result['data']);
    }
    if ($method === 'POST') {
        $input = transaction_input(raw_json());
        validate_owned_category($input['category_id'], $user, $token);
        $result = supabase_mutate('POST', 'transactions', ['select' => TRANSACTION_FIELDS], ['user_id' => $user['id'], ...$input], $token);
        $row = single_result($result, 'Gagal menyimpan transaksi.', 'Transaksi tidak ditemukan.');
        app_log('finance.transaction_created', ['outcome' => 'success']);
        api_ok($row, 201);
    }
    api_fail('METHOD_NOT_ALLOWED', 'Metode request tidak didukung.', 405);
}

function finance_transaction(string $method, string $id): never
{
    $user = require_user(['seller']);
    valid_uuid($id);
    $token = current_token();
    $query = ['id' => 'eq.' . $id, 'user_id' => 'eq.' . $user['id'], 'select' => TRANSACTION_FIELDS];
    if ($method === 'PATCH') {
        $input = transaction_input(raw_json(), true);
        if (isset($input['category_id'])) validate_owned_category($input['category_id'], $user, $token);
        $result = supabase_mutate('PATCH', 'transactions', $query, $input, $token);
        $row = single_result($result, 'Gagal mengubah transaksi.', 'Transaksi tidak ditemukan.');
        app_log('finance.transaction_updated', ['outcome' => 'success']);
        api_ok($row);
    }
    if ($method === 'DELETE') {
        $result = supabase_mutate('PATCH', 'transactions', [...$query, 'select' => 'id'], ['is_deleted' => true], $token);
        $row = single_result($result, 'Gagal menghapus transaksi.', 'Transaksi tidak ditemukan.');
        app_log('finance.transaction_deleted', ['outcome' => 'success']);
        api_ok(['id' => $row['id']]);
    }
    api_fail('METHOD_NOT_ALLOWED', 'Metode request tidak didukung.', 405);
}
