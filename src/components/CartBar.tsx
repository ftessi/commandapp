import React from 'react'
import { useProducts } from '../context/ProductsDataContext';

function CartBar() {
    const { cartTotal, getCartItems, navigateToResume, isServiceOpen } = useProducts();
    const cartItems = getCartItems();
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantityInCart, 0);

    const handleCartClick = () => {
        if (isServiceOpen && itemCount > 0) {
            navigateToResume();
        }
    };

    return (
        <nav className="navbar fixed-bottom dark-navbar-bottom">
            <div className="container-fluid">
                <a
                    className="navbar-brand text-white"
                    href="#"
                    onClick={handleCartClick}
                    style={{ cursor: (isServiceOpen && itemCount > 0) ? 'pointer' : 'default' }}
                >
                    Cart {itemCount > 0 && `(${itemCount})`}
                </a>

                <button
                    className="btn btn-warning"
                    type="button"
                    onClick={handleCartClick}
                    disabled={!isServiceOpen || itemCount === 0}
                >
                    {!isServiceOpen ? 'We are closed at the moment!' : `Checkout $${cartTotal.toFixed(2)}`}
                </button>
            </div>
        </nav>
    )
}

export default CartBar
