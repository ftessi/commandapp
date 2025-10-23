"use client";

import Link from 'next/link';
import XCEED from '../assets/images/XCEED.png';

export default function LandingPage() {
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
                    {/* Get Tickets Button */}
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
                        &nbsp;Get Tickets
                    </Link>

                    {/* Order Button */}
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

                    {/* Info Button */}
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
                        &nbsp;Info
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
