'use client';

import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import MenuContainer from '@/containers/MenuContainer';
import CartBar from '@/components/CartBar';
import { useProducts } from '@/context/ProductsDataContext';
import ResumeContainer from '@/containers/ResumeContainer';
import OrderHistoryContainer from '@/containers/OrderHistoryContainer';

export default function OrderPage() {
    const { currentView, products, navigateToMenu } = useProducts();

    // Set view to menu when component mounts (if not already in resume/orderHistory)
    useEffect(() => {
        if (currentView === 'landing' || currentView === 'tickets' || currentView === 'info') {
            navigateToMenu();
        }
    }, []);

    // For the order page, we handle menu, resume, and orderHistory views
    const renderContent = () => {
        switch (currentView) {
            case 'resume':
                return <ResumeContainer />;

            case 'orderHistory':
                return <OrderHistoryContainer />;

            case 'menu':
            default:
                // Group products by category for MenuContainer
                const groupedProducts = products.reduce((acc: { [key: string]: any[] }, product) => {
                    const category = (product as any).category || 'Uncategorized';
                    if (!acc[category]) {
                        acc[category] = [];
                    }
                    acc[category].push(product);
                    return acc;
                }, {});

                // Show loading state if products haven't loaded yet
                if (products.length === 0) {
                    return (
                        <div className="text-center p-4">
                            <p>Loading products...</p>
                        </div>
                    );
                }
                return <MenuContainer data={groupedProducts} />;
        }
    };

    return (
        <div className="App">
            <div className="App-background">
                <Navbar />
                {renderContent()}
                <CartBar />
            </div>
        </div>
    );
}
