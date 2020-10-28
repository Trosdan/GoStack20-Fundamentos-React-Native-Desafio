import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStorage = await AsyncStorage.getItem(
        '@GoMarketPlace:products',
      );

      if (productsStorage) setProducts(JSON.parse(productsStorage));
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const productExists = products.find(p => p.id === product.id);

      if (productExists) {
        const newProducts = products.map(p => {
          if (p.id === productExists.id)
            return { ...p, quantity: p.quantity + 1 };
          return p;
        });

        setProducts(newProducts);
        await AsyncStorage.setItem(
          '@GoMarketPlace:products',
          JSON.stringify(newProducts),
        );
      } else {
        const newProducts = [...products, { ...product, quantity: 1 }];

        setProducts(newProducts);
        await AsyncStorage.setItem(
          '@GoMarketPlace:products',
          JSON.stringify(newProducts),
        );
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts = products.map(p =>
        p.id === id ? { ...p, quantity: p.quantity + 1 } : p,
      );

      setProducts(newProducts);
      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productExist = products.find(p => p.id === id);

      if (productExist?.quantity === 1) {
        const newProducts = products.filter(p => p.id !== productExist.id);

        setProducts(newProducts);
        await AsyncStorage.setItem(
          '@GoMarketPlace:products',
          JSON.stringify(newProducts),
        );
      } else {
        const newProducts = products.map(p =>
          p.id === id ? { ...p, quantity: p.quantity - 1 } : p,
        );
        setProducts(newProducts);
        await AsyncStorage.setItem(
          '@GoMarketPlace:products',
          JSON.stringify(newProducts),
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
