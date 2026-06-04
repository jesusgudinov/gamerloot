"use client"
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  product_id: number;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  max_stock?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (product_id: number) => void;
  updateQuantity: (product_id: number, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  
  // Descuentos y Cupones
  couponCode: string | null;
  couponDiscount: number;
  applyCoupon: (code: string, discount_type: string, discount_value: number, min_purchase: number) => { success: boolean; message: string };
  removeCoupon: () => void;
  
  finalTotal: number; // cartTotal - couponDiscount + shipping
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Estado para Cupones
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponData, setCouponData] = useState<{type: string, value: number, min: number} | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('gamer_loot_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart");
      }
    }
    
    const savedCoupon = localStorage.getItem('gamer_loot_coupon');
    if (savedCoupon) {
      try {
        const parsed = JSON.parse(savedCoupon);
        setCouponCode(parsed.code);
        setCouponData(parsed.data);
      } catch (e) {
        console.error("Failed to parse coupon");
      }
    }
    
    setIsLoaded(true);
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('gamer_loot_cart', JSON.stringify(items));
      if (couponCode && couponData) {
        localStorage.setItem('gamer_loot_coupon', JSON.stringify({ code: couponCode, data: couponData }));
      } else {
        localStorage.removeItem('gamer_loot_coupon');
      }
    }
  }, [items, couponCode, couponData, isLoaded]);

  const addToCart = (newItem: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === newItem.product_id);
      if (existing) {
        return prev.map(i => 
          i.product_id === newItem.product_id 
            ? { ...i, quantity: Math.min(i.quantity + newItem.quantity, i.max_stock || 99) }
            : i
        );
      }
      return [...prev, newItem];
    });
  };

  const removeFromCart = (product_id: number) => {
    setItems(prev => prev.filter(i => i.product_id !== product_id));
  };

  const updateQuantity = (product_id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(product_id);
      return;
    }
    setItems(prev => prev.map(i => i.product_id === product_id ? { ...i, quantity } : i));
  };

  const clearCart = () => {
    setItems([]);
    removeCoupon();
  };

  const cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = items.reduce((count, item) => count + item.quantity, 0);

  // Lógica de Cupón
  let couponDiscount = 0;
  if (couponData && cartTotal >= couponData.min) {
    if (couponData.type === 'percentage') {
      couponDiscount = cartTotal * (couponData.value / 100);
    } else if (couponData.type === 'fixed') {
      couponDiscount = Math.min(couponData.value, cartTotal); // No puede descontar más de lo que cuesta
    }
  }

  // Si aplicó cupón pero luego vació el carrito y bajó del mínimo
  useEffect(() => {
    if (couponData && cartTotal < couponData.min && cartTotal > 0) {
      removeCoupon();
    }
  }, [cartTotal, couponData]);

  const applyCoupon = (code: string, discount_type: string, discount_value: number, min_purchase: number) => {
    if (cartTotal < min_purchase) {
      return { success: false, message: `El carrito debe ser de al menos $${min_purchase.toFixed(2)}` };
    }
    
    setCouponCode(code);
    setCouponData({ type: discount_type, value: discount_value, min: min_purchase });
    return { success: true, message: `Cupón ${code} aplicado correctamente` };
  };

  const removeCoupon = () => {
    setCouponCode(null);
    setCouponData(null);
  };

  const finalTotal = Math.max(0, cartTotal - couponDiscount);

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount,
      couponCode, couponDiscount, applyCoupon, removeCoupon, finalTotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
