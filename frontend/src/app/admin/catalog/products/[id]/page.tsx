'use client';
import { use } from 'react';
import ProductEditor from '@/components/admin/ProductEditor';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <ProductEditor productId={resolvedParams.id} />;
}
