<?php
declare(strict_types=1);

function view_rows(string $table, array $query, string $token): array
{
    $result = supabase_table($table, $query, $token);
    if ($result['status'] !== 200 || !is_array($result['data'])) {
        api_fail('INTERNAL_ERROR', 'Data belum dapat dimuat. Periksa koneksi lalu coba lagi.', 500);
    }
    return $result['data'];
}

function view_all_rows(string $table, array $query, string $token): array
{
    $rows = [];
    for ($offset = 0; ; $offset += 1000) {
        $chunk = view_rows($table, [...$query, 'limit' => '1000', 'offset' => (string) $offset], $token);
        array_push($rows, ...$chunk);
        if (count($chunk) < 1000) return $rows;
    }
}

function shipment_related(string $id, string $token): array
{
    $results = supabase_read_many([
        'events' => ['table' => 'shipment_events', 'query' => ['select' => '*', 'shipment_id' => 'eq.' . $id, 'order' => 'occurred_at.desc', 'limit' => '50']],
        'resolutions' => ['table' => 'shipment_resolutions', 'query' => ['select' => '*', 'shipment_id' => 'eq.' . $id, 'order' => 'submitted_at.desc', 'limit' => '20']],
        'tickets' => ['table' => 'support_tickets', 'query' => ['select' => '*', 'shipment_id' => 'eq.' . $id, 'order' => 'created_at.desc', 'limit' => '20']],
    ], $token);
    $rows = [];
    foreach ($results as $key => $result) {
        if ($result['status'] !== 200 || !is_array($result['data'])) api_fail('INTERNAL_ERROR', 'Data belum dapat dimuat. Periksa koneksi lalu coba lagi.', 500);
        $rows[$key] = $result['data'];
    }
    return $rows;
}

function page_data(string $page): never
{
    $user = require_user();
    $token = current_token();
    $id = $user['id'];
    if ($page === 'consumer') {
        require_user(['consumer']);
        $result = supabase_rpc('get_my_shipments', [], $token);
        if ($result['status'] !== 200) api_fail('INTERNAL_ERROR', 'Paket belum dapat dimuat.', 500);
        api_ok(['shipments' => $result['data'] ?? []]);
    }
    if ($page === 'seller') {
        require_user(['seller']);
        $shipments = view_rows('shipments', ['select' => 'id,tracking_number,service_type,risk_status,origin_city,destination_city,current_location,exception_reason,estimated_delivery_at', 'user_id' => 'eq.' . $id, 'delivery_status' => 'not.in.(delivered,returned,cancelled)', 'order' => 'estimated_delivery_at.asc', 'limit' => '100'], $token);
        $settlements = supabase_count('settlements', ['user_id' => 'eq.' . $id], $token);
        api_ok(['shipments' => $shipments, 'settlementCount' => $settlements]);
    }
    if ($page === 'seller-shipments') {
        require_user(['seller']);
        api_ok(['shipments' => view_all_rows('shipments', ['select' => 'id,tracking_number,service_type,delivery_status,risk_status,recipient_name,destination_city,estimated_delivery_at,last_scan_at,exception_reason,current_location', 'user_id' => 'eq.' . $id, 'delivery_status' => 'not.in.(delivered,returned,cancelled)', 'order' => 'estimated_delivery_at.asc'], $token)]);
    }
    if ($page === 'admin') {
        require_user(['admin']);
        api_ok(['shipments' => view_rows('shipments', ['select' => 'id,tracking_number,service_type,delivery_status,risk_status,destination_city,current_location,exception_reason,estimated_delivery_at', 'delivery_status' => 'not.in.(delivered,returned,cancelled)', 'order' => 'estimated_delivery_at.asc', 'limit' => '500'], $token)]);
    }
    if ($page === 'admin-shipments') {
        require_user(['admin']);
        $query = ['select' => 'id,tracking_number,service_type,delivery_status,risk_status,recipient_name,destination_city,current_location,estimated_delivery_at', 'order' => 'created_at.desc'];
        $risk = (string) request()->query('risiko', 'all');
        if (in_array($risk, ['action_required', 'at_risk', 'on_track', 'resolved'], true)) $query['risk_status'] = 'eq.' . $risk;
        $q = preg_replace('/[^a-zA-Z0-9\s-]/', '', (string) request()->query('q', ''));
        $q = trim(substr($q ?? '', 0, 40));
        if ($q !== '') $query['or'] = '(tracking_number.ilike.*' . $q . '*,recipient_name.ilike.*' . $q . '*,destination_city.ilike.*' . $q . '*)';
        $number = min(max((int) request()->query('halaman', 1), 1), 1000);
        $pageQuery = [...$query, 'limit' => '25', 'offset' => (string) (($number - 1) * 25)];
        $result = supabase_request('GET', '/rest/v1/shipments?' . http_build_query($pageQuery, '', '&', PHP_QUERY_RFC3986), null, ['Prefer: count=exact'], $token);
        if (!in_array($result['status'], [200, 206], true) || !is_array($result['data'])) api_fail('INTERNAL_ERROR', 'Data belum dapat dimuat. Periksa koneksi lalu coba lagi.', 500);
        $count = supabase_result_count($result);
        $rows = $result['data'];
        api_ok(['shipments' => $rows, 'count' => $count, 'page' => $number]);
    }
    if ($page === 'tickets') {
        require_user(['admin']);
        $tickets = view_rows('support_tickets', ['select' => 'id,shipment_id,ticket_number,status,customer_note,response_due_at,created_at,shipments(tracking_number,destination_city)', 'order' => 'created_at.desc', 'limit' => '100'], $token);
        foreach ($tickets as &$ticket) $ticket['proof_available'] = TicketProof::existingPath((string) $ticket['id']) !== null;
        unset($ticket);
        api_ok(['tickets' => $tickets]);
    }
    if ($page === 'import') {
        require_user(['seller']);
        api_ok([
            'categories' => view_rows('categories', ['select' => 'id,name,type', 'user_id' => 'eq.' . $id, 'is_archived' => 'eq.false', 'order' => 'name.asc'], $token),
            'history' => view_rows('bank_imports', ['select' => 'id,file_name,bank,new_count,matched_count,error_count,status,cancelled_at,created_at', 'user_id' => 'eq.' . $id, 'order' => 'created_at.desc', 'limit' => '50'], $token),
        ]);
    }
    api_fail('NOT_FOUND', 'Halaman data tidak ditemukan.', 404);
}

function shipment_detail_data(string $scope, string $key): never
{
    $user = require_user([$scope]);
    $token = current_token();
    if ($scope === 'admin') {
        valid_uuid($key);
        $query = ['select' => '*', 'id' => 'eq.' . $key, 'limit' => '1'];
    } else {
        $query = ['select' => '*', 'tracking_number' => 'eq.' . validate_awb(rawurldecode($key)), 'user_id' => 'eq.' . $user['id'], 'limit' => '1'];
    }
    $shipment = view_rows('shipments', $query, $token)[0] ?? null;
    if (!$shipment) api_fail('NOT_FOUND', 'Kiriman tidak ditemukan.', 404);
    api_ok(['shipment' => $shipment, ...shipment_related($shipment['id'], $token)]);
}
