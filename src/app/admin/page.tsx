'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simple authentication (in production, use proper auth)
        if (username === 'admin' && password === 'admin123') {
            // Store auth in session/localStorage
            localStorage.setItem('adminAuth', 'true');
            localStorage.setItem('adminRole', 'payment'); // or 'bar' or 'tickets'
            router.push('/admin/payments');
        } else if (username === 'bar' && password === 'bar123') {
            localStorage.setItem('adminAuth', 'true');
            localStorage.setItem('adminRole', 'bar');
            router.push('/admin/bar');
        } else if (username === 'tickets' && password === 'tickets123') {
            localStorage.setItem('adminAuth', 'true');
            localStorage.setItem('adminRole', 'tickets');
            router.push('/admin/tickets');
        } else {
            setError('Invalid credentials');
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#282c34' }}>
            <div className="container" style={{ maxWidth: '450px' }}>
                <div className="card shadow-lg" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                    <div className="card-body p-4">
                        <h2 className="card-title text-center mb-4 text-white">
                            🔐 Admin Login
                        </h2>

                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin}>
                            <div className="mb-3">
                                <label htmlFor="username" className="form-label text-white">Username</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ backgroundColor: '#282c34', color: 'white', border: '1px solid #495057' }}
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="password" className="form-label text-white">Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    style={{ backgroundColor: '#282c34', color: 'white', border: '1px solid #495057' }}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="d-grid gap-2">
                                <button
                                    type="submit"
                                    className="btn btn-light btn-lg fw-bold"
                                    disabled={loading}
                                    style={{ padding: '12px' }}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Logging in...
                                        </>
                                    ) : (
                                        'Login'
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-4 p-3" style={{ backgroundColor: '#282c34', borderRadius: '8px' }}>
                            <small className="text-white">
                                <strong className="d-block mb-2">Default credentials:</strong>
                                <div className="d-flex justify-content-between mb-1">
                                    <span>💰 Payment Admin:</span>
                                    <code style={{ color: '#ffc107' }}>admin / admin123</code>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                    <span>👨‍🍳 Bar Admin:</span>
                                    <code style={{ color: '#28a745' }}>bar / bar123</code>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span>🎫 Tickets Admin:</span>
                                    <code style={{ color: '#17a2b8' }}>tickets / tickets123</code>
                                </div>
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
