<?php
declare(strict_types=1);
require __DIR__.'/common.php';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!is_string($_POST['csrf'] ?? null) || !hash_equals($_SESSION['csrf'], $_POST['csrf'])) {
        http_response_code(403); pageStart('Akses ditolak'); echo '<h1>Token tidak valid.</h1>'; pageEnd(); exit;
    }
    unset($_SESSION['shipment_requests']); $_SESSION['notice'] = 'Riwayat sesi berhasil dikosongkan.';
    header('Location: request-history.php', true, 303); exit;
}
pageStart('Kosongkan riwayat');
echo '<h1>Kosongkan riwayat sesi?</h1><section class="panel"><p>Semua permintaan sesi ini dihapus. Riwayat browser lain tidak berubah.</p><form method="POST"><input type="hidden" name="csrf" value="'.e($_SESSION['csrf']).'"><button>Ya, kosongkan riwayat</button></form><p><a href="request-history.php">Batal</a></p></section>'; pageEnd();
