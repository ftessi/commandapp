import React from 'react';
import Link from 'next/link';
import { useProducts } from '../context/ProductsDataContext';
import { Order, OrderStatus } from '../types/types';

const OrderHistory: React.FC = () => {
    const { currentOrders, pastOrders, navigateToMenu } = useProducts();

    const formatDate = (timestamp: string): string => {
        return new Date(timestamp).toLocaleString();
    };

    const getStatusBadgeClass = (status: OrderStatus): string => {
        switch (status) {
            case OrderStatus.PENDING:
                return 'bg-info';
            case OrderStatus.PAID:
                return 'bg-primary';
            case OrderStatus.PREPARING:
                return 'bg-warning';
            case OrderStatus.COMPLETED:
                return 'bg-success';
            default:
                return 'bg-secondary';
        }
    };

    const renderOrderCard = (order: Order, isCurrent: boolean = false) => {
        console.log('🎨 [OrderHistory] Rendering order:', order.orderId, 'Items:', order.items);

        return (
            <div
                key={order.orderId}
                className={`card dark-card mb-4 shadow ${isCurrent ? 'order-card-active' : ''}`}
            >
                <div className="card-header dark-card-header d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="card-title mb-0 text-white">
                            Order #{order.ticketNumber}
                            {isCurrent && <span className="ms-2 badge bg-warning text-dark">Active</span>}
                        </h5>
                        <small className="text-muted">{formatDate(order.timestamp)}</small>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                    </span>
                </div>
                <div className="card-body">
                    <h6 className="mb-3 text-warning">Items</h6>
                    {order.items && order.items.length > 0 ? (
                        order.items.map((item, index) => (
                            <div key={`${item.productId}-${index}`} className="d-flex justify-content-between mb-2">
                                <div className="text-white">
                                    {item.name} <span className="text-muted">x{item.quantity}</span>
                                </div>
                                <div className="text-white">${(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                        ))
                    ) : (
                        <div className="text-muted">No items found</div>
                    )}
                    <hr className="dark-hr" />
                    <div className="d-flex justify-content-between">
                        <h6 className="text-white">Total</h6>
                        <h6 className="text-warning">${order.total.toFixed(2)}</h6>
                    </div>
                </div>
                {isCurrent && (
                    <div className="card-footer dark-card-footer">
                        <p className="mb-0 text-center">
                            <small className="text-muted">Listening for updates from the server...</small>
                        </p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="dark-page">
            <div className="container py-5">
                {/* Header */}
                <div className="mb-5">
                    <h1 className="display-4">📋 My Orders</h1>
                </div>

                {currentOrders.length > 0 && (
                    <div className="mb-5">
                        <h4 className="mb-4">
                            Active Orders
                            <span className="badge bg-warning text-dark ms-2">{currentOrders.length}</span>
                        </h4>
                        {currentOrders.map(order => renderOrderCard(order, true))}
                    </div>
                )}

                {pastOrders.length > 0 && (
                    <div>
                        <h4 className="mb-4">Order History</h4>
                        {pastOrders.map(order => renderOrderCard(order))}
                    </div>
                )}

                {currentOrders.length === 0 && pastOrders.length === 0 && (
                    <div className="card dark-card shadow text-center p-5">
                        <div className="card-body">
                            <i className="bi bi-bag-x empty-state-icon"></i>
                            <p className="mt-4 mb-0 text-white">You don't have any orders yet.</p>
                            <button
                                onClick={() => navigateToMenu()}
                                className="btn btn-warning mt-4"
                            >
                                Start Ordering
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistory;