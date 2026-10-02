-- Q01 | Dalam perjalanan, terberat dahulu
SELECT id, tracking_number, weight_kg, status, courier_id
FROM shipments
WHERE status = 'in_transit'
ORDER BY weight_kg DESC, id ASC;

-- Q02 | Kategori ukuran menggunakan CASE
SELECT id, tracking_number, weight_kg,
    CASE
        WHEN weight_kg <= 1 THEN 'Small'
        WHEN weight_kg <= 5 THEN 'Medium'
        ELSE 'Large'
    END AS size_category
FROM shipments
ORDER BY id ASC;

-- Q03 | Total pengiriman per kurir bulan ini
SELECT c.id AS courier_id, c.name AS courier_name,
    COUNT(s.id) AS total_shipments_this_month
FROM couriers AS c
LEFT JOIN shipments AS s
    ON s.courier_id = c.id
    AND s.created_at >= datetime('now', 'start of month')
    AND s.created_at < datetime('now', 'start of month', '+1 month')
GROUP BY c.id, c.name
ORDER BY total_shipments_this_month DESC, c.id ASC;

-- Q04 | Rata-rata berat per status
SELECT status, COUNT(*) AS total_shipments,
    ROUND(AVG(weight_kg), 3) AS average_weight_kg
FROM shipments
GROUP BY status
ORDER BY status ASC;

-- Q05 | Kurir dengan lebih dari N pengiriman
WITH parameters(n) AS (VALUES (4))
SELECT c.id AS courier_id, c.name AS courier_name,
    COUNT(s.id) AS total_shipments
FROM couriers AS c
INNER JOIN shipments AS s ON s.courier_id = c.id
GROUP BY c.id, c.name
HAVING COUNT(s.id) > (SELECT n FROM parameters)
ORDER BY total_shipments DESC, c.id ASC;

-- Q06 | Semua kurir termasuk yang belum memiliki kiriman
SELECT c.id AS courier_id, c.name AS courier_name,
    COUNT(s.id) AS total_shipments
FROM couriers AS c
LEFT JOIN shipments AS s ON s.courier_id = c.id
GROUP BY c.id, c.name
ORDER BY c.id ASC;

-- Q07 | Detail kiriman beserta nama kurir melalui INNER JOIN
SELECT s.tracking_number, s.weight_kg, s.status,
    c.name AS courier_name
FROM shipments AS s
INNER JOIN couriers AS c ON c.id = s.courier_id
ORDER BY s.id ASC;

-- Q08 | Kurir yang belum menerima kiriman melalui NOT EXISTS
SELECT c.id AS courier_id, c.name AS courier_name
FROM couriers AS c
WHERE NOT EXISTS (
    SELECT 1 FROM shipments AS s WHERE s.courier_id = c.id
)
ORDER BY c.id ASC;
