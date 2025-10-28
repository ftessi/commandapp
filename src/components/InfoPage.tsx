'use client';

import Link from 'next/link';

export default function InfoPage() {
    return (
        <div className="dark-page">
            <div className="container py-5">
                {/* Header with back button */}
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <h1 className="display-4">ℹ️ Info & Contact</h1>
                    <Link
                        href="/"
                        className="btn btn-outline-light text-decoration-none"
                    >
                        ← Back to Home
                    </Link>
                </div>

                {/* Main Content */}
                <div className="row g-4">
                    {/* Venue Information */}
                    <div className="col-md-6">
                        <div className="card info-card h-100 shadow">
                            <div className="card-body p-4">
                                <h3 className="card-title mb-4 text-warning">
                                    <i className="bi bi-geo-alt-fill me-2"></i>
                                    Location
                                </h3>
                                <p className="mb-3">
                                    <a
                                        href="https://www.google.com/maps/dir//45.062272,7.6946759/@45.0622711,7.6940064,201m/data=!3m1!1e3?entry=ttu&g_ep=EgoyMDI1MTAyNi4wIKXMDSoASAFQAw%3D%3D"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ textDecoration: 'none', color: 'white' }}
                                    >
                                        <i className="bi bi-location" ></i>

                                        Contrada<br />
                                        Murazzi del Po Gipo Farassino, 23<br />
                                        Torino, 10123<br />
                                        Italia<br />
                                    </a>
                                </p>
                                <p className="mb-0">
                                    <strong>Mail:</strong><br />
                                    <a href="mailto:7vite.technoparty@gmail.com" className="text-warning text-decoration-none">
                                        7vite.technoparty@gmail.com
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Map Section (Optional) */}
                    <div className="col-md-6">
                        <div className="card" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                            <div className="card-body">
                                <div className="d-flex align-items-center justify-content-center">
                                    {/* <h3 className="card-title mb-4">
                                <i className="bi bi-map me-2"></i>
                                Location Map
                            </h3> */}
                                    {/* <div className="ratio ratio-16x9" style={{ backgroundColor: '#282c34', borderRadius: '8px' }}> */}
                                    <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d310.1401648902877!2d7.694390232887115!3d45.062274963922164!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47886db66ac5ce1d%3A0x9c8b4fd2c6bc1740!2sContrada%20Murazzi!5e1!3m2!1sit!2sit!4v1761192670657!5m2!1sit!2sit" width="600" height="450" style={{ border: 0 }} allowFullScreen={true} loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>                                {/* </div> */}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Event Information */}
                    <div className="col-md-6">
                        <div className="card info-card h-100 shadow">
                            <div className="card-body p-4">
                                <h3 className="card-title mb-4 text-success">
                                    <i className="bi bi-calendar-event me-2"></i>
                                    Event Details
                                </h3>
                                <p className="mb-3">
                                    <strong>Date & Time:</strong><br />
                                    01 - Nov<br />
                                    10 PM - 5 AM
                                </p>
                                <p className="mb-3">
                                    <strong>Music:</strong><br />
                                    Techno - Hard Dance
                                </p>
                                <p className="mb-0">
                                    <strong>Age Restriction:</strong><br />
                                    18+
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Opening Hours */}
                    {/* <div className="col-md-6">
                        <div className="card h-100" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                            <div className="card-body p-4">
                                <h3 className="card-title mb-4 text-info">
                                    <i className="bi bi-clock me-2"></i>
                                    Opening Hours
                                </h3>
                                <ul className="list-unstyled mb-0">
                                    <li className="mb-2"><strong>Saturday:</strong> 10:00 PM - 5:00 AM</li>
                                </ul>
                            </div>
                        </div>
                    </div> */}


                    {/* Social Media & Additional Info */}
                    <div className="col-md-6">
                        <div className="card h-100" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                            <div className="card-body p-4">
                                <h3 className="card-title mb-4 text-primary">
                                    <i className="bi bi-share me-2"></i>
                                    Follow Us
                                </h3>
                                <div className="d-flex flex-column gap-3">
                                    <a
                                        href="https://instagram.com/7.vite_"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-outline-light text-start"
                                    >
                                        <i className="bi bi-instagram me-2"></i>
                                        Instagram: @7.vite_
                                    </a>

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Important Notes */}
                    {/* <div className="col-12">
                        <div className="card" style={{ backgroundColor: '#3a3f47', border: 'none' }}>
                            <div className="card-body p-4">
                                <h3 className="card-title mb-4 text-danger">
                                    <i className="bi bi-exclamation-triangle me-2"></i>
                                    Important Information
                                </h3>
                                <ul className="mb-0">
                                    <li className="mb-2">Valid ID required at entrance</li>
                                    <li className="mb-2">Dress code: [Smart Casual / Formal / etc.]</li>
                                    <li className="mb-2">No re-entry policy</li>
                                    <li className="mb-2">Management reserves the right to refuse entry</li>
                                    <li className="mb-0">Tickets are non-refundable once purchased</li>
                                </ul>
                            </div>
                        </div>
                    </div> */}
                </div>


            </div>
        </div>
    );
}
