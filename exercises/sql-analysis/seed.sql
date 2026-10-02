-- data dummy; 15 kiriman bulan ini, 4 bulan lalu, 1 bulan depan, 1 kurir kosong.
BEGIN TRANSACTION;
INSERT INTO couriers (id, name, rating, created_at, updated_at) VALUES
    (1, 'Dimas Pratama', 4.80, datetime('now'), datetime('now')),
    (2, 'Ayu Lestari', 4.90, datetime('now'), datetime('now')),
    (3, 'Rizky Saputra', 4.70, datetime('now'), datetime('now')),
    (4, 'Nadia Putri', 4.85, datetime('now'), datetime('now')),
    (5, 'Bima Santoso', 4.60, datetime('now'), datetime('now'));
INSERT INTO shipments
    (id, tracking_number, weight_kg, status, courier_id, created_at, updated_at)
VALUES
    (1, 'ANT-SQL-0001', 0.500, 'pending', 1, datetime('now', 'start of month'), datetime('now')),
    (2, 'ANT-SQL-0002', 1.000, 'in_transit', 1, datetime('now', 'start of month', '+1 hour'), datetime('now')),
    (3, 'ANT-SQL-0003', 1.001, 'delivered', 1, datetime('now', 'start of month', '+2 hours'), datetime('now')),
    (4, 'ANT-SQL-0004', 5.000, 'in_transit', 1, datetime('now', 'start of month', '+3 hours'), datetime('now')),
    (5, 'ANT-SQL-0005', 5.001, 'delivered', 1, datetime('now', 'start of month', '+4 hours'), datetime('now')),
    (6, 'ANT-SQL-0006', 10.000, 'pending', 1, datetime('now', 'start of month', '+5 hours'), datetime('now')),
    (7, 'ANT-SQL-0007', 2.500, 'in_transit', 2, datetime('now', 'start of month', '+6 hours'), datetime('now')),
    (8, 'ANT-SQL-0008', 0.750, 'delivered', 2, datetime('now', 'start of month', '+7 hours'), datetime('now')),
    (9, 'ANT-SQL-0009', 3.000, 'pending', 2, datetime('now', 'start of month', '+8 hours'), datetime('now')),
    (10, 'ANT-SQL-0010', 8.000, 'in_transit', 2, datetime('now', 'start of month', '+9 hours'), datetime('now')),
    (11, 'ANT-SQL-0011', 0.250, 'delivered', 3, datetime('now', 'start of month', '+10 hours'), datetime('now')),
    (12, 'ANT-SQL-0012', 12.000, 'in_transit', 3, datetime('now', 'start of month', '+11 hours'), datetime('now')),
    (13, 'ANT-SQL-0013', 4.000, 'pending', 3, datetime('now', 'start of month', '+12 hours'), datetime('now')),
    (14, 'ANT-SQL-0014', 0.999, 'in_transit', 4, datetime('now', 'start of month', '+13 hours'), datetime('now')),
    (15, 'ANT-SQL-0015', 6.000, 'delivered', 4, datetime('now', 'start of month', '+14 hours'), datetime('now')),
    (16, 'ANT-SQL-0016', 1.250, 'in_transit', 1, datetime('now', 'start of month', '-1 second'), datetime('now')),
    (17, 'ANT-SQL-0017', 2.000, 'delivered', 2, datetime('now', 'start of month', '-2 days'), datetime('now')),
    (18, 'ANT-SQL-0018', 7.000, 'pending', 2, datetime('now', 'start of month', '-3 days'), datetime('now')),
    (19, 'ANT-SQL-0019', 0.600, 'in_transit', 3, datetime('now', 'start of month', '-4 days'), datetime('now')),
    (20, 'ANT-SQL-0020', 5.000, 'delivered', 3, datetime('now', 'start of month', '+1 month'), datetime('now'));
COMMIT;
