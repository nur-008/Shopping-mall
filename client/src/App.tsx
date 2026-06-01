import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppProvider, useCart, useAuth } from './AppContext';
import Navbar from './Navbar';
import './index.css';

const API_URL = 'http://localhost:5000/api';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchProducts = async () => {
            const url = query ? `${API_URL}/products?q=${query}` : `${API_URL}/products`;
            const res = await axios.get(url);
            setProducts(res.data);
        };
        fetchProducts();
    }, [query]);

    return (
        <div className="product-grid">
            {products.map(p => (
                <div key={p.id} className="product-card">
                    <img src={p.image} alt={p.name} />
                    <h3>{p.name}</h3>
                    <p className="price">৳{p.price}</p>
                    <button className="btn" onClick={() => addToCart(p)}>Add to Cart</button>
                </div>
            ))}
        </div>
    );
};

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/login`, { email, password });
            login(res.data.user, res.data.token);
            navigate('/');
        } catch (err) {
            alert("Login failed");
        }
    };

    return (
        <div className="form-container">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn">Login</button>
            </form>
            <p>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>
    );
};

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/register`, { name, email, password });
            alert("Registration successful! Please login.");
            navigate('/login');
        } catch (err) {
            alert("Registration failed");
        }
    };

    return (
        <div className="form-container">
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn">Register</button>
            </form>
        </div>
    );
};

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
    const { token } = useAuth();
    const navigate = useNavigate();
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleCheckout = async () => {
        if (!token) {
            alert("Please login to checkout");
            navigate('/login');
            return;
        }
        try {
            await axios.post(`${API_URL}/orders`, { items: cart, total }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Order placed successfully!");
            clearCart();
            navigate('/orders');
        } catch (err) {
            alert("Checkout failed");
        }
    };

    return (
        <div className="container" style={{marginTop: '20px'}}>
            <h2>Shopping Cart</h2>
            {cart.length === 0 ? <p>Your cart is empty</p> : (
                <div>
                    {cart.map(item => (
                        <div key={item.id} className="cart-item">
                            <div>
                                <h4>{item.name}</h4>
                                <p>৳{item.price}</p>
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
                                <span>{item.quantity}</span>
                                <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                            </div>
                            <button onClick={() => removeFromCart(item.id)} className="btn" style={{background: '#666', marginTop: 0}}>Remove</button>
                        </div>
                    ))}
                    <div style={{textAlign: 'right', marginTop: '20px'}}>
                        <h3>Total: ৳{total}</h3>
                        <button onClick={handleCheckout} className="btn">Checkout</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const { token } = useAuth();

    useEffect(() => {
        const fetchOrders = async () => {
            const res = await axios.get(`${API_URL}/orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(res.data);
        };
        if (token) fetchOrders();
    }, [token]);

    return (
        <div className="container" style={{marginTop: '20px'}}>
            <h2>My Orders</h2>
            {orders.map(order => (
                <div key={order.id} style={{background: 'white', padding: '15px', marginBottom: '10px', borderRadius: '4px'}}>
                    <p><strong>Order ID:</strong> {order.id}</p>
                    <p><strong>Date:</strong> {new Date(order.date).toLocaleDateString()}</p>
                    <p><strong>Total:</strong> ৳{order.total}</p>
                    <div>
                        {order.items.map(item => <span key={item.id}>{item.name} ({item.quantity}), </span>)}
                    </div>
                </div>
            ))}
        </div>
    );
};

const App = () => {
    return (
        <AppProvider>
            <Router>
                <Navbar />
                <div className="container">
                    <Routes>
                        <Route path="/" element={<ProductList />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/orders" element={<Orders />} />
                    </Routes>
                </div>
            </Router>
        </AppProvider>
    );
};

export default App;
