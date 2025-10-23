import React from 'react'
import Link from 'next/link'
import { useProducts } from '../context/ProductsDataContext'

function Navbar() {
    const { navigateToMenu, navigateToOrderHistory, currentOrders, pastOrders, currentView } = useProducts();
    const ordersCount = currentOrders.length;
    const hasAnyOrders = currentOrders.length > 0 || pastOrders.length > 0;
    const isOnOrderHistory = currentView === 'orderHistory';

    const handleOrdersClick = () => {
        if (isOnOrderHistory) {
            // If already on order history, go back to menu
            navigateToMenu();
        } else {
            // If on menu, go to order history
            navigateToOrderHistory();
        }
    };

    return (
        <>
            <style jsx>{`
                .orders-toggle-btn {
                    transition: background-color 0.5s ease-in-out, 
                                border-color 0.5s ease-in-out, 
                                color 0.5s ease-in-out !important;
                }
                
                .orders-toggle-btn.btn-outline-warning {
                    background-color: transparent;
                    border-color: var(--accent-color);
                    color: var(--accent-color);
                }
                
                .orders-toggle-btn.btn-warning {
                    background-color: var(--accent-color);
                    border-color: var(--accent-color);
                    color: var(--text-dark);
                }
            `}</style>

            <nav className="navbar sticky-top navbar-expand-lg dark-navbar">
                <div className="container-fluid">
                    <Link href="/" className="navbar-brand text-decoration-none text-white" style={{ textAlign: 'center' }}>
                        7VITE
                    </Link>
                    <div>
                        {hasAnyOrders && (
                            <button
                                className={`btn orders-toggle-btn ${isOnOrderHistory ? 'btn-warning' : 'btn-outline-warning'}`}
                                type="button"
                                onClick={handleOrdersClick}
                            >
                                <i className="bi bi-clock-history"></i> My Orders
                                {ordersCount > 0 && (
                                    <span className="badge bg-danger ms-1">{ordersCount}</span>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </nav>
        </>
    )
} export default Navbar
