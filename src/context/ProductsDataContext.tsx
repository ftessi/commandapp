'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Product, ProductContextType, Order, OrderStatus } from '../types/types';
import ProductsTestData from '../assets/Products.json';
import { v4 as uuidv4 } from 'uuid';
import { getStoredSessionToken } from '../services/sessionService';
import { supabase } from '../services/supabaseClient';

const ProductContext = createContext<ProductContextType | undefined>(undefined);

interface ProductProviderProps {
    children: ReactNode;
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [cartTotal, setCartTotal] = useState<number>(0);
    const [currentView, setCurrentView] = useState<'landing' | 'menu' | 'resume' | 'orderHistory' | 'tickets' | 'info'>('landing');
    const [currentOrders, setCurrentOrders] = useState<Order[]>([]);
    const [pastOrders, setPastOrders] = useState<Order[]>([]);
    const [isListening, setIsListening] = useState<boolean>(false);
    const [isServiceOpen, setIsServiceOpen] = useState<boolean>(true);

    // Use ref to track current orders for polling without causing re-renders
    const currentOrdersRef = React.useRef<Order[]>([]);

    // Keep ref in sync with state
    React.useEffect(() => {
        currentOrdersRef.current = currentOrders;
    }, [currentOrders]);

    // No device session initialization - users get session from ticket purchase only
    // Session token will be stored when they click QR link from email

    // Fetch service status (open/closed)
    useEffect(() => {
        const fetchServiceStatus = async () => {
            try {
                const response = await fetch('/api/service-status?service=ordering');
                if (response.ok) {
                    const data = await response.json();
                    setIsServiceOpen(data.is_open);
                    console.log('🏪 [ProductsDataContext] Service status:', data.is_open ? 'OPEN' : 'CLOSED');
                }
            } catch (error) {
                console.error('❌ [ProductsDataContext] Error fetching service status:', error);
                // Default to open on error
                setIsServiceOpen(true);
            }
        };

        fetchServiceStatus();
    }, []);

    // Supabase Realtime subscription for service status
    useEffect(() => {
        console.log('🔴 [ProductsDataContext] Setting up Realtime subscription for service status...');
        
        const serviceChannel = supabase
            .channel('products-service-status')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'service_status',
                    filter: 'service_name=eq.ordering'
                },
                (payload: any) => {
                    console.log('🔔 [ProductsDataContext] Realtime service status change:', payload.new?.is_open);
                    if (payload.new) {
                        setIsServiceOpen(payload.new.is_open);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [ProductsDataContext] Subscribed to service status realtime updates');
                }
            });

        return () => {
            supabase.removeChannel(serviceChannel);
        };
    }, []);

    // Load persisted state from local storage on component mount
    useEffect(() => {
        console.log('📦 [ProductsDataContext] Loading persisted cart from localStorage...');

        const storedCart = localStorage.getItem('commandapp_cart');

        // Only restore cart quantities - orders will be fetched from API
        if (storedCart) {
            console.log('🛒 [ProductsDataContext] Found stored cart (will merge with API products later)');
        } else {
            console.log('🛒 [ProductsDataContext] No stored cart found');
        }

        // Clean up any old order data from localStorage (migration from old version)
        localStorage.removeItem('commandapp_current_orders');
        localStorage.removeItem('commandapp_past_orders');

        // Don't load orders from localStorage - always fetch from server
        console.log('📋 [ProductsDataContext] Orders will be fetched from API only (not localStorage)');
    }, []);

    // Load products from API or test data
    useEffect(() => {
        console.log('🌐 [ProductsDataContext] Fetching products from API...');

        // Fetch products from the backend
        const fetchProducts = async () => {
            try {
                const response = await fetch('/api/products');
                if (!response.ok) {
                    throw new Error('Failed to fetch products from API');
                }
                const data = await response.json();
                console.log('✅ [ProductsDataContext] API response received:', data);

                // API returns grouped by category: { "Primi": [...], "Secondi": [...] }
                // Flatten to array of products while preserving category
                const flatProducts: Product[] = Object.entries(data)
                    .flatMap(([category, products]: [string, any]) =>
                        products.map((product: any) => ({
                            ...product,
                            category, // Preserve category name
                            quantityInCart: 0
                        }))
                    );

                console.log('✅ [ProductsDataContext] Flattened products from API:', flatProducts.length, 'products');
                console.log('✅ [ProductsDataContext] First product from API:', flatProducts[0]?.name, 'in category:', (flatProducts[0] as any)?.category);

                // Preserve cart quantities from localStorage
                const storedCart = localStorage.getItem('commandapp_cart');
                if (storedCart) {
                    try {
                        const parsedCart = JSON.parse(storedCart);
                        console.log('🔄 [ProductsDataContext] Merging API products with stored cart quantities...');
                        const merged = flatProducts.map(product => {
                            // Find stored product by ID
                            const storedProduct = parsedCart.find((p: Product) => p.id === product.id);
                            if (storedProduct && storedProduct.quantityInCart > 0) {
                                console.log(`  - Product ${product.name}: restored quantity ${storedProduct.quantityInCart}`);
                                // IMPORTANT: Use API product data, only restore the quantity
                                return { ...product, quantityInCart: storedProduct.quantityInCart };
                            }
                            return product;
                        });
                        setProducts(merged);
                        console.log('✅ [ProductsDataContext] Set products with merged cart quantities');
                        console.log('✅ [ProductsDataContext] Products in state:', merged.map(p => ({ id: p.id, name: p.name, qty: p.quantityInCart })));
                    } catch (error) {
                        console.error('❌ [ProductsDataContext] Error merging cart:', error);
                        setProducts(flatProducts);
                    }
                } else {
                    setProducts(flatProducts);
                    console.log('✅ [ProductsDataContext] Set products from API (no cart to merge)');
                }
            } catch (error) {
                console.error('❌ [ProductsDataContext] Error fetching products from API:', error);
                // Use test data as fallback
                const flatProducts: Product[] = Object.values(ProductsTestData)
                    .flat()
                    .map(product => ({ ...product, quantityInCart: 0 }));

                console.log('⚠️  [ProductsDataContext] Falling back to local ProductsTestData:', flatProducts.length, 'products');
                console.log('⚠️  [ProductsDataContext] First product from fallback:', flatProducts[0]?.name);

                setProducts(prevProducts => {
                    if (prevProducts.length > 0) {
                        console.log('⚠️  [ProductsDataContext] Products already loaded, skipping fallback');
                        return prevProducts;
                    }
                    return flatProducts;
                });
            }
        };

        fetchProducts();
    }, []);

    // Update cart total whenever products change
    useEffect(() => {
        const total = products.reduce((sum, product) =>
            sum + (product.price * product.quantityInCart), 0);

        const itemsInCart = products.filter(p => p.quantityInCart > 0).length;
        if (itemsInCart > 0) {
            console.log(`💰 [ProductsDataContext] Cart updated: ${itemsInCart} items, total: $${total.toFixed(2)}`);
        }

        setCartTotal(total);

        // Persist cart to local storage
        if (products.length > 0) {
            localStorage.setItem('commandapp_cart', JSON.stringify(products));
            if (itemsInCart > 0) {
                console.log('💾 [ProductsDataContext] Cart saved to localStorage');
            }
        }
    }, [products]);

    // Fetch orders from API on mount (after localStorage load)
    useEffect(() => {
        console.log('🌐 [ProductsDataContext] Fetching orders from API...');

        const fetchOrders = async () => {
            try {
                // Get session token to fetch user-specific orders
                const sessionToken = getStoredSessionToken();
                let url = '/api/orders';

                if (sessionToken) {
                    url += `?sessionToken=${sessionToken}`;
                    console.log('🔐 [ProductsDataContext] Fetching orders for session');
                } else {
                    console.log('ℹ️ [ProductsDataContext] No session token, fetching all orders (dev mode)');
                }

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Failed to fetch orders from API');
                }
                const data = await response.json();
                console.log('✅ [ProductsDataContext] Orders API response:', data.orders?.length || 0, 'orders');

                if (data.orders && Array.isArray(data.orders)) {
                    // Transform API orders to match our Order type
                    const apiOrders: Order[] = data.orders.map((order: any) => ({
                        orderId: order.order_id,
                        ticketNumber: order.ticket_number || 'N/A',
                        items: order.order_items?.map((item: any) => ({
                            productId: item.product_id,
                            name: item.name,
                            price: Number(item.price),
                            quantity: item.quantity
                        })) || [],
                        timestamp: order.created_at,
                        total: Number(order.total),
                        status: order.status
                    }));

                    // Separate current and past orders
                    const current = apiOrders.filter(o =>
                        o.status === OrderStatus.PENDING ||
                        o.status === OrderStatus.PAID ||
                        o.status === OrderStatus.PREPARING
                    );
                    const past = apiOrders.filter(o =>
                        o.status === OrderStatus.COMPLETED
                    );

                    console.log('✅ [ProductsDataContext] Current orders from API:', current.length);
                    console.log('✅ [ProductsDataContext] Past orders from API:', past.length);

                    // Set orders directly from API (no localStorage merging for orders)
                    setCurrentOrders(current);
                    setPastOrders(past);
                }
            } catch (error) {
                console.error('❌ [ProductsDataContext] Error fetching orders from API:', error);
                console.log('⚠️  [ProductsDataContext] Using localStorage orders only');
            }
        };

        // Delay order fetch slightly so localStorage loads first
        const timer = setTimeout(fetchOrders, 500);
        return () => clearTimeout(timer);
    }, []);

    // Listen to server for order updates (admin polling)
    // REPLACED WITH REALTIME - See useEffect below with supabase.channel()
    // Keeping this for reference but it's now inactive
    useEffect(() => {
        // Start polling only if we have orders and aren't already listening
        if (currentOrders.length > 0 && !isListening) {
            setIsListening(true);
            console.log(`🔄 [ProductsDataContext] Starting realtime subscription for ${currentOrders.length} active orders...`);
        }

        // Stop polling if no more orders
        if (currentOrders.length === 0 && isListening) {
            setIsListening(false);
            console.log('🛑 [ProductsDataContext] No active orders, stopping realtime');
        }
    }, [currentOrders.length]); // Only depend on the LENGTH, not the array itself

    // Separate effect for the actual realtime subscription
    useEffect(() => {
        if (!isListening) return;

        console.log('🔴 [ProductsDataContext] Setting up Realtime subscription for orders...');
        
        // Get session token to filter only user's orders  
        const sessionToken = getStoredSessionToken();
        
        // Subscribe to orders table changes
        const ordersChannel = supabase
            .channel('orders-changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'orders'
                },
                async (payload: any) => {
                    console.log('� [ProductsDataContext] Realtime order change:', payload.eventType, payload.new?.order_id);
                    
                    // Re-fetch orders to get fresh data with full details
                    try {
                        let url = `/api/orders?_t=${Date.now()}`;
                        if (sessionToken) {
                            url += `&sessionToken=${sessionToken}`;
                        }
                        
                        const response = await fetch(url, { cache: 'no-store' });
                        const data = await response.json();
                        
                        if (data.orders && Array.isArray(data.orders)) {
                            const apiOrders: Order[] = data.orders.map((order: any) => ({
                                orderId: order.order_id,
                                ticketNumber: order.ticket_number || 'N/A',
                                items: order.order_items?.map((item: any) => ({
                                    productId: item.product_id,
                                    name: item.name,
                                    price: Number(item.price),
                                    quantity: item.quantity
                                })) || [],
                                timestamp: order.created_at,
                                total: Number(order.total),
                                status: order.status
                            }));

                            const current = apiOrders.filter(o =>
                                o.status === OrderStatus.PENDING ||
                                o.status === OrderStatus.PAID ||
                                o.status === OrderStatus.PREPARING
                            );
                            const past = apiOrders.filter(o =>
                                o.status === OrderStatus.COMPLETED
                            );

                            setCurrentOrders(current);
                            setPastOrders(past);
                            
                            console.log('✅ [ProductsDataContext] Orders updated from realtime event');
                        }
                    } catch (error) {
                        console.error('❌ [ProductsDataContext] Error fetching updated orders:', error);
                    }
                }
            )
            .subscribe((status) => {
                console.log('🔴 [ProductsDataContext] Realtime subscription status:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [ProductsDataContext] Successfully subscribed to orders realtime updates');
                }
            });

        return () => {
            console.log('🛑 [ProductsDataContext] Cleaning up Realtime subscription');
            supabase.removeChannel(ordersChannel);
        };
    }, [isListening]); // Only re-run if isListening changes

    // NOTE: Orders are NOT persisted to localStorage - always fetch from server
    // Only the cart (before checkout) is persisted to localStorage

    const addToCart = (productId: number, quantity: number) => {
        console.log(`➕ [ProductsDataContext] Adding to cart: Product #${productId}, quantity: ${quantity}`);
        setProducts((prevProducts) =>
            prevProducts.map((product) =>
                product.id === productId
                    ? { ...product, quantityInCart: product.quantityInCart + quantity }
                    : product
            )
        );
    };

    const removeFromCart = (productId: number) => {
        console.log(`❌ [ProductsDataContext] Removing from cart: Product #${productId}`);
        setProducts((prevProducts) =>
            prevProducts.map((product) =>
                product.id === productId ? { ...product, quantityInCart: 0 } : product
            )
        );
    };

    const updateCartQuantity = (productId: number, quantity: number) => {
        console.log(`🔄 [ProductsDataContext] Updating cart quantity: Product #${productId}, new quantity: ${quantity}`);
        setProducts((prevProducts) =>
            prevProducts.map((product) =>
                product.id === productId
                    ? { ...product, quantityInCart: quantity }
                    : product
            )
        );
    };

    const clearCart = () => {
        console.log('🗑️  [ProductsDataContext] Clearing cart');
        setProducts((prevProducts) =>
            prevProducts.map((product) => ({ ...product, quantityInCart: 0 }))
        );
        // Clear cart in localStorage
        localStorage.removeItem('commandapp_cart');
    };

    const getProductById = (id: number) => {
        return products.find(product => product.id === id);
    };

    const getCartItems = () => {
        return products.filter(product => product.quantityInCart > 0);
    };

    const placeOrder = async () => {
        const cartItems = getCartItems();

        if (cartItems.length === 0) {
            console.log('⚠️  [ProductsDataContext] Cannot place order: cart is empty');
            return null;
        }

        const timestamp = new Date().toISOString();

        // Get session token
        const sessionToken = getStoredSessionToken();

        // Prepare payload for backend
        const payload: any = {
            total: cartTotal,
            items: cartItems.map(item => ({
                productId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantityInCart
            }))
        };

        // Include session token if available
        if (sessionToken) {
            payload.sessionToken = sessionToken;
            console.log('🔐 [ProductsDataContext] Including session token in order');
        }

        console.log('📤 [ProductsDataContext] Placing order:', payload);

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                throw new Error('API error when placing order');
            }

            const body = await res.json();
            const backendOrder = body.order;

            console.log('✅ [ProductsDataContext] Order placed successfully:', backendOrder.order_id, 'Ticket:', backendOrder.ticket_number);

            const newOrder: Order = {
                orderId: backendOrder.order_id,
                ticketNumber: backendOrder.ticket_number,
                items: payload.items,
                timestamp: backendOrder.created_at || timestamp,
                total: payload.total,
                status: backendOrder.status || OrderStatus.PENDING
            };

            setCurrentOrders(prev => {
                const updated = [...prev, newOrder];
                console.log('📋 [ProductsDataContext] Added order to current orders. Total current orders:', updated.length);
                return updated;
            });
            clearCart();
            return newOrder;
        } catch (error) {
            console.error('❌ [ProductsDataContext] Error placing order to API, falling back to local order:', error);
            // Fallback to local behavior
            const newOrderId = uuidv4();
            const newOrder: Order = {
                orderId: newOrderId,
                ticketNumber: 'LOCAL-' + Math.random().toString().slice(2, 5),
                items: cartItems.map(item => ({
                    productId: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantityInCart
                })),
                timestamp,
                total: cartTotal,
                status: OrderStatus.PENDING,
            };

            console.log('⚠️  [ProductsDataContext] Created local order:', newOrderId);
            setCurrentOrders(prev => [...prev, newOrder]);
            clearCart();
            return newOrder;
        }
    };

    const updateOrderStatus = (orderId: string, status: OrderStatus) => {
        console.log(`🔄 [ProductsDataContext] Updating order ${orderId} status to: ${status}`);

        setCurrentOrders(prev => {
            return prev.map(order => {
                if (order.orderId === orderId) {
                    return { ...order, status };
                }
                return order;
            });
        });

        // If the order is complete, move it to past orders
        if (status === OrderStatus.COMPLETED) {
            const orderToMove = currentOrders.find(order => order.orderId === orderId);
            if (orderToMove) {
                const updatedOrder = { ...orderToMove, status };
                console.log(`📜 [ProductsDataContext] Moving order ${orderId} to past orders`);
                setPastOrders(prev => [...prev, updatedOrder]);
                setCurrentOrders(prev => prev.filter(order => order.orderId !== orderId));
            }
        }
    };

    const navigateToLanding = () => {
        console.log('🧭 [ProductsDataContext] Navigating to Landing');
        setCurrentView('landing');
    };

    const navigateToResume = () => {
        console.log('🧭 [ProductsDataContext] Navigating to Resume');
        setCurrentView('resume');
    };

    const navigateToMenu = () => {
        console.log('🧭 [ProductsDataContext] Navigating to Menu');
        setCurrentView('menu');
    };

    const navigateToOrderHistory = () => {
        console.log('🧭 [ProductsDataContext] Navigating to Order History');
        setCurrentView('orderHistory');
    };

    const navigateToTickets = () => {
        console.log('🧭 [ProductsDataContext] Navigating to Tickets');
        setCurrentView('tickets');
    };

    const navigateToInfo = () => {
        console.log('🧭 [ProductsDataContext] Navigating to Info');
        setCurrentView('info');
    };

    return (
        <ProductContext.Provider value={{
            products,
            addToCart,
            removeFromCart,
            clearCart,
            updateCartQuantity,
            getProductById,
            getCartItems,
            cartTotal,
            currentView,
            navigateToLanding,
            navigateToResume,
            navigateToMenu,
            navigateToOrderHistory,
            navigateToTickets,
            navigateToInfo,
            currentOrders,
            pastOrders,
            placeOrder,
            updateOrderStatus,
            isListening,
            isServiceOpen
        }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
};
