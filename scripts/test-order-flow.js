// Integration test script for cart → order flow
// Usage: 
//   1. Start Next.js dev server: npm run dev
//   2. Run test: npm run test-order-flow
// Or set BASE_URL env var to test against production

require('dotenv').config({ path: '.env.local' });

// Default to port 3000 (Next.js dev server)
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testOrderFlow() {
    console.log('🧪 Testing Order Flow Integration\n');
    console.log(`📍 Testing against: ${BASE_URL}\n`);

    // Step 0: Check if Next.js server is running by testing the API
    console.log('0️⃣  Checking if Next.js dev server is running...');
    try {
        const healthCheck = await fetch(`${BASE_URL}/api/products`).catch(() => null);
        if (!healthCheck || !healthCheck.ok) {
            console.error('❌ Next.js dev server is not running!');
            console.error('');
            console.error('Please start the Next.js dev server first:');
            console.error('  npm run dev');
            console.error('');
            console.error('The server should be running on http://localhost:3000');
            console.error('');
            console.error('To test against a different URL:');
            console.error('  BASE_URL=http://your-url.com npm run test-order-flow');
            process.exit(1);
        }
        console.log('✅ Next.js dev server is running\n');
    } catch (error) {
        console.error('❌ Cannot connect to Next.js server');
        console.error('Start with: npm run dev');
        process.exit(1);
    }

    // Step 1: Fetch products
    console.log('1️⃣  Fetching products from /api/products...');
    try {
        const productsRes = await fetch(`${BASE_URL}/api/products`);
        if (!productsRes.ok) {
            throw new Error(`Products fetch failed: ${productsRes.statusText}`);
        }
        const products = await productsRes.json();
        const allProducts = Object.values(products).flat();
        console.log(`✅ Fetched ${allProducts.length} products across ${Object.keys(products).length} categories\n`);

        // Step 2: Simulate cart (pick first product)
        const testProduct = allProducts[0];
        console.log('2️⃣  Simulating cart with product:', testProduct.name);
        const cartItems = [
            {
                productId: testProduct.id,
                name: testProduct.name,
                price: testProduct.price,
                quantity: 2
            }
        ];
        const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        console.log(`   Cart total: $${total.toFixed(2)}\n`);

        // Step 3: Place order
        console.log('3️⃣  Placing order via POST /api/orders...');
        const orderPayload = {
            total,
            status: 'PLACED',
            items: cartItems
        };

        const orderRes = await fetch(`${BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });

        if (!orderRes.ok) {
            const errorText = await orderRes.text();
            throw new Error(`Order creation failed: ${orderRes.statusText} - ${errorText}`);
        }

        const orderData = await orderRes.json();
        const orderId = orderData.order.order_id;
        console.log(`✅ Order created with ID: ${orderId}\n`);

        // Step 4: Fetch order by ID
        console.log('4️⃣  Fetching order via GET /api/orders/:id...');
        const fetchOrderRes = await fetch(`${BASE_URL}/api/orders/${orderId}`);
        if (!fetchOrderRes.ok) {
            throw new Error(`Fetch order failed: ${fetchOrderRes.statusText}`);
        }
        const fetchedOrder = await fetchOrderRes.json();
        console.log(`✅ Order retrieved:`, {
            id: fetchedOrder.order.order_id,
            status: fetchedOrder.order.status,
            total: fetchedOrder.order.total,
            itemCount: fetchedOrder.items.length
        });
        console.log();

        // Step 5: Update order status (admin action)
        console.log('5️⃣  Updating order status to PROCESSING...');
        const updateRes = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'PROCESSING' })
        });

        if (!updateRes.ok) {
            const errorText = await updateRes.text();
            throw new Error(`Status update failed: ${updateRes.statusText} - ${errorText}`);
        }

        const updatedOrder = await updateRes.json();
        console.log(`✅ Order status updated to: ${updatedOrder.order.status}\n`);

        // Step 6: Fetch all orders (admin)
        console.log('6️⃣  Fetching all orders via GET /api/orders...');
        const allOrdersRes = await fetch(`${BASE_URL}/api/orders`);
        if (!allOrdersRes.ok) {
            throw new Error(`Fetch all orders failed: ${allOrdersRes.statusText}`);
        }
        const allOrdersData = await allOrdersRes.json();
        console.log(`✅ Total orders in system: ${allOrdersData.orders.length}\n`);

        console.log('🎉 All tests passed! Order flow is working correctly.\n');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

// Run the test
testOrderFlow()
    .then(success => process.exit(success ? 0 : 1))
    .catch(err => {
        console.error('Unexpected error:', err);
        process.exit(1);
    });
