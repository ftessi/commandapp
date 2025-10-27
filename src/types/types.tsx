export interface Product {
    id: number;
    name: string;
    price: number;
    image: string;
    details: string;
    quantityInCart: number; // Tracks how many items are in the cart
}

export interface ProductListProps {
    category: string;
    products: Product[];
}

export interface ProductListContainerProps {
    data: {
        [category: string]: Product[];
    };
}

export enum OrderStatus {
    PENDING = 'pending',       // Order placed, awaiting payment
    PAID = 'paid',             // Payment confirmed by admin
    PREPARING = 'preparing',   // Being prepared at bar
    COMPLETED = 'completed'    // Order delivered to customer
}

export enum TicketStatus {
    PENDING = 'pending',       // Ticket ordered, awaiting payment
    PAID = 'paid',             // Payment confirmed, QR generated
    REDEEMED = 'redeemed'      // Ticket used/redeemed at event
}

export interface Ticket {
    id: string;
    ticketType: string;
    firstName: string;
    lastName: string;
    email: string;
    status: TicketStatus;
    qrCode: string;            // UUID for QR code
    price: number;
    createdAt: string;
    paidAt?: string;
    redeemedAt?: string;
}

export interface TicketType {
    id: number;
    name: string;
    description: string;
    price: number;
    available: boolean;
}

export interface OrderItem {
    productId: number;
    name: string;
    price: number;
    quantity: number;
}

export interface Order {
    orderId: string;
    ticketNumber: string;      // TI-XXX or DR-XXXX format
    items: OrderItem[];
    timestamp: string;
    total: number;
    status: OrderStatus;
}

export interface ProductContextType {
    products: Product[];
    addToCart: (productId: number, quantity: number) => void;
    removeFromCart: (productId: number) => void;
    clearCart: () => void;
    updateCartQuantity: (productId: number, quantity: number) => void;
    getProductById: (id: number) => Product | undefined;
    getCartItems: () => Product[];
    cartTotal: number;
    currentView: 'landing' | 'menu' | 'resume' | 'orderHistory' | 'tickets' | 'info';
    navigateToLanding: () => void;
    navigateToResume: () => void;
    navigateToMenu: () => void;
    navigateToOrderHistory: () => void;
    navigateToTickets: () => void;
    navigateToInfo: () => void;
    currentOrders: Order[];
    pastOrders: Order[];
    placeOrder: () => Promise<Order | null>;
    updateOrderStatus: (orderId: string, status: OrderStatus) => void;
    isListening: boolean;
    isServiceOpen: boolean;
}