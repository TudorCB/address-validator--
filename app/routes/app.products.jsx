import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

export const loader = async () => json({ products: [] });

export default function Products() {
  const { products } = useLoaderData();
  return <div><h1>Products</h1>{products.length===0 && <p>No products</p>}</div>;
}
