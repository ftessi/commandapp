'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    getStoredSessionToken,
    createTicketSession,
    storeSessionToken,
    clearSessionToken
} from '../services/sessionService';
import { supabase } from '../services/supabaseClient';

interface TicketType {
    id: number;
    name: string;
    description: string;
    price: number;
    available: boolean;
}

interface Ticket {
    id: string;
    ticket_number: string;
    ticket_type_name: string;
    first_name: string;
    last_name: string;
    email: string;
    price: number;
    status: 'pending' | 'paid';
    entry_redeemed: boolean;
    created_at: string;
}

export default function TicketsPage() {
    const [hasSession, setHasSession] = useState(false);
    const [myTicket, setMyTicket] = useState<Ticket | null>(null);
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

    // Form state
    const [selectedTicketType, setSelectedTicketType] = useState<number | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        const sessionToken = getStoredSessionToken();
        setHasSession(!!sessionToken);
        
        // Always fetch ticket types (needed for "Request More Tickets" section)
        fetchTicketTypes();
        
        if (sessionToken) {
            loadMyTicket(sessionToken);
        }
        setLoading(false);
    }, []);

    // Realtime subscription for ticket types
    useEffect(() => {
        const ticketTypesChannel = supabase
            .channel('ticket-types-changes')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'ticket_types' 
            }, () => {
                fetchTicketTypes();
            })
            .subscribe();
        
        return () => {
            supabase.removeChannel(ticketTypesChannel);
        };
    }, []);

    // Realtime subscription for user's tickets
    useEffect(() => {
        const sessionToken = getStoredSessionToken();
        if (!sessionToken) return;

        console.log('🔴 [TicketsPage] Setting up realtime subscription for user tickets');

        const ticketsChannel = supabase
            .channel('user-tickets-changes')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'tickets'
            }, (payload) => {
                console.log('🔔 [TicketsPage] Ticket update detected:', payload.eventType, payload.new);
                // Reload user's ticket whenever any ticket changes
                // (we fetch by session token, so only user's ticket will be returned)
                loadMyTicket(sessionToken);
            })
            .subscribe((status) => {
                console.log('🔴 [TicketsPage] Tickets subscription status:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [TicketsPage] Successfully subscribed to tickets updates');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ [TicketsPage] Tickets subscription error');
                } else if (status === 'TIMED_OUT') {
                    console.error('⏱️ [TicketsPage] Tickets subscription timed out');
                }
            });
        
        return () => {
            console.log('🛑 [TicketsPage] Cleaning up tickets subscription');
            supabase.removeChannel(ticketsChannel);
        };
    }, [hasSession]);

    const loadMyTicket = async (sessionToken: string) => {
        try {
            // Add timestamp to prevent caching
            const timestamp = new Date().getTime();
            const res = await fetch(`/api/tickets?sessionToken=${sessionToken}&_t=${timestamp}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            const data = await res.json();

            if (data.tickets && data.tickets.length > 0) {
                setMyTicket(data.tickets[0]);
                // Fetch QR code for this session
                fetchQRCode(sessionToken);
            } else {
                // Session doesn't exist or no tickets found - clear localStorage
                console.log('Session not found, clearing localStorage');
                clearSessionToken();
                setHasSession(false);
                fetchTicketTypes();
            }
        } catch (error) {
            console.error('Error loading ticket:', error);
            // On error, also clear localStorage to allow fresh start
            clearSessionToken();
            setHasSession(false);
            fetchTicketTypes();
        }
    };

    const fetchQRCode = async (sessionToken: string) => {
        try {
            const res = await fetch(`/api/qr-code?token=${sessionToken}`);
            const data = await res.json();

            if (data.qrDataUrl) {
                setQrCodeDataUrl(data.qrDataUrl);
            }
        } catch (error) {
            console.error('Error loading QR code:', error);
        }
    };

    const fetchTicketTypes = async () => {
        try {
            const res = await fetch('/api/ticket-types');
            const data = await res.json();
            if (data.ticketTypes) {
                setTicketTypes(data.ticketTypes);
            }
        } catch (error) {
            console.error('Error fetching ticket types:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTicketType) {
            alert('Please select a ticket type');
            return;
        }

        setSubmitting(true);
        try {
            // Create ticket session for this user
            const ticketSession = await createTicketSession(firstName, lastName, email);

            if (!ticketSession) {
                alert('Failed to create session');
                setSubmitting(false);
                return;
            }

            // Create ticket linked to this session
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketTypeId: selectedTicketType,
                    firstName,
                    lastName,
                    email,
                    sessionToken: ticketSession.session_token
                })
            });

            if (res.ok) {
                const data = await res.json();

                // DO NOT store session here - user must access via email QR link
                // Session will be stored when they click the QR link from email

                // Show success message
                setShowSuccess(true);

                console.log('✅ Ticket created and email sent - user must check email for QR link');
            } else {
                const error = await res.json();
                alert(`Failed to purchase ticket: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error purchasing ticket:', error);
            alert('Error purchasing ticket');
        } finally {
            setSubmitting(false);
        }
    };

    // Success message after ticket request
    if (showSuccess) {
        return (
            <div className="dark-page d-flex align-items-center justify-content-center min-vh-100">
                <div className="container" style={{ maxWidth: '600px' }}>
                    <div className="card dark-card shadow-lg">
                        <div className="card-body p-5 text-center">
                            <div className="mb-4">
                                <i className="bi bi-envelope-check-fill text-success" style={{ fontSize: '5rem' }}></i>
                            </div>
                            <h2 className="mb-4 text-white">Check Your Email!</h2>
                            <div className="alert alert-info mb-4">
                                <p className="mb-2">
                                    <strong>📧 Email sent to:</strong><br />
                                    {email}
                                </p>
                                <p className="mb-0">
                                    Your ticket confirmation with QR code has been sent.
                                    Click the link in the email to access your ticket.
                                </p>
                            </div>
                            <p className="text-muted small mb-4">
                                The QR code in the email will let you access your ticket and place orders at the event.
                            </p>
                            <Link
                                href="/"
                                className="btn btn-warning btn-lg"
                            >
                                Return to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // User has session - show their ticket
    if (hasSession && myTicket) {
        return (
            <div className="dark-page">
                <div className="container py-5" style={{ maxWidth: '800px' }}>
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-5">
                        <h1 className="display-4">🎫 My Ticket</h1>
                        <Link href="/" className="btn btn-outline-light">
                            ← Back
                        </Link>
                    </div>

                    {/* Ticket Card */}
                    <div className="card dark-card shadow-lg">
                        <div className="card-body p-4">
                            {/* QR Code Section */}
                            <div className="text-center mb-4">
                                {qrCodeDataUrl ? (
                                    <div
                                        className="bg-white p-3 rounded d-inline-block mb-3"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setShowQR(true)}
                                    >
                                        <img
                                            src={qrCodeDataUrl}
                                            alt="QR Code"
                                            style={{ width: '200px', height: '200px' }}
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-white p-3 rounded d-inline-block mb-3">
                                        <div
                                            className="d-flex align-items-center justify-content-center"
                                            style={{ width: '200px', height: '200px' }}
                                        >
                                            <div className="spinner-border text-dark" role="status">
                                                <span className="visually-hidden">Loading QR...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <p className="text-muted small mb-0">
                                    <i className="bi bi-hand-index"></i> Click QR to enlarge
                                </p>
                            </div>

                            {/* Ticket Number */}
                            <div className="text-center mb-4">
                                <div className="alert alert-warning d-inline-block px-4 py-2 mb-2">
                                    <h2 className="mb-0 fw-bold">
                                        {myTicket.ticket_number || 'Pending...'}
                                    </h2>
                                </div>
                                <p className="text-muted mb-0">{myTicket.ticket_type_name}</p>
                            </div>

                            {/* Status Badges */}
                            <div className="d-grid gap-3 mb-4">
                                {/* Payment Status */}
                                {myTicket.status === 'pending' ? (
                                    <button className="btn btn-info btn-lg" disabled>
                                        <i className="bi bi-credit-card me-2"></i>
                                        Payment at entrance with card or cash
                                    </button>
                                ) : (
                                    <button className="btn btn-success btn-lg" disabled>
                                        <i className="bi bi-check-circle-fill me-2"></i>
                                        Paid
                                    </button>
                                )}

                                {/* Details Button */}
                                <button
                                    className="btn btn-outline-light"
                                    onClick={() => setShowDetails(!showDetails)}
                                >
                                    <i className={`bi bi-${showDetails ? 'chevron-up' : 'chevron-down'} me-2`}></i>
                                    {myTicket.entry_redeemed ? '✓ Redeemed' : 'Not Redeemed'} - View Details
                                </button>
                            </div>

                            {/* Expandable Details */}
                            {showDetails && (
                                <div className="alert alert-secondary">
                                    <h6 className="mb-3">Ticket Details:</h6>
                                    <p className="mb-2"><strong>Name:</strong> {myTicket.first_name} {myTicket.last_name}</p>
                                    <p className="mb-2"><strong>Email:</strong> {myTicket.email}</p>
                                    <p className="mb-2"><strong>Type:</strong> {myTicket.ticket_type_name}</p>
                                    <p className="mb-2"><strong>Price:</strong> €{myTicket.price.toFixed(2)}</p>
                                    <p className="mb-0"><strong>Created:</strong> {new Date(myTicket.created_at).toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Request More Tickets Collapsable */}
                    <div className="mt-4">
                        <div className="accordion" id="requestMoreAccordion">
                            <div className="accordion-item" style={{ backgroundColor: '#3a3f47', border: '1px solid #495057' }}>
                                <h2 className="accordion-header">
                                    <button
                                        className="accordion-button collapsed text-white"
                                        type="button"
                                        data-bs-toggle="collapse"
                                        data-bs-target="#collapseRequestMore"
                                        style={{ backgroundColor: '#3a3f47', borderBottom: '1px solid #495057' }}
                                    >
                                        <i className="bi bi-plus-circle me-2"></i>
                                        Request More Tickets
                                    </button>
                                </h2>
                                <div
                                    id="collapseRequestMore"
                                    className="accordion-collapse collapse"
                                    data-bs-parent="#requestMoreAccordion"
                                >
                                    <div className="accordion-body" style={{ backgroundColor: '#282c34' }}>
                                        <div className="alert alert-info mb-4">
                                            <i className="bi bi-info-circle me-2"></i>
                                            <strong>Note:</strong> This will create a new ticket request sent to the provided email.
                                            Each ticket has its own QR code and session.
                                        </div>

                                        <form onSubmit={handleSubmit}>
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label htmlFor="newFirstName" className="form-label">First Name *</label>
                                                    <input
                                                        type="text"
                                                        className="form-control dark-input"
                                                        id="newFirstName"
                                                        value={firstName}
                                                        onChange={(e) => setFirstName(e.target.value)}
                                                        required
                                                    />
                                                </div>

                                                <div className="col-md-6">
                                                    <label htmlFor="newLastName" className="form-label">Last Name *</label>
                                                    <input
                                                        type="text"
                                                        className="form-control dark-input"
                                                        id="newLastName"
                                                        value={lastName}
                                                        onChange={(e) => setLastName(e.target.value)}
                                                        required
                                                    />
                                                </div>

                                                <div className="col-12">
                                                    <label htmlFor="newEmail" className="form-label">Email Address *</label>
                                                    <input
                                                        type="email"
                                                        className="form-control dark-input"
                                                        id="newEmail"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        required
                                                    />
                                                    <small className="text-muted">QR code will be sent to this email</small>
                                                </div>

                                                <div className="col-12">
                                                    <label className="form-label">Select Ticket Type *</label>
                                                    <div className="d-flex flex-column gap-2">
                                                        {ticketTypes.map(ticket => (
                                                            <div
                                                                key={ticket.id}
                                                                className={`card dark-card ${selectedTicketType === ticket.id ? 'border-warning' : ''}`}
                                                                style={{ cursor: 'pointer' }}
                                                                onClick={() => setSelectedTicketType(ticket.id)}
                                                            >
                                                                <div className="card-body p-3">
                                                                    <div className="d-flex justify-content-between align-items-center">
                                                                        <div>
                                                                            <h6 className="mb-1 text-white">{ticket.name}</h6>
                                                                            <small className="text-muted">{ticket.description}</small>
                                                                        </div>
                                                                        <div className="text-end">
                                                                            <h5 className="mb-0 text-warning">€{ticket.price.toFixed(2)}</h5>
                                                                            {selectedTicketType === ticket.id && (
                                                                                <span className="badge bg-warning text-dark mt-1">Selected</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="col-12">
                                                    <button
                                                        type="submit"
                                                        className="btn btn-warning btn-lg w-100"
                                                        disabled={!selectedTicketType || submitting}
                                                    >
                                                        {submitting ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                                Sending Request...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="bi bi-envelope me-2"></i>
                                                                Request Ticket
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* QR Code Full Screen Modal */}
                {showQR && qrCodeDataUrl && (
                    <div
                        className="modal d-block"
                        style={{
                            backgroundColor: 'rgba(0,0,0,0.95)',
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 1050,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={() => setShowQR(false)}
                    >
                        <div className="text-center">
                            <div className="bg-white p-4 rounded d-inline-block">
                                <img
                                    src={qrCodeDataUrl}
                                    alt="QR Code"
                                    style={{ width: '400px', height: '400px' }}
                                />
                            </div>
                            <p className="text-white mt-3">Tap anywhere to close</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // No session - show ticket request form
    return (
        <div className="dark-page">
            <div className="container py-5">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <h1 className="display-4">🎫 Request Ticket</h1>
                    <Link href="/" className="btn btn-outline-light">
                        ← Back
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-light" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <div className="row g-4">
                        {/* Ticket Types */}
                        <div className="col-lg-6">
                            <h3 className="mb-4">Select Your Ticket</h3>
                            <div className="d-flex flex-column gap-3">
                                {ticketTypes.length === 0 ? (
                                    <div className="alert alert-info">
                                        No tickets available at the moment
                                    </div>
                                ) : (
                                    ticketTypes.map(ticket => (
                                        <div
                                            key={ticket.id}
                                            className={`card dark-card shadow ${selectedTicketType === ticket.id ? 'order-card-active' : ''}`}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setSelectedTicketType(ticket.id)}
                                        >
                                            <div className="card-body p-4">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <h4 className="card-title text-white mb-0">{ticket.name}</h4>
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="ticketType"
                                                            checked={selectedTicketType === ticket.id}
                                                            onChange={() => setSelectedTicketType(ticket.id)}
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-muted mb-3">{ticket.description}</p>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <h3 className="mb-0 text-warning">€{ticket.price.toFixed(2)}</h3>
                                                    {selectedTicketType === ticket.id && (
                                                        <span className="badge bg-warning text-dark">Selected</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Purchase Form */}
                        <div className="col-lg-6">
                            <div className="card dark-card shadow" style={{ position: 'sticky', top: '20px' }}>
                                <div className="card-body p-4">
                                    <h3 className="card-title mb-4">Your Information</h3>
                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-3">
                                            <label htmlFor="firstName" className="form-label">First Name *</label>
                                            <input
                                                type="text"
                                                className="form-control dark-input"
                                                id="firstName"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label htmlFor="lastName" className="form-label">Last Name *</label>
                                            <input
                                                type="text"
                                                className="form-control dark-input"
                                                id="lastName"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="email" className="form-label">Email Address *</label>
                                            <input
                                                type="email"
                                                className="form-control dark-input"
                                                id="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                            <small className="text-muted">Your QR code will be sent to this email</small>
                                        </div>

                                        {selectedTicketType && (
                                            <div className="alert alert-info mb-4">
                                                <strong>Selected:</strong> {ticketTypes.find(t => t.id === selectedTicketType)?.name}
                                                <br />
                                                <strong>Price:</strong> €{ticketTypes.find(t => t.id === selectedTicketType)?.price.toFixed(2)}
                                            </div>
                                        )}

                                        <div className="d-grid">
                                            <button
                                                type="submit"
                                                className="btn btn-warning btn-lg fw-bold"
                                                disabled={!selectedTicketType || submitting}
                                                style={{ padding: '15px' }}
                                            >
                                                {submitting ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-ticket-perforated me-2"></i>
                                                        Reserve Ticket
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <small className="text-muted d-block mt-3 text-center">
                                            * Payment will be completed at the venue
                                        </small>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
