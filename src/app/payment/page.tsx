'use client';

import Link from 'next/link';

export default function PaymentPage() {
    return (
        <div className="dark-page">
            <div className="container py-5" style={{ maxWidth: '800px' }}>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <h1 className="display-4">💳 Payment Information</h1>
                    <Link href="/tickets" className="btn btn-outline-light">
                        ← Back to Ticket
                    </Link>
                </div>

                {/* Payment Methods Card */}
                <div className="card dark-card shadow-lg mb-4">
                    <div className="card-body p-5">
                        <div className="text-center mb-4">
                            <i className="bi bi-cash-coin text-warning" style={{ fontSize: '4rem' }}></i>
                        </div>

                        <h2 className="text-center text-warning mb-4">Payment at Venue</h2>
                        
                        <div className="alert alert-info mb-4">
                            <p className="mb-0">
                                <strong>ℹ️ Please Note:</strong> All ticket payments are processed on-site at the venue counter.
                            </p>
                        </div>

                        <h4 className="mb-3">We Accept:</h4>
                        
                        <div className="row g-3 mb-4">
                            {/* Cash */}
                            <div className="col-md-6">
                                <div className="card dark-card border border-secondary h-100">
                                    <div className="card-body text-center p-4">
                                        <i className="bi bi-cash-stack text-success mb-3" style={{ fontSize: '3rem' }}></i>
                                        <h5 className="text-white">Cash</h5>
                                        <p className="text-muted small mb-0">Euro (€) accepted</p>
                                    </div>
                                </div>
                            </div>

                            {/* Card */}
                            <div className="col-md-6">
                                <div className="card dark-card border border-secondary h-100">
                                    <div className="card-body text-center p-4">
                                        <i className="bi bi-credit-card text-primary mb-3" style={{ fontSize: '3rem' }}></i>
                                        <h5 className="text-white">Card</h5>
                                        <p className="text-muted small mb-0">Visa, Mastercard, etc.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Digital Wallets */}
                            <div className="col-md-6">
                                <div className="card dark-card border border-secondary h-100">
                                    <div className="card-body text-center p-4">
                                        <i className="bi bi-phone text-info mb-3" style={{ fontSize: '3rem' }}></i>
                                        <h5 className="text-white">Digital Wallets</h5>
                                        <p className="text-muted small mb-0">Apple Pay, Google Pay</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Transfer */}
                            <div className="col-md-6">
                                <div className="card dark-card border border-secondary h-100">
                                    <div className="card-body text-center p-4">
                                        <i className="bi bi-bank text-warning mb-3" style={{ fontSize: '3rem' }}></i>
                                        <h5 className="text-white">Bank Transfer</h5>
                                        <p className="text-muted small mb-0">For advance payments</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr className="border-secondary my-4" />

                        <h4 className="mb-3">How It Works:</h4>
                        <ol className="text-muted">
                            <li className="mb-2">Present your <strong className="text-white">QR code</strong> (from your ticket) at the payment counter</li>
                            <li className="mb-2">Choose your preferred payment method</li>
                            <li className="mb-2">Complete the payment transaction</li>
                            <li className="mb-2">Your ticket will be <strong className="text-white">instantly activated</strong></li>
                            <li>Use the same QR code for entry and placing orders</li>
                        </ol>

                        <div className="alert alert-warning mt-4">
                            <h6 className="mb-2">📍 Payment Counter Location:</h6>
                            <p className="mb-0">
                                The payment counter is located at the main entrance. Our staff will be happy to assist you.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="card dark-card shadow-lg">
                    <div className="card-body p-4">
                        <h4 className="mb-4">Frequently Asked Questions</h4>
                        
                        <div className="mb-3">
                            <h6 className="text-warning">Can I pay online in advance?</h6>
                            <p className="text-muted small mb-0">
                                Currently, all payments are processed on-site. For advance bank transfers, please contact our staff at the venue.
                            </p>
                        </div>

                        <hr className="border-secondary" />

                        <div className="mb-3">
                            <h6 className="text-warning">What happens after I pay?</h6>
                            <p className="text-muted small mb-0">
                                Your ticket status will be updated immediately, and you can use your QR code for entry and to place orders at the bar.
                            </p>
                        </div>

                        <hr className="border-secondary" />

                        <div className="mb-3">
                            <h6 className="text-warning">Can I get a refund?</h6>
                            <p className="text-muted small mb-0">
                                Refund policies vary by event. Please inquire at the payment counter for specific refund terms.
                            </p>
                        </div>

                        <hr className="border-secondary" />

                        <div>
                            <h6 className="text-warning">I lost my QR code, what should I do?</h6>
                            <p className="text-muted small mb-0">
                                Check your email for the ticket confirmation with the QR code. If you can't find it, contact our staff with your name and email.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="d-grid gap-2 mt-4">
                    <Link
                        href="/tickets"
                        className="btn btn-warning btn-lg"
                    >
                        <i className="bi bi-ticket-perforated me-2"></i>
                        View My Ticket
                    </Link>
                    <Link
                        href="/"
                        className="btn btn-outline-light"
                    >
                        Return to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
