// Next.js API Route: GET /api/products
// Returns products grouped by category from Supabase

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ProductsTestData from '@/assets/Products.json';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any | null = null;
try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  } else {
    console.warn('Supabase URL or Key missing; falling back to local Products.json');
  }
} catch (err) {
  console.warn('Failed to create Supabase client; falling back to local Products.json', err);
  supabase = null;
}

export async function GET(request: NextRequest) {
  // If supabase client is not available, return local test data grouped the same way
  if (!supabase) {
    try {
      // ProductsTestData is already grouped by category in the same shape the frontend expects
      return NextResponse.json(ProductsTestData, { status: 200 });
    } catch (err: any) {
      console.error('Error returning local ProductsTestData:', err);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  try {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, image, details, category_id')
      .order('id', { ascending: true });

    if (productsError) {
      console.error('Error fetching products:', productsError);
      // fallback to local data
      return NextResponse.json(ProductsTestData, { status: 200 });
    }

    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .order('id', { ascending: true });

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return NextResponse.json(ProductsTestData, { status: 200 });
    }

    // Group products by category name
    const grouped: { [key: string]: any[] } = {};
    categories?.forEach((cat: any) => {
      grouped[cat.name] = [];
    });
    grouped['Uncategorized'] = [];

    products?.forEach((p: any) => {
      const item = {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        image: p.image,
        details: p.details
      };
      const cat = categories?.find((c: any) => c.id === p.category_id);
      if (cat) grouped[cat.name].push(item);
      else grouped['Uncategorized'].push(item);
    });

    // Remove Uncategorized if empty
    if (grouped['Uncategorized'].length === 0) delete grouped['Uncategorized'];

    return NextResponse.json(grouped, { status: 200 });
  } catch (err: any) {
    console.error('Unexpected error in /api/products:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
