<?php
namespace App\Http\Controllers;

class OperationsController extends Controller
{
    public function health() { api_ok(['status'=>'ok','runtime'=>'laravel']); }
    public function roadRoute() { road_route(); }
    public function me() { api_ok(current_user()); }
    public function login() { sign_in(raw_json()); }
    public function logout() { sign_out(); }
    public function register() { sign_up(raw_json()); }
    public function activateAdmin() { activate_admin(raw_json()); }
    public function view(string $area) { page_data($area); }
    public function shipment(string $role, string $id) { shipment_detail_data($role,$id); }
    public function sellerTicket(string $awb) { seller_ticket($awb); }
    public function proof(string $id) { \TicketProof::download($id); }
    public function assistant() { admin_assistant(); }
    public function assistantAction() { admin_ticket_status(); }
    public function preview() { import_preview(); }
    public function previewFile() { import_preview_file(); }
    public function imports() { imports(request()->method()); }
    public function cancelImport(string $id) { cancel_import($id); }
    public function categories() { finance_categories(request()->method()); }
    public function category(string $id) { finance_category(request()->method(),$id); }
    public function transactions() { finance_transactions(request()->method()); }
    public function transaction(string $id) { finance_transaction(request()->method(),$id); }
    public function tracking(string $awb) { tracking_get($awb); }
    public function resolution(string $awb) { tracking_resolution($awb); }
    public function notifications(string $awb) { tracking_notifications($awb); }
    public function escalate(string $awb) { tracking_escalate($awb); }
}
