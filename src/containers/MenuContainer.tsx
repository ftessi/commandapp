import React from 'react'
import SubMenu from '../components/SubMenu'
import { Product, ProductListContainerProps } from '../types/types'

const MenuContainer: React.FC<ProductListContainerProps> = ({ data }) => {
    return (
        <div className='container'>
            <div className='row justify-content-center'>
                {Object.entries(data).map(([category, products]) =>
                    <SubMenu key={category} category={category} products={products} />
                )}
            </div>
        </div>
    )
}

export default MenuContainer
