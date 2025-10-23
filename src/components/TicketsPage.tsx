'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStoredSessionToken, storeSessionToken } from '../services/sessionService';

interface TicketType {
    id: number;
    name: string;
    description: string;
    price: number;
    available: boolean;
}

interface PurchasedTicket {
    id: string;
    ticket_type_name: string;
    first_name: string;
    last_name: string;
    email: string;
    price: number;
    status: string;
}

export default function TicketsPage() {
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [purchasedTicket, setPurchasedTicket] = useState<PurchasedTicket | null>(null);

    // Form state
    const [selectedTicketType, setSelectedTicketType] = useState<number | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        fetchTicketTypes();
    }, []);

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
            // Get existing session token
            const sessionToken = getStoredSessionToken();
            
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketTypeId: selectedTicketType,
                    firstName,
                    lastName,
                    email,
                    sessionToken // Include session token if exists
                })
            });

            if (res.ok) {
                const data = await res.json();
                setPurchasedTicket(data.ticket);
                
                // Store session token from response
                if (data.sessionToken) {
                    storeSessionToken(data.sessionToken);
                    console.log('✅ Session token stored after ticket purchase');
                }
                
                // Reset form
                setSelectedTicketType(null);
                setFirstName('');
                setLastName('');
                setEmail('');
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

    // Show success message after purchase
    if (purchasedTicket) {
        return (
            <div className="dark-page d-flex align-items-center justify-content-center">
                <div className="container" style={{ maxWidth: '600px' }}>
                    <div className="card dark-card shadow-lg">
                        <div className="card-body p-5 text-center">
                            <div className="mb-4">
                                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '5rem' }}></i>
                            </div>
                            <h2 className="mb-4 text-white">Ticket Reserved!</h2>
                            <div className="alert alert-warning mb-4">
                                <h5 className="mb-2">⚠️ Payment Pending</h5>
                                <p className="mb-0">
                                    Your ticket has been reserved. Please proceed to the payment counter to complete your purchase.
                                </p>
                            </div>
                            <div className="text-start mb-4 p-4 ticket-details-box">
                                <h5 className="text-warning mb-3">Ticket Details:</h5>
                                <p className="mb-2"><strong>Type:</strong> {purchasedTicket.ticket_type_name}</p>
                                <p className="mb-2"><strong>Name:</strong> {purchasedTicket.first_name} {purchasedTicket.last_name}</p>
                                <p className="mb-2"><strong>Email:</strong> {purchasedTicket.email}</p>
                                <p className="mb-2"><strong>Price:</strong> €{purchasedTicket.price.toFixed(2)}</p>
                                <p className="mb-0"><strong>Status:</strong> <span className="badge bg-warning text-dark">Pending Payment</span></p>
                            </div>
                            <small className="text-muted d-block mb-4">
                                A confirmation email will be sent once payment is confirmed.
                                You will receive a QR code that serves as your entry ticket.
                            </small>
                            <div className="d-grid gap-2">
                                <button
                                    className="btn btn-success btn-lg"
                                    onClick={() => setPurchasedTicket(null)}
                                >
                                    Purchase Another Ticket
                                </button>
                                <Link
                                    href="/"
                                    className="btn btn-outline-light text-decoration-none"
                                >
                                    Back to Home
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dark-page">
            <div className="container py-5">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <h1 className="display-4">🎫 Get Tickets</h1>
                    <Link
                        href="/"
                        className="btn btn-outline-light text-decoration-none"
                    >
                        ← Back to Home
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
