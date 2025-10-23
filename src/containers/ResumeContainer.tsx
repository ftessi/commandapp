import React from 'react'
import Resume from '../components/Resume'
import { useProducts } from '../context/ProductsDataContext'

function ResumeContainer() {
    const { navigateToMenu } = useProducts();

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <button
                            className="btn btn-outline-light"
                            onClick={navigateToMenu}
                        >
                            <i className="bi bi-arrow-left"></i> Back to Menu
                        </button>
                        <h3 className="mb-0">Order Summary</h3>
                    </div>
                    <Resume />
                </div>
            </div>
        </div>
    )
}

export default ResumeContainer
