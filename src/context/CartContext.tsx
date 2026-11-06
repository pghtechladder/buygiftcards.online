"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getBrand, chargeAmountCents } from "@/lib/brands";
import { trackRetailEvent } from "@/lib/analytics";

export type CartItem = {
  key: string;
  brandSlug: string;
  brandName: string;
  domain: string;
  color: string;
  amount: number; // face value in dollars
  qty: number;
  deliveryType: "egift" | "physical";
  customPhotoUrl?: string;
  recipientName?: string;
  recipientEmail?: string;
  senderName?: string;
  giftMessage?: string;
  occasion?: string;
  deliveryDate?: string;
};

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "key">) => void;
  updateQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  count: number;
  total: number; // Actual discounted checkout charge
  faceTotal: number; // Face value total of cards
  savingsTotal: number; // Total customer savings
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "bgc_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add: CartContextValue["add"] = (item) => {
    // Photo & recipient included in the key so cards for different recipients
    // or with different photos become separate lines instead of merging.
    const key = `${item.brandSlug}-${item.amount}-${item.deliveryType}-${item.customPhotoUrl ?? ""}-${item.recipientEmail ?? ""}`;
    setItems((prev) => {
      const i = prev.findIndex((x) => x.key === key);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: Math.min(next[i].qty + item.qty, 10) };
        return next;
      }
      return [...prev, { ...item, key }];
    });
    const brand = getBrand(item.brandSlug);
    const chargeDollars = brand ? chargeAmountCents(brand, item.amount) / 100 : item.amount;
    trackRetailEvent("add_to_cart", {
      currency: "USD",
      value: Math.round(chargeDollars * item.qty * 100) / 100,
      items: [
        {
          item_id: item.brandSlug,
          item_name: item.brandName,
          item_category: brand?.category || "Gift Card",
          item_variant: item.deliveryType,
          price: chargeDollars,
          quantity: item.qty,
        },
      ],
    });
    setOpen(true);
  };

  const updateQty = (key: string, qty: number) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(10, qty)) } : i)));

  const remove = (key: string) => {
    const existing = items.find((i) => i.key === key);
    if (existing) {
      trackRetailEvent("remove_from_cart", {
        currency: "USD",
        value: existing.amount * existing.qty,
        items: [
          {
            item_id: existing.brandSlug,
            item_name: existing.brandName,
            item_variant: existing.deliveryType,
            price: existing.amount,
            quantity: existing.qty,
          },
        ],
      });
    }
    setItems((prev) => prev.filter((i) => i.key !== key));
  };
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.qty, 0);

  // Calculate actual charged price with discounts applied
  const faceTotal = items.reduce((s, i) => s + i.amount * i.qty, 0);
  const totalCents = items.reduce((s, i) => {
    const brand = getBrand(i.brandSlug);
    const chargeCents = brand ? chargeAmountCents(brand, i.amount) : Math.round(i.amount * 100);
    return s + chargeCents * i.qty;
  }, 0);
  const total = Math.round(totalCents) / 100;
  const savingsTotal = Math.max(0, Math.round((faceTotal - total) * 100) / 100);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        setOpen,
        add,
        updateQty,
        remove,
        clear,
        count,
        total,
        faceTotal,
        savingsTotal,
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
