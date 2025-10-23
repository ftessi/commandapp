import React from 'react'
import Product from './Product'
import { Product as ProductType, ProductListProps } from '../types/types'

const SubMenu: React.FC<ProductListProps> = ({ category, products }) => {

    return (
        <div className='col-md-6 col-lg-4'>
            <div className='text-center'>
                <h1 className='SubMenuName mt-3 category-title'> {category} </h1>
                {/* <div className='SubMenuImage'> <img src='https://www.allrecipes.com/thmb/QiGptPjQB5mqSXGVxE4sLPMJs_4=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/AR-269500-creamy-garlic-pasta-Beauties-2x1-bcd9cb83138849e4b17104a1cd51d063.jpg' style={{ width: '100px' }}></img> </div> */}
            </div>
            {products.map((product) => (
                <Product key={product.id} id={product.id} name={product.name} price={product.price} image={product.image} details={product.details} />
            ))}
        </div>
    )
}

export default SubMenu
