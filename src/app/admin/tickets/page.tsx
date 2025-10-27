'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';

interface Ticket {
    id: string;
    ticket_number: string;
    ticket_type_name: string;
    first_name: string;
    last_name: string;
    email: string;
    price: number;
    status: string;
    entry_redeemed: boolean;
    entry_redeemed_at: string | null;
    entry_redeemed_by: string | null;
    sessions?: {
        session_token: string;
        first_name: string;
        last_name: string;
        email: string;
    };
}

export default function TicketsAdminPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [redeeming, setRedeeming] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [qrInput, setQrInput] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Check authentication
        const isAuth = localStorage.getItem('adminAuth');
        if (!isAuth) {
            router.push('/admin');
            return;
        }

        fetchTickets();
    }, [router]);

    useEffect(() => {
        filterTickets();
    }, [tickets, searchTerm, statusFilter]);

    useEffect(() => {
        // Cleanup scanner on unmount
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const fetchTickets = async () => {
        console.log('📋 Fetching tickets...');
        try {
            const res = await fetch('/api/tickets?limit=200');
            const data = await res.json();

            if (data.tickets) {
                console.log(`✅ Loaded ${data.tickets.length} tickets`);
                setTickets(data.tickets);
                setFilteredTickets(data.tickets);
            }
        } catch (error) {
            console.error('❌ Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterTickets = () => {
        let filtered = tickets;

        // Filter by status
        if (statusFilter !== 'all') {
            if (statusFilter === 'redeemed') {
                filtered = filtered.filter(t => t.entry_redeemed);
            } else if (statusFilter === 'not_redeemed') {
                filtered = filtered.filter(t => !t.entry_redeemed && t.status === 'paid');
            } else {
                filtered = filtered.filter(t => t.status === statusFilter);
            }
        }

        // Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(t =>
                t.ticket_number?.toLowerCase().includes(term) ||
                t.first_name.toLowerCase().includes(term) ||
                t.last_name.toLowerCase().includes(term) ||
                t.email.toLowerCase().includes(term) ||
                (t.sessions?.first_name?.toLowerCase().includes(term)) ||
                (t.sessions?.last_name?.toLowerCase().includes(term))
            );
        }

        setFilteredTickets(filtered);
    };

    const startScanner = async () => {
        try {
            const html5QrCode = new Html5Qrcode("qr-reader");
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    console.log('QR Code scanned:', decodedText);
                    // Extract session token from URL
                    const match = decodedText.match(/\/qr\/([a-f0-9-]+)/i);
                    if (match) {
                        setQrInput(match[1]);
                        stopScanner();
                    } else {
                        setQrInput(decodedText);
                        stopScanner();
                    }
                },
                (errorMessage) => {
                    // Ignore scan errors, they happen frequently
                }
            );

            setShowScanner(true);
        } catch (error) {
            console.error('Error starting scanner:', error);
            alert('Failed to start camera. Please check permissions.');
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current = null;
                setShowScanner(false);
            } catch (error) {
                console.error('Error stopping scanner:', error);
            }
        }
    };

    const handleMarkAsPaid = async (ticketId: string) => {
        if (!confirm('Mark this ticket as paid? This will generate a QR code and send an email to the user.')) return;

        setUpdating(ticketId);

        try {
            const res = await fetch(`/api/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'paid' })
            });

            const data = await res.json();

            if (res.ok) {
                alert('✅ Ticket marked as paid! QR code generated and email sent.');
                fetchTickets();
            } else {
                alert(`❌ ${data.error || 'Failed to update ticket'}`);
            }
        } catch (error) {
            console.error('❌ Error marking ticket as paid:', error);
            alert('Error updating ticket');
        } finally {
            setUpdating(null);
        }
    };

    const handleRedeemByQR = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!qrInput.trim()) {
            alert('Please enter a QR code');
            return;
        }

        const adminName = localStorage.getItem('adminRole') || 'admin';
        setRedeeming('qr-scan');

        try {
            const res = await fetch(`/api/tickets/scan/redeem`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qrCode: qrInput.trim(),
                    adminName
                })
            });

            const data = await res.json();

            if (res.ok) {
                alert(`✅ Ticket redeemed successfully!\n\nName: ${data.ticket.first_name} ${data.ticket.last_name}\nType: ${data.ticket.ticket_type_name}`);
                setQrInput('');
                fetchTickets(); // Refresh list
            } else {
                if (data.error === 'Ticket already used for entry') {
                    alert(`⚠️ This ticket was already used for entry!\n\nRedeemed at: ${new Date(data.redeemedAt).toLocaleString()}\nBy: ${data.redeemedBy}`);
                } else if (data.error === 'Ticket has not been paid yet') {
                    alert('⚠️ This ticket has not been paid yet!');
                } else {
                    alert(`❌ ${data.error || 'Failed to redeem ticket'}`);
                }
            }
        } catch (error) {
            console.error('❌ Error redeeming ticket:', error);
            alert('Error redeeming ticket');
        } finally {
            setRedeeming(null);
        }
    };

    const handleRedeemById = async (ticketId: string) => {
        if (!confirm('Redeem this ticket for entry?')) return;

        const adminName = localStorage.getItem('adminRole') || 'admin';
        setRedeeming(ticketId);

        try {
            const res = await fetch(`/api/tickets/${ticketId}/redeem`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminName })
            });

            const data = await res.json();

            if (res.ok) {
                alert('✅ Ticket redeemed for entry!');
                fetchTickets();
            } else {
                alert(`❌ ${data.error || 'Failed to redeem ticket'}`);
            }
        } catch (error) {
            console.error('❌ Error redeeming ticket:', error);
            alert('Error redeeming ticket');
        } finally {
            setRedeeming(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminRole');
        router.push('/admin');
    };

    const getStatusBadge = (ticket: Ticket) => {
        if (ticket.entry_redeemed) {
            return <span className="badge bg-success">✓ Entry Used</span>;
        }
        switch (ticket.status) {
            case 'paid':
                return <span className="badge bg-primary">Paid - Ready</span>;
            case 'pending':
                return <span className="badge bg-warning text-dark">Pending Payment</span>;
            default:
                return <span className="badge bg-secondary">{ticket.status}</span>;
        }
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
                    <h2 className="text-white">🎫 Tickets Admin Dashboard</h2>
                    <button className="btn btn-outline-light" onClick={handleLogout}>
                        Logout
                    </button>
                </div>

                {/* QR Scanner Card */}
                <div className="card mb-4" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                    <div className="card-body">
                        <h5 className="text-warning mb-3">🔍 Scan QR Code for Entry</h5>

                        {showScanner && (
                            <div className="mb-3">
                                <div id="qr-reader" style={{ width: '100%' }}></div>
                                <button
                                    type="button"
                                    className="btn btn-danger mt-2"
                                    onClick={stopScanner}
                                >
                                    Stop Scanner
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleRedeemByQR} className="row g-3">
                            <div className="col-md-8">
                                <input
                                    type="text"
                                    className="form-control form-control-lg"
                                    style={{ backgroundColor: '#282c34', color: 'white', border: '1px solid #495057' }}
                                    placeholder="Scan or enter session token..."
                                    value={qrInput}
                                    onChange={(e) => setQrInput(e.target.value)}
                                    autoFocus={!showScanner}
                                />
                            </div>
                            <div className="col-md-2">
                                <button
                                    type="button"
                                    className="btn btn-info btn-lg w-100"
                                    onClick={showScanner ? stopScanner : startScanner}
                                >
                                    <i className={`bi bi-${showScanner ? 'x' : 'camera'}`}></i> {showScanner ? 'Close' : 'Scan'}
                                </button>
                            </div>
                            <div className="col-md-2">
                                <button
                                    type="submit"
                                    className="btn btn-success btn-lg w-100"
                                    disabled={redeeming === 'qr-scan' || !qrInput.trim()}
                                >
                                    {redeeming === 'qr-scan' ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Checking...
                                        </>
                                    ) : (
                                        'Redeem'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Filters */}
                <div className="card mb-4" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ backgroundColor: '#282c34', color: 'white', border: '1px solid #495057' }}
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="col-md-4">
                                <select
                                    className="form-select"
                                    style={{ backgroundColor: '#282c34', color: 'white', border: '1px solid #495057' }}
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Tickets</option>
                                    <option value="paid">Paid</option>
                                    <option value="pending">Pending Payment</option>
                                    <option value="not_redeemed">Ready for Entry</option>
                                    <option value="redeemed">Already Entered</option>
                                </select>
                            </div>
                            <div className="col-md-2 text-end">
                                <button className="btn btn-light" onClick={fetchTickets}>
                                    <i className="bi bi-arrow-clockwise"></i> Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="row g-3 mb-4">
                    <div className="col-md-3">
                        <div className="card text-center" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                            <div className="card-body">
                                <h3 className="text-warning">{tickets.length}</h3>
                                <p className="mb-0 text-muted">Total Tickets</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-center" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                            <div className="card-body">
                                <h3 className="text-primary">{tickets.filter(t => t.status === 'paid').length}</h3>
                                <p className="mb-0 text-muted">Paid</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-center" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                            <div className="card-body">
                                <h3 className="text-success">{tickets.filter(t => t.entry_redeemed).length}</h3>
                                <p className="mb-0 text-muted">Entries Used</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-center" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                            <div className="card-body">
                                <h3 className="text-info">{tickets.filter(t => t.status === 'paid' && !t.entry_redeemed).length}</h3>
                                <p className="mb-0 text-muted">Ready for Entry</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tickets List */}
                <div className="row g-3">
                    {filteredTickets.length === 0 ? (
                        <div className="col-12">
                            <div className="alert" style={{ backgroundColor: '#3a3f47', color: 'white', border: 'none' }}>
                                <div className="text-center py-3">
                                    <h5>No tickets found</h5>
                                    <p className="text-muted mb-0">Try adjusting your filters</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        filteredTickets.map(ticket => (
                            <div key={ticket.id} className="col-md-6 col-lg-4">
                                <div className="card h-100" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                                    <div className="card-body">
                                        {/* Ticket Number - PROMINENT */}
                                        <div className="text-center mb-3">
                                            <div className="badge bg-warning text-dark fs-5 px-3 py-2">
                                                {ticket.ticket_number || 'Pending...'}
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <h5 className="text-warning mb-0">{ticket.ticket_type_name}</h5>
                                            {getStatusBadge(ticket)}
                                        </div>

                                        <div className="mb-3">
                                            <p className="mb-1 text-white">
                                                <strong>{ticket.sessions?.first_name || ticket.first_name} {ticket.sessions?.last_name || ticket.last_name}</strong>
                                            </p>
                                            <p className="mb-0 text-muted small">{ticket.sessions?.email || ticket.email}</p>
                                        </div>

                                        <p className="text-muted small mb-3">
                                            €{ticket.price.toFixed(2)}
                                        </p>

                                        {ticket.entry_redeemed ? (
                                            <div className="alert alert-success mb-0 small">
                                                <strong>Entry used</strong><br />
                                                {ticket.entry_redeemed_at && new Date(ticket.entry_redeemed_at).toLocaleString()}<br />
                                                By: {ticket.entry_redeemed_by}
                                            </div>
                                        ) : ticket.status === 'paid' ? (
                                            <button
                                                className="btn btn-success w-100"
                                                onClick={() => handleRedeemById(ticket.id)}
                                                disabled={redeeming === ticket.id}
                                            >
                                                {redeeming === ticket.id ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                        Redeeming...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-check-circle me-2"></i>
                                                        Redeem for Entry
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-warning w-100 text-dark fw-bold"
                                                onClick={() => handleMarkAsPaid(ticket.id)}
                                                disabled={updating === ticket.id}
                                            >
                                                {updating === ticket.id ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-credit-card me-2"></i>
                                                        Mark as Paid
                                                    </>
                                                )}
                                            </button>
                                        )}
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
