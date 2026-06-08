import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const CartContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved && saved !== 'null' ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('cart');
        return saved && saved !== 'undefined' ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        if (user) localStorage.setItem('user', JSON.stringify(user));
        else localStorage.removeItem('user');
        
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
    }, [user, token]);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const login = (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));
    
    const updateQuantity = (id, amount) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.id === id) {
                    const newQty = item.quantity + amount;
                    return { ...item, quantity: newQty > 0 ? newQty : 1 };
                }
                return item;
            });
        });
    };

    const clearCart = () => setCart([]);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
            <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
                {children}
            </CartContext.Provider>
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
export const useCart = () => useContext(CartContext);
