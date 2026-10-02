<?php
declare(strict_types=1);

// PDO menjalankan SQL mentah; tidak memuat Laravel atau Eloquent.
$root = dirname(__DIR__, 2);
$db = new PDO('sqlite::memory:');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
$db->exec(file_get_contents(__DIR__ . '/schema.sql'));
$db->exec(file_get_contents(__DIR__ . '/seed.sql'));
$sqlSource = file_get_contents(__DIR__ . '/queries.sql');
preg_match_all('/^-- (Q\d+) \| ([^\r\n]+)\R(.*?)(?=^-- Q\d+ \||\z)/ms', $sqlSource, $matches, PREG_SET_ORDER);
if (count($matches) !== 8) throw new RuntimeException('Delapan query harus terdeteksi.');
$queries = [];
foreach ($matches as $match) {
    $queries[$match[1]] = [
        'title' => trim($match[2]), 'sql' => trim($match[3]),
        'rows' => $db->query(trim($match[3]))->fetchAll(),
    ];
}

$tests = [];
function check(bool $condition, string $name): void {
    global $tests;
    if (!$condition) throw new RuntimeException('FAIL: ' . $name);
    $tests[] = 'PASS: ' . $name;
}
function rejects(PDO $db, string $sql, string $name): void {
    $db->beginTransaction();
    $rejected = false;
    try { $db->exec($sql); } catch (PDOException) { $rejected = true; }
    finally { $db->rollBack(); }
    check($rejected, $name);
}

check((int) $db->query('SELECT COUNT(*) FROM shipments')->fetchColumn() === 20, '20 shipment dummy');
check((int) $db->query('SELECT COUNT(*) FROM couriers')->fetchColumn() === 5, '5 courier dummy');
check((int) $db->query('PRAGMA foreign_keys')->fetchColumn() === 1, 'foreign key aktif');
check($db->query('PRAGMA foreign_key_check')->fetchAll() === [], 'tidak ada orphan foreign key');
check($db->query('PRAGMA integrity_check')->fetchColumn() === 'ok', 'integritas SQLite');

$transit = $queries['Q01']['rows'];
check(count($transit) === 8, 'Q01 hanya 8 in_transit');
check(array_unique(array_column($transit, 'status')) === ['in_transit'], 'Q01 status tepat');
$weights = array_column($transit, 'weight_kg');
$sorted = $weights; rsort($sorted, SORT_NUMERIC);
check($weights === $sorted && (float) $weights[0] === 12.0, 'Q01 berat descending');
$sizes = array_column($queries['Q02']['rows'], 'size_category', 'id');
check(count($sizes) === 20, 'Q02 seluruh shipment');
check($sizes[2] === 'Small', 'CASE batas 1 kg Small');
check($sizes[3] === 'Medium', 'CASE 1.001 kg Medium');
check($sizes[4] === 'Medium', 'CASE batas 5 kg Medium');
check($sizes[5] === 'Large', 'CASE 5.001 kg Large');
$sizeCounts = array_count_values($sizes);
check($sizeCounts === ['Small' => 6, 'Medium' => 8, 'Large' => 6], 'CASE distribusi 6/8/6');

$monthly = array_map('intval', array_column($queries['Q03']['rows'], 'total_shipments_this_month', 'courier_id'));
check($monthly === [1 => 6, 2 => 4, 3 => 3, 4 => 2, 5 => 0], 'Q03 jumlah bulan ini 6/4/3/2/0');
check(array_sum($monthly) === 15, 'Q03 total bulan ini 15');
$bounds = $db->query("SELECT datetime('now', 'start of month') AS first, datetime('now', 'start of month', '+1 month') AS next")->fetch();
$monthSql = "SELECT id FROM shipments WHERE created_at >= '{$bounds['first']}' AND created_at < '{$bounds['next']}' ORDER BY id";
$monthIds = array_map('intval', $db->query($monthSql)->fetchAll(PDO::FETCH_COLUMN));
check(in_array(1, $monthIds, true), 'bulan mencakup tepat batas awal');
check(!in_array(16, $monthIds, true), 'bulan menolak satu detik sebelum awal');
check(!in_array(20, $monthIds, true), 'bulan menolak tepat awal bulan depan');
check($monthIds === range(1, 15), 'bulan tidak mencampur bulan sebelumnya/depan');

$average = array_column($queries['Q04']['rows'], null, 'status');
check(count($average) === 3, 'Q04 tiga status');
foreach (['pending', 'in_transit', 'delivered'] as $status) {
    // cross-check rata-rata dengan aritmetika PHP, bukan SQL agregasi yang sama.
    $statement = $db->prepare('SELECT weight_kg FROM shipments WHERE status = ?');
    $statement->execute([$status]);
    $values = array_map('floatval', $statement->fetchAll(PDO::FETCH_COLUMN));
    check((int) $average[$status]['total_shipments'] === count($values), 'Q04 count ' . $status);
    check(abs((float) $average[$status]['average_weight_kg'] - round(array_sum($values) / count($values), 3)) < 0.00001, 'Q04 AVG ' . $status);
}
check(array_map('intval', array_column($queries['Q05']['rows'], 'courier_id')) === [1, 2, 3], 'HAVING N=4 menghasilkan 3 kurir');
$boundaryHaving = str_replace('VALUES (4)', 'VALUES (6)', $queries['Q05']['sql']);
check(array_map('intval', array_column($db->query($boundaryHaving)->fetchAll(), 'courier_id')) === [1], 'HAVING lebih dari 6, bukan lebih dari atau sama');
$emptyHaving = str_replace('VALUES (4)', 'VALUES (20)', $queries['Q05']['sql']);
check($db->query($emptyHaving)->fetchAll() === [], 'HAVING N=20 hasil kosong yang valid');
$allCouriers = array_map('intval', array_column($queries['Q06']['rows'], 'total_shipments', 'courier_id'));
check($allCouriers === [1 => 7, 2 => 6, 3 => 5, 4 => 2, 5 => 0], 'LEFT JOIN 7/6/5/2/0');
check(array_sum($allCouriers) === 20, 'LEFT JOIN total sama dengan jumlah shipment');
check(count($queries['Q07']['rows']) === 20, 'INNER JOIN memuat seluruh 20 shipment');
check($queries['Q07']['rows'][0]['courier_name'] === 'Dimas Pratama', 'INNER JOIN relasi kurir tepat');
check($queries['Q08']['rows'] === [['courier_id' => 5, 'courier_name' => 'Bima Santoso']], 'NOT EXISTS kurir kosong tepat');

rejects($db, "INSERT INTO shipments SELECT 100, 'ANT-INVALID', 1, 'pending', 999, created_at, updated_at FROM shipments LIMIT 1", 'courier invalid ditolak');
rejects($db, "INSERT INTO shipments SELECT 100, tracking_number, 1, 'pending', 1, created_at, updated_at FROM shipments LIMIT 1", 'tracking number duplikat ditolak');
rejects($db, "UPDATE shipments SET weight_kg = 0 WHERE id = 1", 'berat nol ditolak');
rejects($db, "UPDATE shipments SET status = 'unknown' WHERE id = 1", 'status di luar kontrak ditolak');
rejects($db, 'DELETE FROM couriers WHERE id = 1', 'kurir terpakai tidak dapat dihapus');

$generatedAt = gmdate('Y-m-d\TH:i:s\Z');
$meta = [
    'generated_at_utc' => $generatedAt,
    'sqlite_version' => $db->query('SELECT sqlite_version()')->fetchColumn(),
    'month_start_utc' => $bounds['first'], 'next_month_start_utc' => $bounds['next'],
    'couriers' => 5, 'shipments' => 20, 'tests_passed' => count($tests),
];
$descriptions = [
    'Q01' => 'Menampilkan kiriman in_transit dari berat terbesar dengan ID sebagai pemecah urutan jika berat sama.',
    'Q02' => 'Mengelompokkan berat menjadi Small (<=1 kg), Medium (>1 sampai 5 kg), atau Large (>5 kg).',
    'Q03' => 'Menghitung shipment yang dibuat pada bulan kalender UTC berjalan per kurir, termasuk kurir dengan hasil nol.',
    'Q04' => 'Menghitung jumlah dan rata-rata berat semua shipment per status dengan tiga digit desimal.',
    'Q05' => 'Menampilkan kurir dengan jumlah shipment seluruh periode lebih dari N=4 menggunakan HAVING.',
    'Q06' => 'Mempertahankan semua kurir dengan LEFT JOIN dan menghitung shipment terkait, termasuk nol.',
    'Q07' => 'Menggabungkan setiap shipment dengan nama kurir yang direferensikan melalui INNER JOIN.',
    'Q08' => 'Menemukan kurir yang tidak memiliki shipment sama sekali menggunakan NOT EXISTS.',
];
function markdownTable(array $rows): string {
    if ($rows === []) return '(0 baris)\n';
    $keys = array_keys($rows[0]);
    $text = '| ' . implode(' | ', $keys) . " |\n| " . implode(' | ', array_fill(0, count($keys), '---')) . " |\n";
    foreach ($rows as $row) $text .= '| ' . implode(' | ', array_map(static fn($value) => str_replace(['|', "\n"], ['\\|', ' '], (string) $value), array_values($row))) . " |\n";
    return $text;
}
$docs = $root . '/docs';
if (!is_dir($docs) && !mkdir($docs, 0775, true)) throw new RuntimeException('Folder docs tidak dapat dibuat.');
$output = __DIR__ . '/results';
if (!is_dir($output) && !mkdir($output, 0775, true)) throw new RuntimeException('Folder results tidak dapat dibuat.');
$md = "# SQL: Analisis Data Pengiriman\n\n";
$md .= "Query SQL mentah dijalankan melalui PDO SQLite, tanpa Eloquent; seluruh tabel di bawah adalah output eksekusi nyata.\n\n";
$md .= "- Branch: https://github.com/evan-william/anteraja-capstone-evanwilliam/tree/feature/sql-analysis\n";
$md .= "- Eksekusi UTC: $generatedAt; SQLite {$meta['sqlite_version']}.\n";
$md .= "- Database latihan: 5 kurir, 20 kiriman, 3 status, 15 kiriman bulan ini.\n";
$md .= "- Rentang bulan: `{$bounds['first']}` inklusif sampai `{$bounds['next']}` eksklusif.\n";
$md .= "- Schema diimpor ulang dari struktur latihan Laravel CRUD sebelumnya; Supabase dan database sebelumnya tidak diubah.\n\n";
$md .= "## Data dan asumsi\n\nSchema mempertahankan nama kolom, relasi, dan tiga status latihan sebelumnya, dengan CHECK tambahan untuk berat/status/rating. Fixture memasukkan batas 1 kg dan 5 kg, bulan sebelumnya, batas awal bulan depan, serta Bima Santoso tanpa shipment. Data bulan depan merupakan fixture batas tanggal, bukan klaim pengiriman nyata. Bulan ini berarti bulan penuh menurut `created_at`, bukan hanya month-to-date atau tanggal delivered.\n\n";
foreach ($queries as $id => $query) {
    $md .= "## $id - {$query['title']}\n\n{$descriptions[$id]}\n\n```sql\n{$query['sql']}\n```\n\nHasil nyata (" . count($query['rows']) . " baris):\n\n" . markdownTable($query['rows']) . "\n";
}
$md .= "## Mengapa query ini benar\n\n";
$md .= "- `WHERE` menyaring baris sebelum agregasi; `HAVING` menyaring hasil grup setelah agregasi. N dapat diubah pada `VALUES (4)`; ini query SQL lengkap tanpa placeholder yang belum diisi.\n";
$md .= "- `GROUP BY c.id, c.name` mencantumkan seluruh kolom non-agregat dan tidak menggabungkan dua kurir yang namanya sama.\n";
$md .= "- `COUNT(s.id)` menghasilkan nol untuk kurir kosong; `COUNT(*)` pada LEFT JOIN akan salah menghitung satu baris NULL sebagai satu shipment.\n";
$md .= "- Filter tanggal Q03 ditempatkan pada `ON` agar kurir tanpa kiriman bulan ini tetap muncul; batas awal inklusif/akhir eksklusif menangani pergantian bulan/tahun.\n";
$md .= "- `AVG` memakai berat numerik, bukan penjumlahan yang dibagi jumlah status; pembulatan hanya untuk hasil tampilan.\n\n";
$md .= "## Perbandingan Eloquent (referensi, bukan jalur eksekusi)\n\nContoh ekuivalen Q03 memakai correlated count; bentuk SQL bisa berbeda, tetapi hasil yang diharapkan sama. Contoh ini tidak dijalankan pada latihan SQL mentah.\n\n```php\n";
$md .= <<<'EXAMPLE'
$start = now('UTC')->startOfMonth();
$end = $start->copy()->addMonth();
$couriers = Courier::query()
    ->withCount(['shipments as total_shipments_this_month' => function ($query) use ($start, $end) {
        $query->where('created_at', '>=', $start)
            ->where('created_at', '<', $end);
    }])
    ->orderByDesc('total_shipments_this_month')
    ->orderBy('id')
    ->get();
EXAMPLE;
$md .= "\n```\n\nJangan melakukan `Courier::all()` lalu query jumlah dalam loop (N+1). Rentang tanggal langsung pada kolom lebih cocok untuk pemanfaatan indeks daripada membungkus setiap tanggal dengan fungsi month. Query plan dan ukuran data tetap perlu diukur sebelum menyatakan percepatan.\n\n";
$md .= "## Cara menjalankan\n\nDari root repository: `& C:\\xampp\\php\\php.exe exercises/sql-analysis/run.php`. Script membuat database baru di memori dan menghasilkan ulang dokumen/output; tidak menghapus database lama. Tambahkan `--save-db` untuk menyimpan analysis.sqlite jika file itu belum ada. Semua query ada di `exercises/sql-analysis/queries.sql`. Dialek tanggal SQLite tidak dapat ditempel langsung ke PostgreSQL/MySQL tanpa adaptasi.\n\n";
$md .= "## Pengujian aktual\n\n" . count($tests) . " pemeriksaan lulus:\n\n```text\n" . implode("\n", $tests) . "\n```\n\n";
$md .= "## Git dan review\n\nMinimal tiga commit modular disiapkan untuk fixture, query/pengujian, dan dokumentasi. Bukti hash aktual disimpan pada paket pengumpulan Day 15. Reviewer tidak diminta sesuai arahan pemilik; review persetujuan dan merge tidak diklaim telah dilakukan.\n\n";
$md .= "## Referensi\n\n- [SQLite SELECT, JOIN, GROUP BY dan HAVING](https://www.sqlite.org/lang_select.html)\n- [SQLite date/time dan UTC](https://www.sqlite.org/lang_datefunc.html)\n";
foreach ([
    $docs . '/sql-queries.md' => $md,
    $output . '/query-results.json' => json_encode(['metadata' => $meta, 'queries' => $queries, 'tests' => $tests], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR) . "\n",
    $output . '/query-results.txt' => "SQL ANALYSIS - EXECUTED OUTPUT\n" . json_encode($meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n" . $md,
] as $file => $content) {
    if (file_put_contents($file, $content) === false) throw new RuntimeException('Output tidak dapat disimpan: ' . $file);
}
if (in_array('--save-db', $argv, true)) {
    $path = __DIR__ . '/analysis.sqlite';
    if (file_exists($path)) throw new RuntimeException('analysis.sqlite sudah ada; tidak ditimpa. Jalankan tanpa --save-db untuk uji di memori.');
    $db->exec('VACUUM INTO ' . $db->quote($path));
    echo "Database latihan tersimpan: $path\n";
}
echo count($queries) . ' query berjalan; ' . count($tests) . " pemeriksaan PASS.\n";
foreach ($queries as $id => $query) echo "$id: " . count($query['rows']) . " baris\n";
echo "Dokumentasi: docs/sql-queries.md\n";
