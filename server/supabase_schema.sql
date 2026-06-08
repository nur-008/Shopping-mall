-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    image TEXT
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL NOT NULL,
    description TEXT,
    image TEXT,
    category TEXT,
    user_id BIGINT REFERENCES users(id),
    categories JSONB
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    items JSONB NOT NULL,
    subtotal DECIMAL,
    deliveryCharge DECIMAL,
    total DECIMAL NOT NULL,
    customerInfo JSONB,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
