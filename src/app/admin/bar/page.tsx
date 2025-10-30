'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

interface Order {
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

export default function BarAdminPage() {
    const [paidOrders, setPaidOrders] = useState<Order[]>([]);
    const [preparingOrders, setPreparingOrders] = useState<Order[]>([]);
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

    // Supabase Realtime subscription for orders
    useEffect(() => {
        console.log('🔴 [BarAdmin] Setting up Realtime subscription for orders...');

        const ordersChannel = supabase
            .channel('bar-orders-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders'
                },
                (payload: any) => {
                    console.log('🔔 [BarAdmin] Realtime order change:', payload.eventType);
                    // Refresh orders when any change occurs
                    fetchOrders();
                }
            )
            .subscribe((status) => {
                console.log('🔴 [BarAdmin] Realtime subscription status:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [BarAdmin] Successfully subscribed to orders realtime updates');
                }
            });

        return () => {
            console.log('🛑 [BarAdmin] Cleaning up Realtime subscription');
            supabase.removeChannel(ordersChannel);
        };
    }, []);

    const fetchOrders = async () => {
        try {
            // Fetch paid orders
            const paidRes = await fetch('/api/orders?status=paid&limit=50');
            const paidData = await paidRes.json();

            // Fetch preparing orders
            const preparingRes = await fetch('/api/orders?status=preparing&limit=50');
            const preparingData = await preparingRes.json();

            if (paidData.orders) {
                setPaidOrders(paidData.orders);
            }
            if (preparingData.orders) {
                setPreparingOrders(preparingData.orders);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartPreparing = async (orderId: string) => {
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'preparing' })
            });

            if (res.ok) {
                // Move from paid to preparing
                const order = paidOrders.find(o => o.order_id === orderId);
                if (order) {
                    setPaidOrders(prev => prev.filter(o => o.order_id !== orderId));
                    setPreparingOrders(prev => [{ ...order, status: 'preparing' }, ...prev]);
                }
            } else {
                alert('Failed to update order');
            }
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Error updating order');
        } finally {
            setUpdating(null);
        }
    };

    const handleMarkCompleted = async (orderId: string) => {
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' })
            });

            if (res.ok) {
                // Remove from preparing
                setPreparingOrders(prev => prev.filter(o => o.order_id !== orderId));
                alert('Order completed!');
            } else {
                alert('Failed to update order');
            }
        } catch (error) {
            console.error('Error updating order:', error);
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
                    <h2 className="text-white">👨‍🍳 Bar Dashboard</h2>
                    <button className="btn btn-outline-light" onClick={handleLogout}>
                        Logout
                    </button>
                </div>

                <div className="row g-4">
                    {/* Paid Orders - Ready to Start */}
                    <div className="col-md-6">
                        <div className="card mb-3 shadow" style={{ backgroundColor: '#28a745', border: 'none' }}>
                            <div className="card-header text-white">
                                <h4 className="mb-0 fw-bold">
                                    ✅ Ready to Prepare ({paidOrders.length})
                                </h4>
                            </div>
                        </div>

                        {paidOrders.length === 0 ? (
                            <div className="alert" style={{ backgroundColor: '#3a3f47', color: 'white', border: 'none' }}>
                                <div className="text-center py-3">
                                    <p className="mb-0">No orders waiting to be prepared</p>
                                </div>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                {paidOrders.map(order => (
                                    <div key={order.order_id} className="card shadow" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                                        <div className="card-header text-center" style={{ backgroundColor: '#28a745', color: 'white' }}>
                                            <h3 className="mb-1 fw-bold">
                                                {order.ticket_number || '⚠️ NO TICKET #'}
                                            </h3>
                                            {!order.ticket_number && (
                                                <small className="text-warning d-block">
                                                    Old order without ticket number
                                                </small>
                                            )}
                                            <small style={{ opacity: 0.8 }}>
                                                {new Date(order.created_at).toLocaleString()}
                                            </small>
                                        </div>
                                        <div className="card-body text-white">
                                            <ul className="list-unstyled mb-3">
                                                {order.order_items.map((item, idx) => (
                                                    <li key={idx} className="mb-2 ps-2" style={{ borderLeft: '3px solid #28a745', fontSize: '1.1rem' }}>
                                                        <strong className="text-success">{item.quantity}x</strong> {item.name}
                                                    </li>
                                                ))}
                                            </ul>

                                            <button
                                                className="btn btn-light w-100 fw-bold"
                                                onClick={() => handleStartPreparing(order.order_id)}
                                                disabled={updating === order.order_id}
                                                style={{ padding: '12px' }}
                                            >
                                                {updating === order.order_id ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                        Starting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-play-circle me-2"></i>
                                                        Start Preparing
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Preparing Orders */}
                    <div className="col-md-6">
                        <div className="card mb-3 shadow" style={{ backgroundColor: '#ffc107', border: 'none' }}>
                            <div className="card-header" style={{ color: '#000' }}>
                                <h4 className="mb-0 fw-bold">
                                    🔥 In Preparation ({preparingOrders.length})
                                </h4>
                            </div>
                        </div>

                        {preparingOrders.length === 0 ? (
                            <div className="alert" style={{ backgroundColor: '#3a3f47', color: 'white', border: 'none' }}>
                                <div className="text-center py-3">
                                    <p className="mb-0">No orders currently being prepared</p>
                                </div>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                {preparingOrders.map(order => (
                                    <div key={order.order_id} className="card shadow" style={{ backgroundColor: '#3a3f47', border: '2px solid #ffc107' }}>
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
                                            <ul className="list-unstyled mb-3">
                                                {order.order_items.map((item, idx) => (
                                                    <li key={idx} className="mb-2 ps-2" style={{ borderLeft: '3px solid #ffc107', fontSize: '1.1rem' }}>
                                                        <strong style={{ color: '#ffc107' }}>{item.quantity}x</strong> {item.name}
                                                    </li>
                                                ))}
                                            </ul>

                                            <button
                                                className="btn btn-success w-100 fw-bold"
                                                onClick={() => handleMarkCompleted(order.order_id)}
                                                disabled={updating === order.order_id}
                                                style={{ padding: '12px' }}
                                            >
                                                {updating === order.order_id ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                        Completing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-check-circle me-2"></i>
                                                        Mark as Completed
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
