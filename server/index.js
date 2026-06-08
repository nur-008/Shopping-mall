require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const supabase = require('./supabase');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'nr_shopping_secret';

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Auth Routes
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
    
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }

    const { error: insertError } = await supabase
        .from('users')
        .insert([{ id: Date.now(), name, email, password }]);
    
    if (insertError) {
        return res.status(500).json({ message: insertError.message });
    }
    
    res.json({ message: "Registration successful" });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();
    
    if (error || !user) return res.status(400).json({ message: "Invalid credentials" });
    
    const token = jwt.sign({ id: user.id, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, image: user.image } });
});

// Product Routes
app.get('/api/products', async (req, res) => {
    const { q } = req.query;
    let query = supabase.from('products').select('*');
    
    if (q) {
        const keywords = q.toLowerCase().split(/\s+/).filter(k => k.length > 0);
        // Supabase search is a bit different, we'll use ilike for simplicity or text search
        // For multiple keywords, we can chain or use or
        const searchFilter = keywords.map(kw => `name.ilike.%${kw}%,description.ilike.%${kw}%`).join(',');
        query = query.or(searchFilter);
    }
    
    const { data: products, error } = await query;
    if (error) return res.status(500).json({ message: error.message });
    
    res.json(products);
});

app.get('/api/products/:id', async (req, res) => {
    const productId = req.params.id;
    
    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
    
    if (error || !product) return res.status(404).json({ message: "Product not found" });
    
    // Calculate total sold from orders
    const { data: allOrders, error: orderError } = await supabase
        .from('orders')
        .select('items');
    
    if (orderError) return res.status(500).json({ message: orderError.message });

    const totalSold = allOrders.reduce((sum, order) => {
        const item = order.items.find(i => String(i.id) === String(productId));
        return sum + (item ? (Number(item.quantity) || 0) : 0);
    }, 0);
    
    res.json({ ...product, totalSold });
});

app.post('/api/products', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { name, price, description, image, categories } = req.body;
        
        const newProduct = {
            id: Date.now(),
            name,
            price: Number(price),
            description,
            image,
            categories: categories || [],
            user_id: decoded.id
        };
        
        const { error } = await supabase.from('products').insert([newProduct]);
        if (error) {
            console.error("Supabase Error:", error);
            return res.status(500).json({ message: error.message });
        }

        res.json({ message: "Product added successfully", product: newProduct });
    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ message: err.message || "Failed to add product" });
    }
});

app.put('/api/products/:id', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { name, price, description, image, categories } = req.body;
        
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('user_id')
            .eq('id', req.params.id)
            .single();
        
        if (fetchError || !product) return res.status(404).json({ message: "Product not found" });
        
        if (String(product.user_id) !== String(decoded.id)) {
            return res.status(403).json({ message: "You don't have permission to edit this product" });
        }

        const { error: updateError } = await supabase
            .from('products')
            .update({ 
                name, 
                price: Number(price), 
                description, 
                image, 
                categories: categories || []
            })
            .eq('id', req.params.id);

        if (updateError) throw updateError;
        res.json({ message: "Product updated successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to update product" });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('user_id')
            .eq('id', req.params.id)
            .single();
        
        if (fetchError || !product) return res.status(404).json({ message: "Product not found" });
        
        if (String(product.user_id) !== String(decoded.id)) {
            return res.status(403).json({ message: "You don't have permission to delete this product" });
        }

        const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .eq('id', req.params.id);

        if (deleteError) throw deleteError;
        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to delete product" });
    }
});

// Order Routes
app.post('/api/orders', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { items, subtotal, deliveryCharge, total, customerInfo } = req.body;
        
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
        
        const { error } = await supabase.from('orders').insert([newOrder]);
        if (error) throw error;

        res.json({ message: "Order placed successfully", order: newOrder });
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
});

app.get('/api/orders', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', decoded.id);
        
        if (error) throw error;
        res.json(orders);
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
});

app.get('/api/admin/orders', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // This is a complex query in local DB, in Supabase we might need multiple steps or a join
        // We'll fetch all orders and filter in JS for now to maintain logic parity
        const { data: allOrders, error: ordersError } = await supabase.from('orders').select('*');
        const { data: allProducts, error: productsError } = await supabase.from('products').select('*');
        
        if (ordersError || productsError) throw (ordersError || productsError);

        const adminOrders = allOrders.map(order => {
            const myItems = order.items.filter(item => {
                const product = allProducts.find(p => String(p.id) === String(item.id));
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

app.put('/api/profile', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { name, image } = req.body;
        
        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ name, image })
            .eq('id', decoded.id)
            .select('id, name, email, image')
            .single();

        if (error) throw error;
        res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
});

app.get('/', (req, res) => res.send("NR Shopping Supabase API is running..."));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

module.exports = app;
