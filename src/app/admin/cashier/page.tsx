'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
    id: number;
    name: string;
    price: number;
    image?: string;
    category?: string;
}

interface CartItem extends Product {
    quantity: number;
}

export default function CashierPage() {
    const router = useRouter();
    const [authenticated, setAuthenticated] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showCambioModal, setShowCambioModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [showPastOrders, setShowPastOrders] = useState(false);
    const [pastOrders, setPastOrders] = useState<any[]>([]);
    const [orderPlaced, setOrderPlaced] = useState(false);

    // Check authentication
    useEffect(() => {
        const adminAuth = localStorage.getItem('adminAuth');
        const adminRole = localStorage.getItem('adminRole');
        
        if (adminAuth === 'true' && adminRole === 'cashier') {
            setAuthenticated(true);
        } else {
            router.push('/admin');
        }
        setCheckingAuth(false);
    }, [router]);

    // Load products from database
    useEffect(() => {
        if (!authenticated) return;

        const loadProducts = async () => {
            try {
                const response = await fetch('/api/products');
                const data = await response.json();
                
                // Flatten all categories into one array
                const allProducts: Product[] = [];
                Object.keys(data).forEach(category => {
                    data[category].forEach((product: any) => {
                        allProducts.push({
                            ...product,
                            category: category
                        });
                    });
                });
                
                setProducts(allProducts);
            } catch (error) {
                console.error('Error loading products:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, [authenticated]);

    // Add item to cart (single click adds one)
    const addToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                return [...prevCart, { ...product, quantity: 1 }];
            }
        });
    };

    // Remove one from cart
    const removeOneFromCart = (productId: number) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === productId);
            
            if (!existingItem) return prevCart;
            
            if (existingItem.quantity === 1) {
                return prevCart.filter(item => item.id !== productId);
            } else {
                return prevCart.map(item =>
                    item.id === productId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                );
            }
        });
    };

    // Clear entire cart
    const clearCart = () => {
        setCart([]);
        setOrderPlaced(false);
    };

    // Load past orders
    const loadPastOrders = async () => {
        try {
            const response = await fetch('/api/orders?limit=20');
            const data = await response.json();
            setPastOrders(data.orders || []);
            setShowPastOrders(true);
        } catch (error) {
            console.error('Error loading past orders:', error);
        }
    };

    // Delete order
    const deleteOrder = async (orderId: string) => {
        if (!confirm('Delete this order?')) return;
        
        try {
            // Note: You'll need to create a DELETE endpoint if you want to actually delete
            // For now, just remove from the local list
            setPastOrders(prev => prev.filter(order => order.order_id !== orderId));
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    };

    // Calculate total
    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    // Calculate change
    const calculateChange = () => {
        const payment = parseFloat(paymentAmount) || 0;
        const total = calculateTotal();
        return payment - total;
    };

    // Handle opening Cambio modal
    const handleOpenCambio = () => {
        if (cart.length === 0) {
            alert('Cart is empty');
            return;
        }
        setShowCambioModal(true);
    };

    // Handle closing Cambio modal
    const handleCloseCambio = () => {
        setShowCambioModal(false);
        setPaymentAmount('');
    };

    // Handle numpad input
    const handleNumpadClick = (value: string) => {
        if (value === 'C') {
            setPaymentAmount('');
        } else if (value === '⌫') {
            setPaymentAmount(prev => prev.slice(0, -1));
        } else if (value === '.') {
            if (!paymentAmount.includes('.')) {
                setPaymentAmount(prev => prev + '.');
            }
        } else {
            setPaymentAmount(prev => prev + value);
        }
    };

    // Submit order directly as completed
    const handleSubmitOrder = async () => {
        if (cart.length === 0) {
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch('/api/orders/cashier', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart.map(item => ({
                        productId: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity
                    })),
                    total: calculateTotal()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit order');
            }

            const result = await response.json();
            setOrderPlaced(true);
            clearCart();
        } catch (error) {
            console.error('Error submitting order:', error);
            alert('Failed to submit order. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Submit order with payment calculation (from Cambio modal)
    const handleSubmitOrderWithPayment = async () => {
        if (cart.length === 0) {
            alert('Cart is empty');
            return;
        }

        const payment = parseFloat(paymentAmount);
        const total = calculateTotal();

        if (isNaN(payment) || payment < total) {
            alert('Payment amount must be at least the total amount');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch('/api/orders/cashier', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart.map(item => ({
                        productId: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity
                    })),
                    total: total
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit order');
            }

            const result = await response.json();
            setOrderPlaced(true);
            clearCart();
            handleCloseCambio();
        } catch (error) {
            console.error('Error submitting order:', error);
            alert('Failed to submit order. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminRole');
        router.push('/admin');
    };

    if (checkingAuth) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Checking authentication...</span>
                </div>
            </div>
        );
    }

    if (!authenticated) {
        return null;
    }

    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading products...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="vh-100 d-flex flex-column bg-light">
            {/* Main Content - Split Screen */}
            <div className="d-flex flex-column flex-md-row" style={{ height: 'calc(100% - 70px)' }}>
                {/* LEFT SIDE - Menu */}
                <div className="d-flex flex-column col-12 col-md-6 p-3 border-end h-md-100" style={{ height: '50%' }}>
                    <div className="row row-cols-2 row-cols-sm-3 row-cols-lg-3 g-2 h-100" style={{ margin: 0 }}>
                        {products.map(product => (
                            <div key={product.id} className="col d-flex" style={{ padding: '0.25rem' }}>
                                <button
                                    className="btn btn-outline-primary w-100 d-flex flex-column align-items-center justify-content-center"
                                    style={{ fontSize: '0.85rem', padding: '8px' }}
                                    onClick={() => addToCart(product)}
                                >
                                    <strong className="mb-1 text-center small">{product.name}</strong>
                                    <span className="text-success fw-bold small">€{product.price.toFixed(2)}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT SIDE - Order Resume */}
                <div className="d-flex flex-column col-12 col-md-6 bg-white overflow-auto h-md-100" style={{ height: '50%' }}>
                    <div className="p-3 h-100">
                        {orderPlaced ? (
                            <div className="d-flex align-items-center justify-content-center h-100">
                                <div className="text-center">
                                    <div className="text-success mb-3" style={{ fontSize: '3rem' }}>✓</div>
                                    <h4 className="text-success">Order Placed</h4>
                                </div>
                            </div>
                        ) : cart.length === 0 ? (
                            <div className="d-flex align-items-center justify-content-center h-100">
                                <button 
                                    className="btn btn-primary btn-lg"
                                    onClick={loadPastOrders}
                                    style={{ padding: '20px 40px', fontSize: '1.2rem' }}
                                >
                                    View Past Orders
                                </button>
                            </div>
                        ) : (
                            <div className="list-group list-group-flush">
                                {cart.map(item => (
                                    <div key={item.id} className="list-group-item px-0 py-2">
                                        <div className="d-flex align-items-center justify-content-between gap-2">
                                            <div className="d-flex align-items-center gap-2" style={{ minWidth: '80px' }}>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    style={{ width: '28px', height: '28px', padding: '0', fontSize: '0.9rem' }}
                                                    onClick={() => removeOneFromCart(item.id)}
                                                >
                                                    -
                                                </button>
                                                <span className="fw-bold" style={{ width: '25px', textAlign: 'center' }}>
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    className="btn btn-sm btn-outline-success"
                                                    style={{ width: '28px', height: '28px', padding: '0', fontSize: '0.9rem' }}
                                                    onClick={() => addToCart(item)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="flex-grow-1 text-truncate">
                                                <span className="small">{item.name}</span>
                                            </div>
                                            <div style={{ minWidth: '60px', textAlign: 'right' }}>
                                                <strong className="small">€{(item.price * item.quantity).toFixed(2)}</strong>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Fixed Bottom Bar - Total and Submit */}
                <div className="col-12 border-top p-3 bg-light d-flex flex-shrink-0 align-items-center gap-2" style={{ minHeight: '70px' }}>
                    <h3 className="mb-0 text-success me-2 flex-shrink-0">€{calculateTotal().toFixed(2)}</h3>
                    <button
                        className="btn btn-primary flex-shrink-0"
                        onClick={handleOpenCambio}
                        disabled={cart.length === 0}
                        style={{ fontSize: '1rem', padding: '10px 15px', minWidth: '80px' }}
                    >
                        Cambio
                    </button>
                    <button
                        className="btn btn-success flex-grow-1"
                        onClick={handleSubmitOrder}
                        disabled={cart.length === 0 || submitting}
                        style={{ fontSize: '1.1rem', padding: '10px' }}
                    >
                        {submitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Processing...
                            </>
                        ) : (
                            'Submit'
                        )}
                    </button>
                </div>
            </div>

            {/* Cambio Modal */}
            {showCambioModal && (
                <div 
                    className="modal show d-block" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) handleCloseCambio();
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-body">
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
                                        <span className="fw-bold">Total:</span>
                                        <span className="h4 mb-0 text-primary">€{calculateTotal().toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <div className="input-group input-group-lg mb-3">
                                        <span className="input-group-text">€</span>
                                        <input
                                            type="text"
                                            className="form-control text-center"
                                            value={paymentAmount}
                                            readOnly
                                            placeholder="0.00"
                                            style={{ fontSize: '1.5rem' }}
                                        />
                                    </div>
                                </div>

                                {/* Change Display - Always Visible */}
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                                        <span className="fw-bold">Change:</span>
                                        <span className="h4 mb-0 text-success">€{calculateChange().toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Numpad */}
                                <div className="mb-3">
                                    <div className="row g-2">
                                        {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['C', '0', '⌫']].map((row, rowIdx) => (
                                            <div key={rowIdx} className="col-12">
                                                <div className="row g-2">
                                                    {row.map((num) => (
                                                        <div key={num} className="col-4">
                                                            <button
                                                                type="button"
                                                                className={`btn w-100 ${num === 'C' || num === '⌫' ? 'btn-outline-danger' : 'btn-outline-primary'}`}
                                                                onClick={() => handleNumpadClick(num)}
                                                                style={{ 
                                                                    height: '50px', 
                                                                    fontSize: '1.2rem',
                                                                    fontWeight: '500'
                                                                }}
                                                            >
                                                                {num}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="col-12">
                                            <div className="row g-2">
                                                <div className="col-6">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-primary w-100"
                                                        onClick={() => handleNumpadClick('.')}
                                                        style={{ 
                                                            height: '50px', 
                                                            fontSize: '1.2rem',
                                                            fontWeight: '500'
                                                        }}
                                                    >
                                                        .
                                                    </button>
                                                </div>
                                                <div className="col-6">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-primary w-100"
                                                        onClick={() => handleNumpadClick('00')}
                                                        style={{ 
                                                            height: '50px', 
                                                            fontSize: '1.2rem',
                                                            fontWeight: '500'
                                                        }}
                                                    >
                                                        00
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer p-2">
                                <div className="row g-2 w-100">
                                    <div className="col-6">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary w-100"
                                            onClick={handleCloseCambio}
                                            disabled={submitting}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                    <div className="col-6">
                                        <button 
                                            type="button" 
                                            className="btn btn-success w-100"
                                            onClick={handleSubmitOrderWithPayment}
                                            disabled={submitting || !paymentAmount || parseFloat(paymentAmount) < calculateTotal()}
                                        >
                                            {submitting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                    Processing...
                                                </>
                                            ) : (
                                                'Set Order'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Past Orders Modal */}
            {showPastOrders && (
                <div 
                    className="modal show d-block" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowPastOrders(false);
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Past Orders</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowPastOrders(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {pastOrders.length === 0 ? (
                                    <p className="text-muted text-center">No orders found</p>
                                ) : (
                                    <div className="list-group">
                                        {pastOrders.map(order => (
                                            <div key={order.order_id} className="list-group-item">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div>
                                                        <strong>#{order.ticket_number}</strong>
                                                        <br />
                                                        <small className="text-muted">
                                                            {new Date(order.created_at).toLocaleString()}
                                                        </small>
                                                    </div>
                                                    <div className="d-flex gap-2 align-items-center">
                                                        <span className="badge bg-success">€{Number(order.total).toFixed(2)}</span>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => deleteOrder(order.order_id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                                {order.order_items && order.order_items.length > 0 && (
                                                    <div className="small">
                                                        {order.order_items.map((item: any, idx: number) => (
                                                            <div key={idx} className="text-muted">
                                                                {item.quantity}x {item.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary w-100"
                                    onClick={() => setShowPastOrders(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
