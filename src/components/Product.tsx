import React from 'react'
import { useState, useEffect } from 'react';
import { useProducts } from '../context/ProductsDataContext';

interface ProductProps {
    id: number;
    name: string;
    price: number;
    image: string;
    details: string;
}

const Product: React.FC<ProductProps> = ({ id, name, price, image, details }) => {
    const [quantity, setQuantity] = useState(0);
    const { addToCart, updateCartQuantity, getProductById } = useProducts();

    // Sync local state with context state
    useEffect(() => {
        const productInContext = getProductById(id);
        if (productInContext && productInContext.quantityInCart !== quantity) {
            setQuantity(productInContext.quantityInCart);
        }
    }, [getProductById, id]);

    // Handlers for incrementing and decrementing the quantity
    const incrementQuantity = () => {
        const newQuantity = quantity + 1;
        setQuantity(newQuantity);
        addToCart(id, 1); // Add one to cart
        // console.log("addToCart", id, 1);
    };

    const decrementQuantity = () => {
        if (quantity > 0) {
            const newQuantity = quantity - 1;
            setQuantity(newQuantity);
            updateCartQuantity(id, newQuantity); // Update total quantity in cart
        }
    };

    return (
        <>
            <div className="card dark-card shadow mb-3">
                <div className="card-body">
                    <div className='row align-items-center'>
                        <div className='col-7'>
                            {/* FIX: TENER EN CUENTA QUE CUANDO MANTENEMOS PRESIONADO EN EL TELEFONO, TE LO QUIERE ABRIR COMO SI FUESE UN LINK, HAY QUE PASARLO A SPAN SEGURAMENTE */}
                            <a
                                className="productItemAction text-decoration-none"
                                data-bs-toggle="collapse"
                                href={"#collapseExample" + id}
                                role="button"
                                aria-expanded="false"
                                aria-controls=""
                                style={{ color: 'inherit' }}
                            >
                                <h5 className="card-title text-white mb-1">{name}</h5>
                                <h6 className="card-subtitle text-warning mb-0">${price.toFixed(2)}</h6>
                            </a>
                        </div>
                        <div className="col-5">
                            <div className="d-flex align-items-center justify-content-end gap-1">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-success"
                                    onClick={incrementQuantity}
                                    style={{ width: '32px', height: '32px', padding: '0', flexShrink: 0 }}
                                >
                                    +
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-light"
                                    disabled
                                    style={{ width: '35px', height: '32px', padding: '0', flexShrink: 0 }}
                                >
                                    {quantity}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={decrementQuantity}
                                    style={{ width: '32px', height: '32px', padding: '0', flexShrink: 0 }}
                                >
                                    -
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="collapse" id={"collapseExample" + id}>
                        <div className='mt-2 text-muted'>
                            {details}
                        </div>
                    </div>
                </div >
            </div >
        </>
    )
}

export default Product

