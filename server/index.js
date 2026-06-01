const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'nr_shopping_secret';

app.use(cors());
app.use(express.json());

// Dummy Database
const dbPath = path.join(__dirname, 'db.json');
if (!fs.existsSync(dbPath)) {
    const initialDb = {
        users: [],
        orders: [],
        products: [
            { id: 1, name: "Smart Watch", price: 1200, description: "Best budget smart watch", image: "https://via.placeholder.com/150", category: "Electronics" },
            { id: 2, name: "Wireless Earbuds", price: 2500, description: "High quality sound earbuds", image: "https://via.placeholder.com/150", category: "Electronics" },
            { id: 3, name: "Cotton T-Shirt", price: 450, description: "Comfortable cotton t-shirt", image: "https://via.placeholder.com/150", category: "Fashion" },
            { id: 4, name: "Leather Wallet", price: 800, description: "Pure leather wallet for men", image: "https://via.placeholder.com/150", category: "Fashion" },
            { id: 5, name: "Running Shoes", price: 3200, description: "Lightweight running shoes", image: "https://via.placeholder.com/150", category: "Sports" }
        ]
    };
    fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2));
}

const getDb = () => JSON.parse(fs.readFileSync(dbPath));
const saveDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

// Auth Routes
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    const db = getDb();
    if (db.users.find(u => u.email === email)) return res.status(400).json({ message: "User already exists" });
    const newUser = { id: Date.now(), name, email, password };
    db.users.push(newUser);
    saveDb(db);
    res.json({ message: "Registration successful" });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const db = getDb();
    const user = db.users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// Product Routes
app.get('/api/products', (req, res) => {
    const { q } = req.query;
    const db = getDb();
    if (q) {
        const filtered = db.products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
        return res.json(filtered);
    }
    res.json(db.products);
});

app.get('/api/products/:id', (req, res) => {
    const db = getDb();
    const product = db.products.find(p => p.id == req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
});

// Order Routes
app.post('/api/orders', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { items, total } = req.body;
        const db = getDb();
        const newOrder = { id: Date.now(), userId: decoded.id, items, total, date: new Date().toISOString() };
        db.orders.push(newOrder);
        saveDb(db);
        res.json({ message: "Order placed successfully", order: newOrder });
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
});

app.get('/api/orders', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const db = getDb();
        const userOrders = db.orders.filter(o => o.userId === decoded.id);
        res.json(userOrders);
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
