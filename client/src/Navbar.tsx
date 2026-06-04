import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useCart } from './AppContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { cart } = useCart();
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        navigate(`/?q=${search}`);
    };

    return (
        <nav className="navbar">
            <div className="container nav-content">
                <Link to="/" className="logo">NR Shopping</Link>
                <form onSubmit={handleSearch} className="search-bar">
                    <input 
                        type="text" 
                        placeholder="Search in NR Shopping" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit">Search</button>
                </form>
                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/cart" className="cart-link">
                        Cart <span>({cart.length})</span>
                    </Link>
                    {user ? (
                        <div className="user-menu" style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                            <Link to="/profile" style={{display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit'}}>
                                <div style={{width: '30px', height: '30px', background: '#f85606', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span style={{fontWeight: '500'}}>Profile</span>
                            </Link>
                            {(user.email === 'admin@nr.com' || user.email === 'nur008.cse.diu@gmail.com') && (
                                <>
                                    <Link to="/admin/orders" style={{color: '#f85606', fontWeight: 'bold'}}>Sales Dashboard</Link>
                                    <Link to="/add-product">Add Product</Link>
                                </>
                            )}
                            <Link to="/orders">My Orders</Link>
                            <button onClick={logout}>Logout</button>
                        </div>
                    ) : (
                        <Link to="/login">Login / Signup</Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
