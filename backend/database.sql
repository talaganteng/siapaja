-- Database Initialization for SiapAja! Modul 1

CREATE DATABASE IF NOT EXISTS siapaja;
USE siapaja;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Customer', 'Vendor') DEFAULT 'Customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rating DECIMAL(3,2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_per_day DECIMAL(10,2) NOT NULL,
    location VARCHAR(255) NOT NULL,
    image_url VARCHAR(500),
    rating DECIMAL(3,2) DEFAULT 0.00,
    reviews_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Dummy Data
INSERT IGNORE INTO users (id, name, email, password, role) VALUES 
(1, 'John Doe', 'john@example.com', 'hashedpassword', 'Customer'),
(2, 'Lenscrafters ID', 'vendor1@example.com', 'hashedpassword', 'Vendor');

INSERT IGNORE INTO vendor_profiles (id, user_id, name, description, rating) VALUES 
(1, 2, 'Lenscrafters ID', 'Penyedia sewa kamera terlengkap di Jakarta.', 4.8);

INSERT IGNORE INTO items (id, vendor_id, name, description, price_per_day, location, image_url, rating, reviews_count) VALUES 
(1, 1, 'Kamera Sony A7III', 'Kamera mirrorless full-frame dengan kemampuan video 4K dan autofokus super cepat.', 250000.00, 'Jakarta Selatan', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 4.9, 24);

INSERT IGNORE INTO reviews (id, item_id, user_id, rating, comment) VALUES 
(1, 1, 1, 5, 'Barang mulus, hasil jepretan mantap!');
