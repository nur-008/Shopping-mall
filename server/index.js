require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'nr_shopping_secret';
const dbPath = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Helper to read/write DB
const getDB = () => {
    if (!fs.existsSync(dbPath)) {
        const initialDB = { users: [], products: [], orders: [] };
        fs.writeFileSync(dbPath, JSON.stringify(initialDB, null, 2));
        return initialDB;
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
};

const saveDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

// Auth Routes
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    const db = getDB();
    
    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: "User already exists" });
    }

    const newUser = { id: Date.now(), name, email, password };
    db.users.push(newUser);
    saveDB(db);
    
    res.json({ message: "Registration successful" });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const db = getDB();
    const user = db.users.find(u => u.email === email && u.password === password);
    
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    
    const token = jwt.sign({ id: user.id, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, image: user.image } });
});

// Product Routes
app.get('/api/products', (req, res) => {
    const { q } = req.query;
    const db = getDB();
    let products = db.products;
    
    if (q) {
        const query = q.toLowerCase();
        const keywords = query.split(/\s+/).filter(k => k.length > 0);
        
        products = products.filter(p => {
            const name = (p.name || '').toLowerCase();
            const desc = (p.description || '').toLowerCase();
            return keywords.every(kw => name.includes(kw) || desc.includes(kw));
        });
    }
    
    res.json(products);
});

app.get('/api/products/:id', (req, res) => {
    const db = getDB();
    const productId = req.params.id;
    const product = db.products.find(p => String(p.id) === String(productId));
    
    if (!product) return res.status(404).json({ message: "Product not found" });
    
    const totalSold = db.orders.reduce((sum, order) => {
        const item = order.items.find(i => String(i.id) === String(productId));
        return sum + (item ? (Number(item.quantity) || 0) : 0);
    }, 0);
    
    res.json({ ...product, totalSold });
});

app.post('/api/products', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { name, price, description, image, categories } = req.body;
        const db = getDB();
        
        const newProduct = {
            id: Date.now(),
            name,
            price: Number(price),
            description,
            image,
            categories: categories || [],
            user_id: decoded.id
        };
        
        db.products.push(newProduct);
        saveDB(db);
        res.json({ message: "Product added successfully", product: newProduct });
    } catch (err) {
        res.status(500).json({ message: "Failed to add product" });
    }
});

app.put('/api/products/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { name, price, description, image, categories } = req.body;
        const db = getDB();
        
        const index = db.products.findIndex(p => String(p.id) === String(req.params.id));
        if (index === -1) return res.status(404).json({ message: "Product not found" });
        
        if (String(db.products[index].user_id) !== String(decoded.id)) {
            return res.status(403).json({ message: "You don't have permission to edit this product" });
        }

        db.products[index] = { 
            ...db.products[index],
            name, 
            price: Number(price), 
            description, 
            image, 
            categories: categories || []
        };

        saveDB(db);
        res.json({ message: "Product updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to update product" });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const db = getDB();
        
        const index = db.products.findIndex(p => String(p.id) === String(req.params.id));
        if (index === -1) return res.status(404).json({ message: "Product not found" });
        
        if (String(db.products[index].user_id) !== String(decoded.id)) {
            return res.status(403).json({ message: "You don't have permission to delete this product" });
        }

        db.products.splice(index, 1);
        saveDB(db);
        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete product" });
    }
});

// Order Routes
app.post('/api/orders', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { items, subtotal, deliveryCharge, total, customerInfo } = req.body;
        const db = getDB();
        
        const newOrder = { 
            id: Date.now(),
            user_id: decoded.id, 
            items, 
            subtotal,
            deliveryCharge,
            total,
            customerInfo,
            date: new Date().toISOString() 
        };
        
        db.orders.push(newOrder);
        saveDB(db);
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
        const db = getDB();
        const orders = db.orders.filter(o => String(o.user_id) === String(decoded.id));
        res.json(orders);
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
});

app.get('/api/admin/orders', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const db = getDB();
        
        const adminOrders = db.orders.map(order => {
            const myItems = order.items.filter(item => {
                const product = db.products.find(p => String(p.id) === String(item.id));
                return product && String(product.user_id) === String(decoded.id);
            });

            if (myItems.length > 0) {
                return {
                    ...order,
                    items: myItems,
                    adminTotal: myItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                };
            }
            return null;
        }).filter(Boolean);
        
        res.json(adminOrders);
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
});

app.put('/api/profile', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { name, image } = req.body;
        const db = getDB();
        
        const userIndex = db.users.findIndex(u => String(u.id) === String(decoded.id));
        if (userIndex === -1) {
            console.log("User not found for ID:", decoded.id);
            return res.status(404).json({ message: "User not found" });
        }

        db.users[userIndex].name = name || db.users[userIndex].name;
        db.users[userIndex].image = image || db.users[userIndex].image;

        saveDB(db);
        
        const updatedUser = { 
            id: db.users[userIndex].id, 
            name: db.users[userIndex].name, 
            email: db.users[userIndex].email,
            image: db.users[userIndex].image
        };
        
        res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (err) {
        console.error("Profile update error:", err);
        res.status(401).json({ message: "Invalid token" });
    }
});

app.get('/', (req, res) => res.send("NR Shopping Local API is running..."));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

module.exports = app;
