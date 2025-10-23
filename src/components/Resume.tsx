import React, { useState } from 'react'
import { useProducts } from '../context/ProductsDataContext';

function Resume() {
    const {
        getCartItems,
        cartTotal,
        updateCartQuantity,
        removeFromCart,
        navigateToMenu,
        navigateToOrderHistory,
        placeOrder,
        currentOrders
    } = useProducts();

    const cartItems = getCartItems();
    const [placedOrder, setPlacedOrder] = useState<any>(null);
    const [processingOrder, setProcessingOrder] = useState(false);

    const handleQuantityChange = (id: number, change: number) => {
        const product = cartItems.find(item => item.id === id);
        if (product) {
            const newQuantity = Math.max(0, product.quantityInCart + change);
            if (newQuantity === 0) {
                removeFromCart(id);
            } else {
                updateCartQuantity(id, newQuantity);
            }
        }
    };

    const handlePlaceOrder = async () => {
        console.log('🛒 [Resume] Placing order...');
        setProcessingOrder(true);
        try {
            const newOrder = await placeOrder();
            console.log('✅ [Resume] Order returned:', newOrder);
            if (newOrder) {
                console.log('🎫 [Resume] Ticket Number:', newOrder.ticketNumber);
                setPlacedOrder(newOrder);
            }
        } catch (error) {
            console.error('❌ [Resume] Error placing order:', error);
            alert('Failed to place order. Please try again.');
        } finally {
            setProcessingOrder(false);
        }
    };

    // Check if cart is empty
    if (cartItems.length === 0) {
        // If we placed an order, show confirmation with ticket number
        if (placedOrder) {
            console.log('🎫 [Resume] Displaying order confirmation for:', placedOrder);
            console.log('🎫 [Resume] Ticket Number to display:', placedOrder.ticketNumber);
            return (
                <div className="text-center p-4">
                    <div className="alert alert-success">
                        <h4 className="alert-heading">Order Placed Successfully!</h4>
                        <hr />
                        <h2 className="display-4 my-4">
                            {placedOrder.ticketNumber || placedOrder.ticket_number || 'N/A'}
                        </h2>
                        <p className="mb-0">Your ticket number</p>
                        <small className="text-muted d-block mt-2">
                            Please go to the payment counter and show this number
                        </small>
                    </div>
                    <div className="mt-4 d-flex justify-content-center gap-3">
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setPlacedOrder(null);
                                navigateToMenu();
                            }}
                        >
                            Place Another Order
                        </button>
                        <button
                            className="btn btn-outline-primary"
                            onClick={() => {
                                setPlacedOrder(null);
                                navigateToOrderHistory();
                            }}
                        >
                            View Orders
                        </button>
                    </div>
                </div>
            );
        }

        // Empty cart view
        return (
            <div className="text-center p-4">
                <h4>Your cart is empty</h4>
                <p>Add items to your cart to see them here</p>
                <div className="d-flex justify-content-center gap-3 mt-4">
                    <button
                        className="btn btn-primary"
                        onClick={navigateToMenu}
                    >
                        Browse Menu
                    </button>

                    {currentOrders.length > 0 && (
                        <button
                            className="btn btn-outline-primary"
                            onClick={navigateToOrderHistory}
                        >
                            View Active Orders ({currentOrders.length})
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Normal cart view - always show the cart when items are present
    return (
        <div className="resume-container p-3">
            <h3 className="mb-4 text-center">Your Order</h3>

            {cartItems.map(item => (
                <div key={item.id} className="card mb-3">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="card-title">{item.name}</h5>
                                <p className="card-text text-muted">${item.price.toFixed(2)} each</p>
                            </div>
                            <div className="d-flex align-items-center">
                                <button
                                    className="btn btn-sm btn-outline-danger me-2"
                                    onClick={() => handleQuantityChange(item.id, -1)}
                                >
                                    -
                                </button>
                                <span className="fw-bold">{item.quantityInCart}</span>
                                <button
                                    className="btn btn-sm btn-outline-success ms-2"
                                    onClick={() => handleQuantityChange(item.id, 1)}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        <div className="d-flex justify-content-between mt-2">
                            <span>Subtotal:</span>
                            <span className="fw-bold">${(item.price * item.quantityInCart).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            ))}

            <div className="card mt-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="card-title mb-0">Total</h5>
                        <h5 className="card-title mb-0">${cartTotal.toFixed(2)}</h5>
                    </div>
                </div>
            </div>

            <div className="d-grid gap-2 mt-4">
                <button
                    className="btn btn-primary btn-lg"
                    onClick={handlePlaceOrder}
                    disabled={processingOrder}
                >
                    {processingOrder ? 'Placing Order...' : 'Place Order'}
                </button>

                {currentOrders.length > 0 && (
                    <button
                        className="btn btn-outline-secondary"
                        onClick={navigateToOrderHistory}
                    >
                        View Active Orders ({currentOrders.length})
                    </button>
                )}
            </div>
        </div>
    )
}

export default Resume
