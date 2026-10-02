-- schema SQLite mengikuti migration couriers/shipments latihan Laravel CRUD.
-- gunakan database latihan kosong, bukan database aplikasi atau Supabase.
PRAGMA foreign_keys = ON;
CREATE TABLE couriers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    rating DECIMAL(3, 2) NOT NULL CHECK (rating BETWEEN 0 AND 5),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
CREATE TABLE shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_number VARCHAR(80) NOT NULL UNIQUE,
    weight_kg DECIMAL(10, 3) NOT NULL CHECK (weight_kg > 0),
    status VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'in_transit', 'delivered')),
    courier_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (courier_id) REFERENCES couriers(id) ON DELETE RESTRICT
);
CREATE INDEX shipments_created_at_courier_idx ON shipments(created_at, courier_id);
CREATE INDEX shipments_courier_idx ON shipments(courier_id);
