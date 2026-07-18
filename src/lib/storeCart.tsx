"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { StoreProduct } from "@/types/storefront";

export type StoreCartLine = {
  product: StoreProduct;
  quantity: number;
};

type StoreCartContextValue = {
  lines: StoreCartLine[];
  total: number;
  count: number;
  addProduct: (product: StoreProduct) => void;
  increaseLine: (productId: string) => void;
  decreaseLine: (productId: string) => void;
  removeLine: (productId: string) => void;
  clearCart: () => void;
};

const StoreCartContext = createContext<StoreCartContextValue | null>(null);

export function StoreCartProvider({ storeSlug, children }: { storeSlug: string; children: ReactNode }) {
  const storageKey = `shopfy:store-cart:${storeSlug}`;
  const [lines, setLines] = useState<StoreCartLine[]>([]);
  const [hasLoadedCart, setHasLoadedCart] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      try {
        const storedCart = window.localStorage.getItem(storageKey);

        if (storedCart) {
          const parsedCart = JSON.parse(storedCart) as StoreCartLine[];
          setLines(Array.isArray(parsedCart) ? parsedCart.filter(isUsableCartLine) : []);
        }
      } catch {
        setLines([]);
      } finally {
        setHasLoadedCart(true);
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [storageKey]);

  useEffect(() => {
    if (!hasLoadedCart) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(lines));
  }, [hasLoadedCart, lines, storageKey]);

  const value = useMemo<StoreCartContextValue>(() => {
    const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);

    return {
      lines,
      total,
      count,
      addProduct(product) {
        setLines((currentLines) => {
          const existingLine = currentLines.find((line) => line.product.id === product.id);

          if (existingLine) {
            return currentLines.map((line) => (
              line.product.id === product.id ? { ...line, product, quantity: line.quantity + 1 } : line
            ));
          }

          return [{ product, quantity: 1 }, ...currentLines];
        });
      },
      increaseLine(productId) {
        setLines((currentLines) => (
          currentLines.map((line) => (
            line.product.id === productId ? { ...line, quantity: line.quantity + 1 } : line
          ))
        ));
      },
      decreaseLine(productId) {
        setLines((currentLines) => (
          currentLines.flatMap((line) => {
            if (line.product.id !== productId) {
              return [line];
            }

            if (line.quantity <= 1) {
              return [];
            }

            return [{ ...line, quantity: line.quantity - 1 }];
          })
        ));
      },
      removeLine(productId) {
        setLines((currentLines) => currentLines.filter((line) => line.product.id !== productId));
      },
      clearCart() {
        setLines([]);
      },
    };
  }, [lines]);

  return (
    <StoreCartContext.Provider value={value}>
      {children}
    </StoreCartContext.Provider>
  );
}

export function useStoreCart() {
  const context = useContext(StoreCartContext);

  if (!context) {
    throw new Error("useStoreCart must be used inside StoreCartProvider.");
  }

  return context;
}

function isUsableCartLine(line: StoreCartLine) {
  return Boolean(
    line &&
    line.product &&
    line.product.id &&
    line.product.title &&
    Number.isFinite(line.product.price) &&
    Number.isFinite(line.quantity) &&
    line.quantity > 0,
  );
}
