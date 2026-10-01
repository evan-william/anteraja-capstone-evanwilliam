<?php
declare(strict_types=1);

function seller_ticket(string $rawAwb): never
{
    $user = require_user(['seller']);
    $awb = validate_awb(rawurldecode($rawAwb));
    [$note, $file, $extension] = ticket_request();
    $token = current_token();
    $rows = view_rows('shipments', ['select' => 'id', 'tracking_number' => 'eq.' . $awb, 'user_id' => 'eq.' . $user['id'], 'limit' => '1'], $token);
    if ($rows === []) api_fail('NOT_FOUND', 'Kiriman tidak ditemukan di akun Seller ini.', 404);
    $result = supabase_rpc('create_seller_ticket', ['p_shipment_id' => $rows[0]['id'], 'p_note' => $note], $token);
    if ($result['status'] !== 200) api_fail('INTERNAL_ERROR', 'Tiket belum dapat dibuat. Coba lagi.', 500);
    ticket_response($result['data'], $file, $extension);
}

function admin_ticket_status(): never
{
    $user = require_user(['admin']);
    assistant_limit($user['id']);
    $body = raw_json();
    $id = valid_uuid((string) ($body['ticketId'] ?? ''));
    $status = $body['status'] ?? '';
    if (!in_array($status, ['in_progress', 'resolved'], true)) api_fail('VALIDATION_ERROR', 'Pilihan tindakan tidak valid.', 400);
    $token = current_token();
    $rows = view_rows('support_tickets', ['select' => 'id,ticket_number,status', 'id' => 'eq.' . $id, 'limit' => '1'], $token);
    if ($rows === []) api_fail('NOT_FOUND', 'Tiket tidak ditemukan.', 404);
    $ticket = $rows[0];
    if (($status === 'in_progress' && $ticket['status'] !== 'open') || ($status === 'resolved' && $ticket['status'] !== 'in_progress')) {
        api_fail('CONFLICT', 'Status tiket sudah berubah. Muat ulang daftar sebelum bertindak.', 409);
    }
    $result = supabase_rpc('admin_update_ticket_status', ['p_ticket_id' => $id, 'p_status' => $status], $token);
    if ($result['status'] !== 200) api_fail('CONFLICT', 'Status tiket tidak berubah. Periksa tiket di daftar lalu coba lagi.', 409);
    app_log('ticket.status_changed', ['outcome' => $status]);
    api_ok(['ticketNumber' => $ticket['ticket_number'], 'status' => $status]);
}
