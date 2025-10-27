'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Order, OrderStatus } from '@/types/types';
import { supabase } from '@/services/supabaseClient';

// API response type (snake_case from database)
interface ApiOrder {
    order_id: string;
    ticket_number: string;
    total: number;
    status: string;
    created_at: string;
    order_items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
}

export default function PaymentAdminPage() {
    const [orders, setOrders] = useState<ApiOrder[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<ApiOrder[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Check authentication
        const isAuth = localStorage.getItem('adminAuth');
        if (!isAuth) {
            router.push('/admin');
            return;
        }

        fetchOrders();
    }, [router]);

    // Realtime subscription for orders
    useEffect(() => {
        const ordersChannel = supabase
            .channel('payment-orders-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders'
                },
                (payload: any) => {
                    console.log('🔔 [PaymentAdmin] Realtime order change:', payload.eventType);
                    // Refresh orders when any change occurs
                    fetchOrders();
                }
            )
            .subscribe((status) => {
                console.log('🔴 [PaymentAdmin] Realtime subscription status:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [PaymentAdmin] Successfully subscribed to orders realtime updates');
                }
            });

        return () => {
            console.log('🛑 [PaymentAdmin] Cleaning up Realtime subscription');
            supabase.removeChannel(ordersChannel);
        };
    }, []);

    const fetchOrders = async () => {
        console.log('📋 Fetching pending orders...');
        try {
            // Fetch pending orders
            const url = '/api/orders?status=pending&limit=100';
            console.log('📡 Fetching from:', url);
            const res = await fetch(url);
            console.log('📨 Response status:', res.status);
            const data = await res.json();
            console.log('📦 Response data:', data);

            if (data.orders) {
                console.log(`✅ Loaded ${data.orders.length} pending orders`);
                console.log('📦 Sample order:', data.orders[0]);
                setOrders(data.orders);
                setFilteredOrders(data.orders);
            }
        } catch (error) {
            console.error('❌ Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        if (!term.trim()) {
            setFilteredOrders(orders);
        } else {
            const filtered = orders.filter(order =>
                order.ticket_number.toLowerCase().includes(term.toLowerCase())
            );
            setFilteredOrders(filtered);
        }
    };

    const handleMarkAsPaid = async (orderId: string) => {
        console.log('💰 Marking order as paid:', orderId);
        setUpdating(orderId);
        try {
            const url = `/api/orders/${orderId}`;
            console.log('📡 Sending PATCH request to:', url);
            console.log('📦 Request payload:', { status: 'paid' });

            const res = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'paid' })
            });

            console.log('📨 Response status:', res.status);
            console.log('📨 Response ok:', res.ok);

            if (res.ok) {
                const data = await res.json();
                console.log('✅ Order updated successfully:', data);
                // Remove from list
                setOrders(prev => prev.filter(o => o.order_id !== orderId));
                setFilteredOrders(prev => prev.filter(o => o.order_id !== orderId));
                alert('Order marked as paid!');
            } else {
                const errorData = await res.json();
                console.error('❌ Failed to update order:', errorData);
                alert(`Failed to update order: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Error updating order:', error);
            alert('Error updating order');
        } finally {
            setUpdating(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminRole');
        router.push('/admin');
    };

    if (loading) {
        return (
            <div className="min-vh-100" style={{ backgroundColor: '#282c34', color: 'white' }}>
                <div className="container py-5 text-center">
                    <div className="spinner-border text-light" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100" style={{ backgroundColor: '#282c34', color: 'white' }}>
            <div className="container-fluid py-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="text-white">💰 Payment Admin Dashboard</h2>
                    <button className="btn btn-outline-light" onClick={handleLogout}>
                        Logout
                    </button>
                </div>

                {/* Search Card */}
                <div className="card mb-4" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                    <div className="card-body">
                        <input
                            type="text"
                            className="form-control"
                            style={{ backgroundColor: '#282c34', color: 'white', border: '1px solid #495057' }}
                            placeholder="Search by ticket number..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Orders List */}
                <div className="row g-3">
                    {filteredOrders.length === 0 ? (
                        <div className="col-12">
                            <div className="alert" style={{ backgroundColor: '#3a3f47', color: 'white', border: 'none' }}>
                                <div className="text-center py-3">
                                    <h5>No pending orders found</h5>
                                    <p className="text-muted mb-0">New orders will appear here</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        filteredOrders.map(order => (
                            <div key={order.order_id} className="col-md-6 col-lg-4">
                                <div className="card h-100 shadow" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                                    <div className="card-header text-center" style={{ backgroundColor: '#ffc107', color: '#000' }}>
                                        <h3 className="mb-1 fw-bold">
                                            {order.ticket_number || '⚠️ NO TICKET #'}
                                        </h3>
                                        {!order.ticket_number && (
                                            <small className="text-danger d-block">
                                                Old order without ticket number
                                            </small>
                                        )}
                                        <small style={{ color: '#666' }}>
                                            {new Date(order.created_at).toLocaleString()}
                                        </small>
                                    </div>
                                    <div className="card-body text-white">
                                        <h4 className="text-center mb-3" style={{ color: '#ffc107' }}>
                                            €{order.total.toFixed(2)}
                                        </h4>

                                        <div className="mb-3">
                                            <strong className="d-block mb-2">Items:</strong>
                                            <ul className="list-unstyled">
                                                {order.order_items.map((item, idx) => (
                                                    <li key={idx} className="mb-1 ps-2" style={{ borderLeft: '3px solid #ffc107' }}>
                                                        <strong>{item.quantity}x</strong> {item.name}
                                                        <span className="float-end text-muted">€{item.price.toFixed(2)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <button
                                            className="btn btn-success w-100 fw-bold"
                                            onClick={() => handleMarkAsPaid(order.order_id)}
                                            disabled={updating === order.order_id}
                                            style={{ padding: '12px' }}
                                        >
                                            {updating === order.order_id ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-check-circle me-2"></i>
                                                    Mark as Paid
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
