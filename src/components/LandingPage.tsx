"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import XCEED from '../assets/images/XCEED.png';
import { hasActiveSession, getStoredSessionToken } from '../services/sessionService';

export default function LandingPage() {
    const [hasSession, setHasSession] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // Check if user has active session and ticket is paid
        const checkSessionAndPayment = async () => {
            const session = hasActiveSession();
            setHasSession(session);
            
            if (session) {
                // Fetch ticket to check payment status
                const token = getStoredSessionToken();
                try {
                    const res = await fetch(`/api/tickets?sessionToken=${token}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.tickets && data.tickets.length > 0) {
                            const ticket = data.tickets[0];
                            setIsPaid(ticket.status === 'paid');
                            console.log('🎫 Ticket status:', ticket.status);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching ticket status:', error);
                }
            }
            
            setChecking(false);
            console.log('🔐 User has session:', session);
        };
        
        checkSessionAndPayment();
    }, []);
    return (
        <div
            className="min-vh-100 d-flex flex-column align-items-center justify-content-center"
            style={{
                backgroundColor: '#282c34',
                // Prefer the imported image's compiled src; fall back to public path if needed
                backgroundImage: `url(${(XCEED && (XCEED.src || XCEED)) || '/assets/images/XCEED.png'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                height: '100%'
            }}
        >

            {/* Menu Options */}
            <div className="container" style={{ maxWidth: '600px' }}>
                <div className="d-grid gap-4">
                    {/* Get Tickets Button - Always visible */}
                    <Link
                        href="/tickets"
                        className="btn btn-lg fw-bold shadow-lg text-decoration-none landing-btn-overlay"
                        style={{
                            padding: '20px',
                            fontSize: '1.5rem',
                            border: 'none',
                            borderRadius: '12px',
                            transition: 'transform 0.2s',
                            backgroundColor: 'rgba(115, 122, 119, 0.65)',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <span className="material-symbols-outlined icon-nudge" aria-hidden>
                            confirmation_number
                        </span>
                        &nbsp;{hasSession ? 'My Ticket' : 'Get Tickets'}
                    </Link>

                    {/* Order Button - Only show if user has session */}
                    {hasSession && (
                        isPaid ? (
                            <Link
                                href="/order"
                                className="btn btn-lg fw-bold shadow-lg text-decoration-none landing-btn-overlay"
                                style={{
                                    padding: '20px',
                                    fontSize: '1.5rem',
                                    border: 'none',
                                    borderRadius: '12px',
                                    transition: 'transform 0.2s',
                                    backgroundColor: 'rgba(115, 122, 119, 0.65)',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <span className="material-symbols-outlined icon-nudge" aria-hidden>
                                    local_bar
                                </span>
                                &nbsp;Order
                            </Link>
                        ) : (
                            <button
                                disabled
                                className="btn btn-lg fw-bold shadow-lg"
                                style={{
                                    padding: '20px',
                                    fontSize: '1.5rem',
                                    border: 'none',
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(115, 122, 119, 0.35)',
                                    opacity: 0.6,
                                    cursor: 'not-allowed',
                                }}
                            >
                                <span className="material-symbols-outlined icon-nudge" aria-hidden>
                                    lock
                                </span>
                                &nbsp;Order (Payment Required)
                            </button>
                        )
                    )}

                    {/* Info/Contact Button - Always visible */}
                    <Link
                        href="/info"
                        className="btn btn-lg fw-bold shadow-lg text-decoration-none landing-btn-overlay"
                        style={{
                            padding: '20px',
                            fontSize: '1.5rem',
                            border: 'none',
                            borderRadius: '12px',
                            transition: 'transform 0.2s',
                            backgroundColor: 'rgba(115, 122, 119, 0.65)',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <span className="material-symbols-outlined icon-nudge" aria-hidden>
                            info
                        </span>
                        &nbsp;Contact
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-5 text-center">
                <p className="text-muted small">
                </p>
            </div>
        </div>
    );
}
