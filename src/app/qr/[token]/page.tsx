'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storeSessionToken } from '@/services/sessionService';

export default function QRScanPage({ params }: { params: { token: string } }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const restoreSession = async () => {
            const token = params.token;

            if (!token) {
                setError('No session token provided');
                setLoading(false);
                return;
            }

            console.log('📱 Restoring session from QR scan:', token);

            try {
                // Validate token exists in database
                const response = await fetch(`/api/sessions?token=${token}`);

                if (response.ok) {
                    const data = await response.json();

                    // Store token in localStorage
                    storeSessionToken(token);
                    console.log('✅ Session restored from QR code');

                    // Redirect to tickets page to see their ticket
                    setTimeout(() => {
                        router.push('/tickets');
                    }, 1500);
                } else {
                    setError('Invalid or expired QR code');
                    setLoading(false);
                }
            } catch (err) {
                console.error('❌ Error restoring session from QR:', err);
                setError('Failed to restore session');
                setLoading(false);
            }
        };

        restoreSession();
    }, [params.token, router]);

    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#282c34' }}>
                <div className="text-center">
                    <div className="spinner-border text-warning mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <h3 className="text-white">Restoring your session...</h3>
                    <p className="text-muted">Please wait</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#282c34' }}>
                <div className="container" style={{ maxWidth: '600px' }}>
                    <div className="card" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                        <div className="card-body text-center p-5">
                            <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '4rem' }}></i>
                            <h3 className="text-white mt-4 mb-3">QR Code Error</h3>
                            <p className="text-muted mb-4">{error}</p>
                            <a href="/order" className="btn btn-warning">
                                Go to Home
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#282c34' }}>
            <div className="container" style={{ maxWidth: '600px' }}>
                <div className="card" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                    <div className="card-body text-center p-5">
                        <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
                        <h3 className="text-white mt-4 mb-3">Session Restored!</h3>
                        <p className="text-muted mb-4">Redirecting you to your orders...</p>
                        <div className="spinner-border text-warning" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
