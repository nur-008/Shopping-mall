import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AppProvider, useCart, useAuth } from './AppContext';
import Navbar from './Navbar';
import './index.css';

const API_URL = ['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:5000/api' : 'https://nr-shopping-api.vercel.app/api';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1000';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const { addToCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

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
            {products.length === 0 ? (
                <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '50px', background: 'white', borderRadius: '8px', border: '1px solid #ddd'}}>
                    <h3>No products found matching your search.</h3>
                    <p style={{color: '#666'}}>Try different keywords or check back later!</p>
                </div>
            ) : (
                products.map(p => (
                    <div key={p.id} className="product-card">
                        <Link to={`/product/${p.id}`} style={{textDecoration: 'none', color: 'inherit'}}>
                            <img 
                                src={p.image || DEFAULT_IMAGE} 
                                alt={p.name} 
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                                }}
                            />
                            <h3>{p.name}</h3>
                        </Link>
                        <p className="price">৳{p.price}</p>
                        <div className="category-container" style={{display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '10px'}}>
                            {(Array.isArray(p.categories) ? p.categories : [p.category]).map(cat => (
                                <span key={cat} className="category-tag" style={{fontSize: '10px', background: '#eee', padding: '2px 6px', borderRadius: '10px', color: '#666'}}>{cat}</span>
                            ))}
                        </div>
                        <div style={{display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap'}}>
                            <button className="btn" onClick={() => addToCart(p)}>Add to Cart</button>
                            {user && p.user_id === user.id && (
                                <button className="btn" style={{background: '#666'}} onClick={() => navigate(`/edit-product/${p.id}`)}>Edit</button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
                <div className="form-group password-group">
                    <label>Password</label>
                    <div className="input-wrapper">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                        <button 
                            type="button" 
                            className="toggle-password" 
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
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
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            alert("Password must be at least 6 characters long");
            return;
        }
        try {
            await axios.post(`${API_URL}/register`, { name, email, password });
            alert("Registration successful! Please login.");
            navigate('/login');
        } catch (err: any) {
            const message = err.response?.data?.message || "Registration failed";
            alert(message);
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
                <div className="form-group password-group">
                    <label>Password</label>
                    <div className="input-wrapper">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                        <button 
                            type="button" 
                            className="toggle-password" 
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>
                <button type="submit" className="btn">Register</button>
            </form>
        </div>
    );
};

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
    const { token, user } = useAuth();
    const navigate = useNavigate();
    
    const [customerName, setCustomerName] = useState(user?.name || '');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [area, setArea] = useState('Inside Dhaka');
    const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
    const [bkashNumber, setBkashNumber] = useState('');
    const [transactionId, setTransactionId] = useState('');

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const deliveryCharge = area === 'Inside DIU' ? 0 : (area === 'Inside Dhaka' ? 50 : 150);
    const total = subtotal + deliveryCharge;

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            alert("Please login to checkout");
            navigate('/login');
            return;
        }

        if (!phone || !address) {
            alert("Please provide phone number and delivery address");
            return;
        }

        const phoneRegex = /^01[3-9]\d{8}$/;
        if (!phoneRegex.test(phone)) {
            alert("Please enter a valid 11-digit phone number (e.g., 01712345678)");
            return;
        }

        if (paymentMethod === 'bKash') {
            if (!bkashNumber || !transactionId) {
                alert("Please provide your bKash number and Transaction ID");
                return;
            }
        }

        try {
            const orderData = { 
                items: cart, 
                subtotal,
                deliveryCharge,
                total,
                customerInfo: {
                    name: customerName,
                    phone,
                    address,
                    area,
                    paymentMethod,
                    bkashNumber: paymentMethod === 'bKash' ? bkashNumber : undefined,
                    transactionId: paymentMethod === 'bKash' ? transactionId : undefined
                }
            };
            await axios.post(`${API_URL}/orders`, orderData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Order placed successfully!");
            clearCart();
            navigate('/orders');
        } catch (err: any) {
            alert(err.response?.data?.message || "Checkout failed");
        }
    };

    return (
        <div className="container" style={{marginTop: '20px', display: 'flex', gap: '30px', flexWrap: 'wrap'}}>
            <div style={{flex: '2', minWidth: '300px'}}>
                <h2>Shopping Cart</h2>
                {cart.length === 0 ? <p>Your cart is empty</p> : (
                    <div>
                        {cart.map(item => (
                            <div key={item.id} className="cart-item" style={{borderRadius: '8px', border: '1px solid #eee'}}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                                    <img 
                                        src={item.image || DEFAULT_IMAGE} 
                                        alt={item.name} 
                                        style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px'}}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                                        }}
                                    />
                                    <div>
                                        <h4 style={{margin: '0 0 5px 0'}}>{item.name}</h4>
                                        <p style={{margin: 0}}>৳{item.price}</p>
                                    </div>
                                </div>
                                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                    <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
                                    <span>{item.quantity}</span>
                                    <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="btn" style={{background: '#666', marginTop: 0}}>Remove</button>
                            </div>
                        ))}
                        <div style={{textAlign: 'right', marginTop: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #eee'}}>
                            <p style={{margin: '5px 0'}}>Subtotal: ৳{subtotal}</p>
                            <p style={{margin: '5px 0'}}>Delivery Charge ({area}): ৳{deliveryCharge}</p>
                            <h3 style={{margin: '10px 0', color: '#f85606'}}>Total: ৳{total}</h3>
                        </div>
                    </div>
                )}
            </div>

            {cart.length > 0 && (
                <div style={{flex: '1', minWidth: '300px', background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #eee'}}>
                    <h3>Delivery Details</h3>
                    <form onSubmit={handleCheckout}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" required />
                        </div>
                        <div className="form-group">
                            <label>Delivery Area</label>
                            <select value={area} onChange={(e) => setArea(e.target.value)} style={{width: '100%', padding: '8px', border: '1px solid #ddd'}}>
                                <option value="Inside Dhaka">Inside Dhaka (৳50)</option>
                                <option value="Outside Dhaka">Outside Dhaka (৳150)</option>
                                <option value="Inside DIU">Inside DIU (Free Delivery)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Delivery Address</label>
                            <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House #, Road #, Area, City" required style={{width: '100%', padding: '8px', border: '1px solid #ddd'}} />
                        </div>
                        <div className="form-group">
                            <label>Payment Method</label>
                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{width: '100%', padding: '8px', border: '1px solid #ddd'}}>
                                <option value="Cash on Delivery">Cash on Delivery</option>
                                <option value="bKash">bKash (Send Money)</option>
                                <option value="Nagad" disabled style={{color: '#999'}}>Nagad (Coming Soon)</option>
                                <option value="Rocket" disabled style={{color: '#999'}}>Rocket (Coming Soon)</option>
                                <option value="Card" disabled style={{color: '#999'}}>Credit/Debit Card (Coming Soon)</option>
                            </select>
                        </div>

                        {paymentMethod === 'bKash' && (
                            <div style={{background: '#fef1f6', padding: '15px', borderRadius: '8px', border: '1px solid #f8d7da', marginTop: '15px', marginBottom: '15px'}}>
                                <p style={{fontSize: '14px', margin: '0 0 10px 0', color: '#d10056', fontWeight: 'bold'}}>
                                    Instructions:
                                </p>
                                <p style={{fontSize: '13px', margin: '0 0 10px 0'}}>
                                    Please Send Money <strong>৳{total}</strong> to this bKash Number:
                                </p>
                                <h3 style={{color: '#d10056', margin: '10px 0', textAlign: 'center'}}>01615405325</h3>
                                <div className="form-group" style={{marginTop: '15px'}}>
                                    <label style={{fontSize: '13px'}}>Your bKash Number</label>
                                    <input 
                                        type="tel" 
                                        value={bkashNumber} 
                                        onChange={(e) => setBkashNumber(e.target.value)} 
                                        placeholder="01xxxxxxxxx" 
                                        required 
                                        style={{border: '1px solid #f85606'}}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{fontSize: '13px'}}>Transaction ID (TrxID)</label>
                                    <input 
                                        type="text" 
                                        value={transactionId} 
                                        onChange={(e) => setTransactionId(e.target.value)} 
                                        placeholder="8N7X..." 
                                        required 
                                        style={{border: '1px solid #f85606'}}
                                    />
                                </div>
                            </div>
                        )}

                        <button type="submit" className="btn" style={{width: '100%', marginTop: '10px'}}>Confirm Order</button>
                    </form>
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
            {orders.length === 0 ? <p>You haven't placed any orders yet.</p> : (
                orders.map((order: any) => (
                    <div key={order.id} style={{background: 'white', padding: '20px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px'}}>
                            <span><strong>Order ID:</strong> #{order.id}</span>
                            <span style={{color: '#666'}}>{new Date(order.date).toLocaleString()}</span>
                        </div>
                        
                        <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '15px'}}>
                            <div style={{flex: '2', minWidth: '300px'}}>
                                <h4 style={{marginBottom: '10px', color: '#666'}}>Items</h4>
                                {order.items.map((item: any) => (
                                    <div key={item.id} style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                                        <img 
                                            src={item.image || DEFAULT_IMAGE} 
                                            alt={item.name} 
                                            style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px'}}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                                            }}
                                        />
                                        <div style={{flex: 1, display: 'flex', justifyContent: 'space-between', fontSize: '14px'}}>
                                            <span>{item.name} × {item.quantity}</span>
                                            <span>৳{item.price * item.quantity}</span>
                                        </div>
                                    </div>
                                ))}
                                <div style={{textAlign: 'right', borderTop: '1px solid #f0f0f0', paddingTop: '5px', marginTop: '5px'}}>
                                    <p style={{fontSize: '12px', color: '#666', margin: '2px 0'}}>Subtotal: ৳{order.subtotal || order.total}</p>
                                    <p style={{fontSize: '12px', color: '#666', margin: '2px 0'}}>Delivery: ৳{order.deliveryCharge || 0}</p>
                                    <strong>Total: ৳{order.total}</strong>
                                </div>
                            </div>
                            
                            {order.customerInfo && (
                                <div style={{flex: '1', minWidth: '250px', paddingLeft: '20px', borderLeft: '1px solid #f0f0f0'}}>
                                    <h4 style={{marginBottom: '10px', color: '#666'}}>Delivery Details</h4>
                                    <p style={{fontSize: '14px', margin: '3px 0'}}><strong>Name:</strong> {order.customerInfo.name}</p>
                                    <p style={{fontSize: '14px', margin: '3px 0'}}><strong>Phone:</strong> {order.customerInfo.phone}</p>
                                    <p style={{fontSize: '14px', margin: '3px 0'}}><strong>Address:</strong> {order.customerInfo.address}</p>
                                    <p style={{fontSize: '14px', margin: '3px 0'}}><strong>Method:</strong> {order.customerInfo.paymentMethod}</p>
                                    {order.customerInfo.paymentMethod === 'bKash' && (
                                        <div style={{marginTop: '10px', padding: '10px', background: '#fef1f6', borderRadius: '4px', border: '1px solid #f8d7da'}}>
                                            <p style={{fontSize: '12px', margin: '2px 0', color: '#d10056'}}><strong>bKash Number:</strong> {order.customerInfo.bkashNumber}</p>
                                            <p style={{fontSize: '12px', margin: '2px 0', color: '#d10056'}}><strong>TrxID:</strong> {order.customerInfo.transactionId}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const { token } = useAuth();

    useEffect(() => {
        const fetchAdminOrders = async () => {
            try {
                const res = await axios.get(`${API_URL}/admin/orders`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrders(res.data);
            } catch (err) {
                console.error("Failed to fetch admin orders", err);
            }
        };
        if (token) fetchAdminOrders();
    }, [token]);

    return (
        <div className="container" style={{marginTop: '20px'}}>
            <h2>Sales Dashboard (Customer Orders)</h2>
            <p style={{color: '#666', marginBottom: '20px'}}>Showing orders for products you have added.</p>
            {orders.length === 0 ? <p>No one has ordered your products yet.</p> : (
                orders.map((order: any) => (
                    <div key={order.id} style={{background: 'white', padding: '20px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px'}}>
                            <span><strong>Order ID:</strong> #{order.id}</span>
                            <span style={{color: '#666'}}>{new Date(order.date).toLocaleString()}</span>
                        </div>
                        
                        <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '15px'}}>
                            <div style={{flex: '2', minWidth: '300px'}}>
                                <h4 style={{marginBottom: '10px', color: '#666'}}>Your Sold Items</h4>
                                {order.items.map((item: any) => (
                                    <div key={item.id} style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                                        <img 
                                            src={item.image || DEFAULT_IMAGE} 
                                            alt={item.name} 
                                            style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px'}}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                                            }}
                                        />
                                        <div style={{flex: 1, display: 'flex', justifyContent: 'space-between', fontSize: '14px'}}>
                                            <span>{item.name} × {item.quantity}</span>
                                            <span>৳{item.price * item.quantity}</span>
                                        </div>
                                    </div>
                                ))}
                                <div style={{textAlign: 'right', borderTop: '1px solid #f0f0f0', paddingTop: '5px', marginTop: '5px'}}>
                                    <strong>Your Earnings: ৳{order.adminTotal}</strong>
                                </div>
                            </div>
                            
                            {order.customerInfo && (
                                <div style={{flex: '1', minWidth: '250px', paddingLeft: '20px', borderLeft: '1px solid #f0f0f0'}}>
                                    <h4 style={{marginBottom: '10px', color: '#666'}}>Customer Details</h4>
                                    <p style={{fontSize: '14px', margin: '3px 0'}}><strong>Name:</strong> {order.customerInfo.name}</p>
                                    <p style={{fontSize: '14px', margin: '3px 0'}}><strong>Phone:</strong> {order.customerInfo.phone}</p>
                                    <p style={{fontSize: '14px', margin: '3px 0'}}><strong>Address:</strong> {order.customerInfo.address}</p>
                                    <p style={{fontSize: '14px', margin: '3px 0'}}><strong>Payment:</strong> {order.customerInfo.paymentMethod}</p>
                                    {order.customerInfo.paymentMethod === 'bKash' && (
                                        <div style={{marginTop: '10px', padding: '10px', background: '#fef1f6', borderRadius: '4px', border: '1px solid #f8d7da'}}>
                                            <p style={{fontSize: '12px', margin: '2px 0', color: '#d10056'}}><strong>bKash Number:</strong> {order.customerInfo.bkashNumber}</p>
                                            <p style={{fontSize: '12px', margin: '2px 0', color: '#d10056'}}><strong>TrxID:</strong> {order.customerInfo.transactionId}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

const CATEGORIES = ['Electronics', 'Fashion', 'Sports', 'Home', 'Boy', 'Girl', 'Baby'];

const AddProduct = () => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const { token } = useAuth();
    const navigate = useNavigate();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCategoryChange = (cat: string) => {
        setSelectedCategories(prev => 
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCategories.length === 0) {
            alert("Please select at least one category");
            return;
        }
        try {
            await axios.post(`${API_URL}/products`, { 
                name, 
                price: Number(price), 
                description, 
                image, 
                categories: selectedCategories 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Product added successfully!");
            navigate('/');
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to add product");
        }
    };

    return (
        <div className="form-container">
            <h2>Add New Product</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Product Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Price (৳)</label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} required style={{width: '100%', padding: '8px', border: '1px solid #ddd'}} />
                </div>
                <div className="form-group">
                    <label>Product Image</label>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                        <input type="file" accept="image/*" onChange={handleFileChange} />
                        <p style={{fontSize: '12px', color: '#666'}}>Or enter Image URL:</p>
                        <input type="text" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
                        {image && <img src={image} alt="Preview" style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px'}} />}
                    </div>
                </div>
                <div className="form-group">
                    <label>Categories (Select Multiple)</label>
                    <div style={{
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '10px', 
                        padding: '12px', 
                        background: '#fff', 
                        borderRadius: '4px', 
                        border: '1px solid #ddd'
                    }}>
                        {CATEGORIES.map(cat => (
                            <label key={cat} style={{
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                cursor: 'pointer', 
                                padding: '6px 12px',
                                background: selectedCategories.includes(cat) ? '#eee' : 'transparent',
                                borderRadius: '20px',
                                border: '1px solid ' + (selectedCategories.includes(cat) ? '#ccc' : '#ddd'),
                                transition: '0.2s',
                                fontSize: '13px'
                            }}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedCategories.includes(cat)} 
                                    onChange={() => handleCategoryChange(cat)} 
                                    style={{display: 'none'}}
                                />
                                {cat}
                            </label>
                        ))}
                    </div>
                </div>
                <button type="submit" className="btn">Add Product</button>
            </form>
        </div>
    );
};

const EditProduct = () => {
    const { id } = useParams();
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProduct = async () => {
            const res = await axios.get(`${API_URL}/products/${id}`);
            const p = res.data;
            setName(p.name);
            setPrice(p.price);
            setDescription(p.description);
            setImage(p.image);
            setSelectedCategories(Array.isArray(p.categories) ? p.categories : [p.category].filter(Boolean));
        };
        fetchProduct();
    }, [id]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCategoryChange = (cat: string) => {
        setSelectedCategories(prev => 
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await axios.delete(`${API_URL}/products/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("Product deleted successfully!");
                navigate('/');
            } catch (err) {
                alert("Failed to delete product");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCategories.length === 0) {
            alert("Please select at least one category");
            return;
        }
        try {
            await axios.put(`${API_URL}/products/${id}`, { 
                name, 
                price: Number(price), 
                description, 
                image, 
                categories: selectedCategories 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Product updated successfully!");
            navigate('/');
        } catch (err) {
            alert("Failed to update product");
        }
    };

    return (
        <div className="form-container">
            <h2>Edit Product</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Product Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Price (৳)</label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} required style={{width: '100%', padding: '8px', border: '1px solid #ddd'}} />
                </div>
                <div className="form-group">
                    <label>Product Image</label>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                        <input type="file" accept="image/*" onChange={handleFileChange} />
                        <p style={{fontSize: '12px', color: '#666'}}>Or enter Image URL:</p>
                        <input type="text" value={image} onChange={(e) => setImage(e.target.value)} />
                        {image && <img src={image} alt="Preview" style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px'}} />}
                    </div>
                </div>
                <div className="form-group">
                    <label>Categories (Select Multiple)</label>
                    <div style={{
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '10px', 
                        padding: '12px', 
                        background: '#fff', 
                        borderRadius: '4px', 
                        border: '1px solid #ddd'
                    }}>
                        {CATEGORIES.map(cat => (
                            <label key={cat} style={{
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                cursor: 'pointer', 
                                padding: '6px 12px',
                                background: selectedCategories.includes(cat) ? '#eee' : 'transparent',
                                borderRadius: '20px',
                                border: '1px solid ' + (selectedCategories.includes(cat) ? '#ccc' : '#ddd'),
                                transition: '0.2s',
                                fontSize: '13px'
                            }}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedCategories.includes(cat)} 
                                    onChange={() => handleCategoryChange(cat)} 
                                    style={{display: 'none'}}
                                />
                                {cat}
                            </label>
                        ))}
                    </div>
                </div>
                <div style={{display: 'flex', gap: '10px'}}>
                    <button type="submit" className="btn" style={{flex: 2}}>Update Product</button>
                    <button type="button" className="btn" style={{flex: 1, background: '#ff4d4d'}} onClick={handleDelete}>Delete</button>
                </div>
            </form>
        </div>
    );
};

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState<any>(null);
    const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
    const { addToCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProductAndRelated = async () => {
            try {
                const res = await axios.get(`${API_URL}/products/${id}`);
                const p = res.data;
                setProduct(p);

                const allRes = await axios.get(`${API_URL}/products`);
                const allProducts = allRes.data;
                
                const currentCategories = Array.isArray(p.categories) ? p.categories : [p.category];
                
                const related = allProducts.filter((item: any) => {
                    if (item.id === p.id) return false;
                    const itemCategories = Array.isArray(item.categories) ? item.categories : [item.category];
                    return itemCategories.some((cat: string) => currentCategories.includes(cat));
                }).slice(0, 4);

                setRelatedProducts(related);
                window.scrollTo(0, 0);
            } catch (err) {
                console.error("Failed to fetch product details", err);
            }
        };
        fetchProductAndRelated();
    }, [id]);

    if (!product) return <div className="container" style={{padding: '50px', textAlign: 'center'}}>Loading...</div>;

    return (
        <div className="container">
            <div className="product-detail-container">
                <div className="product-detail-main">
                    <div className="product-detail-image">
                        <img 
                            src={product.image || DEFAULT_IMAGE} 
                            alt={product.name} 
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                            }}
                        />
                    </div>
                    <div className="product-detail-info">
                        <h1>{product.name}</h1>
                        <div className="category-container" style={{display: 'flex', gap: '8px', marginBottom: '15px'}}>
                            {(Array.isArray(product.categories) ? product.categories : [product.category]).map((cat: string) => (
                                <span key={cat} className="category-tag" style={{background: '#f0f0f0', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', color: '#666'}}>{cat}</span>
                            ))}
                        </div>
                        <p className="price">৳{product.price}</p>
                        <p style={{fontSize: '14px', color: '#666', marginBottom: '15px'}}>
                            <strong>Total Sold:</strong> {product.totalSold || 0} items
                        </p>
                        <div className="description">
                            <h3>Description</h3>
                            <p>{product.description}</p>
                        </div>
                        <div style={{display: 'flex', gap: '10px', marginTop: '30px'}}>
                            <button className="btn" style={{padding: '12px 30px', fontSize: '16px'}} onClick={() => addToCart(product)}>Add to Cart</button>
                            {user && product.user_id === user.id && (
                                <button className="btn" style={{background: '#666', padding: '12px 30px', fontSize: '16px'}} onClick={() => navigate(`/edit-product/${product.id}`)}>Edit Product</button>
                            )}
                        </div>
                    </div>
                </div>

                {relatedProducts.length > 0 && (
                    <div className="related-products">
                        <h2>Related Products</h2>
                        <div className="product-grid">
                            {relatedProducts.map(p => (
                                <div key={p.id} className="product-card">
                                    <Link to={`/product/${p.id}`} style={{textDecoration: 'none', color: 'inherit'}}>
                                        <img 
                                            src={p.image || DEFAULT_IMAGE} 
                                            alt={p.name} 
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                                            }}
                                        />
                                        <h3>{p.name}</h3>
                                    </Link>
                                    <p className="price">৳{p.price}</p>
                                    <button className="btn" onClick={() => addToCart(p)}>Add to Cart</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Profile = () => {
    const { user, token, updateUser } = useAuth();
    const [orderCount, setOrderCount] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [newName, setNewName] = useState(user?.name || '');
    const [newImage, setNewImage] = useState(user?.image || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setNewName(user.name);
            setNewImage(user.image || '');
        }
    }, [user]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await axios.get(`${API_URL}/orders`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrderCount(res.data.length);
            } catch (err) {
                console.error("Failed to fetch order count", err);
            }
        };
        if (token) fetchOrders();
    }, [token]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await axios.put(`${API_URL}/profile`, {
                name: newName,
                image: newImage
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            updateUser(res.data.user);
            setEditMode(false);
            alert("Profile updated successfully!");
        } catch (err) {
            alert("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="container" style={{padding: '50px', textAlign: 'center'}}>Please login to view your profile.</div>;

    return (
        <div className="container" style={{marginTop: '30px'}}>
            <div className="form-container" style={{maxWidth: '600px', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}>
                <div style={{textAlign: 'center', marginBottom: '30px'}}>
                    <div style={{position: 'relative', width: '120px', height: '120px', margin: '0 auto 15px'}}>
                        <div style={{width: '120px', height: '120px', background: '#f85606', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', overflow: 'hidden'}}>
                            {newImage || user.image ? (
                                <img src={newImage || user.image} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                            ) : (
                                user.name.charAt(0).toUpperCase()
                            )}
                        </div>
                        {editMode && (
                            <label style={{position: 'absolute', bottom: '0', right: '0', background: 'white', borderRadius: '50%', padding: '8px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', display: 'flex'}}>
                                <span style={{fontSize: '12px'}}>📷</span>
                                <input type="file" accept="image/*" style={{display: 'none'}} onChange={handleFileChange} />
                            </label>
                        )}
                    </div>
                    
                    {editMode ? (
                        <div style={{marginBottom: '15px'}}>
                            <input 
                                type="text" 
                                value={newName} 
                                onChange={(e) => setNewName(e.target.value)}
                                style={{padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ddd', fontSize: '18px', textAlign: 'center'}}
                                placeholder="Enter your name"
                            />
                        </div>
                    ) : (
                        <h2 style={{margin: '0'}}>{user.name}</h2>
                    )}
                    <p style={{color: '#666'}}>{user.email}</p>
                </div>
                
                <div style={{borderTop: '1px solid #eee', paddingTop: '20px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
                        <span style={{color: '#666'}}>Account Status:</span>
                        <span style={{fontWeight: 'bold', color: 'green'}}>Active</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
                        <span style={{color: '#666'}}>Total Orders:</span>
                        <span style={{fontWeight: 'bold'}}>{orderCount} orders</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
                        <span style={{color: '#666'}}>Member Since:</span>
                        <span style={{fontWeight: 'bold'}}>{new Date(user.id).toLocaleDateString()}</span>
                    </div>
                </div>

                <div style={{marginTop: '30px', display: 'flex', gap: '10px', flexDirection: 'column'}}>
                    {editMode ? (
                        <div style={{display: 'flex', gap: '10px'}}>
                            <button className="btn" onClick={handleSave} disabled={loading} style={{flex: 1}}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button className="btn" onClick={() => {
                                setEditMode(false);
                                setNewName(user.name);
                                setNewImage(user.image);
                            }} style={{flex: 1, background: '#666'}}>
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button className="btn" onClick={() => setEditMode(true)} style={{width: '100%', background: '#666', marginBottom: '10px'}}>
                            Edit Profile
                        </button>
                    )}
                    
                    <div style={{display: 'flex', gap: '10px'}}>
                        <Link to="/orders" className="btn" style={{flex: 1, textAlign: 'center', textDecoration: 'none'}}>View My Orders</Link>
                        {(user.email === 'admin@nr.com' || user.email === 'nur008.cse.diu@gmail.com') && (
                            <Link to="/admin/orders" className="btn" style={{flex: 1, textAlign: 'center', textDecoration: 'none', background: '#333'}}>Sales Dashboard</Link>
                        )}
                    </div>
                </div>
            </div>
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
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/admin/orders" element={<AdminOrders />} />
                        <Route path="/add-product" element={<AddProduct />} />
                        <Route path="/edit-product/:id" element={<EditProduct />} />
                    </Routes>
                </div>
            </Router>
        </AppProvider>
    );
};

export default App;
