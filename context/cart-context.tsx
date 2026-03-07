import React, { createContext, useContext, useState } from "react";

export interface Medicine {
  _id: string;
  name: string;
  description?: string;
  category: string;
  dose: string;
  quantity: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: Array<{
    user: { firstName: string; lastName: string };
    rating: number;
    comment?: string;
    createdAt: string;
  }>;
  imageUrl?: string;
  inStock: boolean;
  requiresPrescription: boolean;
  tags: string[];
  activeIngredients: string[];
  sideEffects: string[];
  manufacturer?: string;
}

export type CartItem = {
  medicine: Medicine;
  qty: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (medicine: Medicine) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (medicine: Medicine) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.medicine._id === medicine._id);
      if (existing)
        return prev.map((i) =>
          i.medicine._id === medicine._id ? { ...i, qty: i.qty + 1 } : i,
        );
      return [...prev, { medicine, qty: 1 }];
    });
  };

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.medicine._id !== id));

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.medicine._id === id ? { ...i, qty } : i)),
    );
  };

  const clearCart = () => setItems([]);
  const totalCount = items.reduce((s, i) => s + i.qty, 0);
  const totalPrice = items.reduce((s, i) => s + i.medicine.price * i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        totalCount,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
