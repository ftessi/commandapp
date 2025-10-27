'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/services/supabaseClient';

export default function ServiceControlPage() {
    const [isServiceOpen, setIsServiceOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>('');

    useEffect(() => {
        fetchServiceStatus();
    }, []);

    // Supabase Realtime subscription for service status
    useEffect(() => {
        console.log('🔴 [ServiceControl] Setting up Realtime subscription for service status...');
        
        const serviceChannel = supabase
            .channel('service-status-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'service_status'
                },
                (payload: any) => {
                    console.log('🔔 [ServiceControl] Realtime service status change:', payload.eventType);
                    fetchServiceStatus();
                }
            )
            .subscribe((status) => {
                console.log('🔴 [ServiceControl] Realtime subscription status:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [ServiceControl] Successfully subscribed to service status realtime updates');
                }
            });

        return () => {
            console.log('🛑 [ServiceControl] Cleaning up Realtime subscription');
            supabase.removeChannel(serviceChannel);
        };
    }, []);

    const fetchServiceStatus = async () => {
        try {
            const response = await fetch('/api/service-status?service=ordering');
            if (response.ok) {
                const data = await response.json();
                setIsServiceOpen(data.is_open);
                setLastUpdated(data.updated_at);
            }
        } catch (error) {
            console.error('Error fetching service status:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleService = async () => {
        setUpdating(true);
        try {
            const response = await fetch('/api/service-status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_name: 'ordering',
                    is_open: !isServiceOpen
                })
            });

            if (response.ok) {
                const data = await response.json();
                setIsServiceOpen(data.data.is_open);
                setLastUpdated(data.data.updated_at);
                alert(`✅ Service is now ${data.data.is_open ? 'OPEN' : 'CLOSED'}`);
            } else {
                alert('Failed to update service status');
            }
        } catch (error) {
            console.error('Error updating service status:', error);
            alert('Error updating service status');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#282c34' }}>
                <div className="spinner-border text-warning" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100" style={{ backgroundColor: '#282c34', padding: '20px' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="text-white">🎛️ Service Control</h1>
                    <Link href="/admin/payments" className="btn btn-outline-light">
                        ← Back to Admin
                    </Link>
                </div>

                {/* Status Card */}
                <div className="card shadow-lg mb-4" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                    <div className="card-body p-5 text-center">
                        <div className="mb-4">
                            {isServiceOpen ? (
                                <i className="bi bi-door-open-fill text-success" style={{ fontSize: '6rem' }}></i>
                            ) : (
                                <i className="bi bi-door-closed-fill text-danger" style={{ fontSize: '6rem' }}></i>
                            )}
                        </div>

                        <h2 className="text-white mb-3">
                            Ordering Service is {isServiceOpen ? '🟢 OPEN' : '🔴 CLOSED'}
                        </h2>

                        {lastUpdated && (
                            <p className="text-muted">
                                Last updated: {new Date(lastUpdated).toLocaleString()}
                            </p>
                        )}

                        <div className="mt-4">
                            <button
                                className={`btn btn-lg fw-bold ${isServiceOpen ? 'btn-danger' : 'btn-success'}`}
                                onClick={toggleService}
                                disabled={updating}
                                style={{ minWidth: '200px', padding: '15px' }}
                            >
                                {updating ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        {isServiceOpen ? '🔒 Close Service' : '🔓 Open Service'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="row g-3">
                    {/* Current Status Info */}
                    <div className="col-md-6">
                        <div className="card h-100" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                            <div className="card-body">
                                <h5 className="card-title text-white mb-3">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Current Status
                                </h5>
                                {isServiceOpen ? (
                                    <ul className="text-white-50 small mb-0">
                                        <li className="mb-2">✅ Customers can add items to cart</li>
                                        <li className="mb-2">✅ + and - buttons are enabled</li>
                                        <li className="mb-2">✅ Checkout button shows price</li>
                                        <li className="mb-2">✅ Orders can be placed</li>
                                    </ul>
                                ) : (
                                    <ul className="text-white-50 small mb-0">
                                        <li className="mb-2">❌ Customers cannot add items</li>
                                        <li className="mb-2">❌ + and - buttons are disabled</li>
                                        <li className="mb-2">❌ Checkout shows "We are closed!"</li>
                                        <li className="mb-2">❌ No new orders accepted</li>
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* When to Use */}
                    <div className="col-md-6">
                        <div className="card h-100" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                            <div className="card-body">
                                <h5 className="card-title text-white mb-3">
                                    <i className="bi bi-clock me-2"></i>
                                    When to Use
                                </h5>
                                <div className="text-white-50 small">
                                    <p className="mb-2"><strong className="text-warning">Close Service:</strong></p>
                                    <ul className="mb-3" style={{ paddingLeft: '20px' }}>
                                        <li>End of service hours</li>
                                        <li>Bar break/maintenance</li>
                                        <li>Staff shortage</li>
                                        <li>Emergency situations</li>
                                    </ul>

                                    <p className="mb-2"><strong className="text-success">Open Service:</strong></p>
                                    <ul className="mb-0" style={{ paddingLeft: '20px' }}>
                                        <li>Start of service hours</li>
                                        <li>Bar is ready to serve</li>
                                        <li>Event is active</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technical Info */}
                <div className="card mt-3" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                    <div className="card-body">
                        <h5 className="card-title text-white mb-3">
                            <i className="bi bi-gear me-2"></i>
                            Technical Details
                        </h5>
                        <ul className="text-white-50 small mb-0">
                            <li className="mb-2">Changes take effect within 30 seconds for all users</li>
                            <li className="mb-2">Status is stored in database (survives server restart)</li>
                            <li className="mb-2">All active users will see the change automatically</li>
                            <li>This page auto-refreshes every 10 seconds</li>
                        </ul>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="d-grid gap-2 mt-4">
                    <Link
                        href="/admin/payments"
                        className="btn btn-outline-light btn-lg"
                    >
                        View Payment Queue
                    </Link>
                    <Link
                        href="/admin/bar"
                        className="btn btn-outline-success btn-lg"
                    >
                        View Bar Orders
                    </Link>
                </div>
            </div>
        </div>
    );
}
