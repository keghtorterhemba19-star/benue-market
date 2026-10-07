import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Product, ProductFilter } from '../types';
import { MOCK_PRODUCTS } from '../data/mockData';
import { fetchProductsFromSupabase, createProductInSupabase, updateProductInSupabase, deleteProductFromSupabase } from '../services/productService';
import { useAuth } from './AuthContext';

interface ProductContextType {
  products: Product[];
  savedProductIds: string[];
  recentlyViewedIds: string[];
  filter: ProductFilter;
  setFilter: React.Dispatch<React.SetStateAction<ProductFilter>>;
  toggleSaveProduct: (productId: string) => void;
  isProductSaved: (productId: string) => boolean;
  trackRecentlyViewed: (productId: string) => void;
  recentlyViewedProducts: Product[];
  filteredProducts: Product[];
  featuredProducts: Product[];
  getProductById: (id: string) => Product | undefined;
  getProductsBySeller: (sellerId: string) => Product[];
  resetFilters: () => void;
  addNewProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<Product | null>;
  deleteProduct: (productId: string) => Promise<void>;
  toggleFeatureProduct: (productId: string) => Promise<void>;
  deleteProductsBySeller: (sellerId: string) => Promise<void>;
  updateSellerInfoInProducts: (sellerId: string, updates: { sellerName?: string; sellerPhone?: string; sellerWhatsapp?: string; lga?: any; location?: string }) => void;
  refreshProducts: () => Promise<void>;
  isLoading: boolean;
}

const initialFilter: ProductFilter = {
  searchQuery: '',
  category: 'all',
  lga: 'all',
  minPrice: 0,
  maxPrice: 200000,
  sortBy: 'recent',
  availabilityOnly: false,
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isSeller, isSuperAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>(() => {
    const local = localStorage.getItem('benue_market_products');
    if (!local) return MOCK_PRODUCTS;
    try {
      const parsed: Product[] = JSON.parse(local);
      const existingIds = new Set(parsed.map((p) => p.id));
      const missingMocks = MOCK_PRODUCTS.filter((mp) => !existingIds.has(mp.id));
      return [...parsed, ...missingMocks];
    } catch {
      return MOCK_PRODUCTS;
    }
  });

  const [savedProductIds, setSavedProductIds] = useState<string[]>(() => {
    const local = localStorage.getItem('benue_market_saved_ids');
    return local ? JSON.parse(local) : ['prod-1', 'prod-6', 'prod-10'];
  });

  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    const local = localStorage.getItem('benue_market_recently_viewed');
    return local ? JSON.parse(local) : ['prod-2', 'prod-3', 'prod-4'];
  });

  const [filter, setFilter] = useState<ProductFilter>(initialFilter);

  // Fetch live products from Supabase on initial mount
  const refreshProducts = useCallback(async () => {
    setIsLoading(true);
    const supabaseProducts = await fetchProductsFromSupabase();
    if (supabaseProducts && supabaseProducts.length > 0) {
      setProducts(supabaseProducts);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchProductsFromSupabase().then((supabaseProducts) => {
      if (isMounted && supabaseProducts && supabaseProducts.length > 0) {
        setProducts(supabaseProducts);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('benue_market_products', JSON.stringify(products));
  }, [products]);

  // Cross-tab auto-sync for products state
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'benue_market_products' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setProducts(parsed);
        } catch {}
      }
      if (e.key === 'benue_market_recently_viewed' && e.newValue) {
        try {
          setRecentlyViewedIds(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('benue_market_saved_ids', JSON.stringify(savedProductIds));
  }, [savedProductIds]);

  useEffect(() => {
    localStorage.setItem('benue_market_recently_viewed', JSON.stringify(recentlyViewedIds));
  }, [recentlyViewedIds]);

  const toggleSaveProduct = (productId: string) => {
    setSavedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isProductSaved = (productId: string) => {
    return savedProductIds.includes(productId);
  };

  const trackRecentlyViewed = useCallback((productId: string) => {
    setRecentlyViewedIds((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      return [productId, ...filtered].slice(0, 10);
    });
  }, []);

  const recentlyViewedProducts = useMemo(() => {
    return recentlyViewedIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [recentlyViewedIds, products]);

  const resetFilters = () => {
    setFilter(initialFilter);
  };

  const addNewProduct = async (newProdData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    if (!isSeller && currentUser?.role !== 'seller' && !isSuperAdmin) {
      throw new Error('Permission denied: Only registered Farmers, Producers, or Cooperatives can list produce on Benue Market.');
    }

    try {
      const createdDbProduct = await createProductInSupabase(newProdData, currentUser?.role || 'seller');
      if (createdDbProduct) {
        setProducts((prev) => [createdDbProduct, ...prev.filter((p) => p.id !== createdDbProduct.id)]);
        return createdDbProduct;
      }
    } catch (err) {
      console.warn('Supabase product insertion fallback to local memory:', err);
    }

    const fallbackProduct: Product = {
      ...newProdData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [fallbackProduct, ...prev]);
    return fallbackProduct;
  };

  const updateProduct = async (productId: string, updates: Partial<Product>): Promise<Product | null> => {
    const existing = products.find((p) => p.id === productId);
    if (!existing) return null;

    if (currentUser && currentUser.id !== existing.sellerId && !isSuperAdmin) {
      throw new Error('Permission denied: You can only edit your own produce listings.');
    }

    const updatedProductData: Product = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (currentUser?.id) {
        const dbUpdated = await updateProductInSupabase(productId, existing.sellerId, updates);
        if (dbUpdated) {
          setProducts((prev) => prev.map((p) => (p.id === productId ? dbUpdated : p)));
          return dbUpdated;
        }
      }
    } catch (err) {
      console.warn('Supabase product update error, fallback to local state:', err);
    }

    setProducts((prev) => prev.map((p) => (p.id === productId ? updatedProductData : p)));
    return updatedProductData;
  };

  const deleteProduct = async (productId: string) => {
    const existing = products.find((p) => p.id === productId);
    if (!existing) return;

    if (!isSuperAdmin && currentUser?.id !== existing.sellerId) {
      throw new Error('Permission Denied: Only the Super Administrator or the listing owner can delete this produce item.');
    }

    if (currentUser?.id) {
      await deleteProductFromSupabase(productId, existing.sellerId);
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setSavedProductIds((prev) => prev.filter((id) => id !== productId));
    setRecentlyViewedIds((prev) => prev.filter((id) => id !== productId));
  };

  const toggleFeatureProduct = async (productId: string) => {
    if (!isSuperAdmin) {
      throw new Error('Permission Denied: Only the Super Administrator can change featured status.');
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isFeatured: !p.isFeatured, updatedAt: new Date().toISOString() } : p))
    );
  };

  const deleteProductsBySeller = async (sellerId: string) => {
    if (!isSuperAdmin) {
      throw new Error('Permission Denied: Only the Super Administrator can perform bulk deletion of seller produce.');
    }

    setProducts((prev) => prev.filter((p) => p.sellerId !== sellerId));
  };

  const updateSellerInfoInProducts = useCallback((sellerId: string, updates: { sellerName?: string; sellerPhone?: string; sellerWhatsapp?: string; lga?: any; location?: string }) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.sellerId === sellerId) {
          return {
            ...p,
            ...(updates.sellerName ? { sellerName: updates.sellerName } : {}),
            ...(updates.sellerPhone ? { sellerPhone: updates.sellerPhone } : {}),
            ...(updates.sellerWhatsapp ? { sellerWhatsapp: updates.sellerWhatsapp } : {}),
            ...(updates.lga ? { lga: updates.lga } : {}),
            ...(updates.location ? { location: updates.location } : {}),
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  }, []);

  const getProductById = (id: string) => {
    return products.find((p) => p.id === id);
  };

  const getProductsBySeller = (sellerId: string) => {
    return products.filter((p) => p.sellerId === sellerId);
  };

  const featuredProducts = useMemo(() => {
    return products.filter((p) => p.isFeatured);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (filter.searchQuery.trim()) {
        const query = filter.searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        const matchesSeller = product.sellerName.toLowerCase().includes(query);
        const matchesLocation = product.location.toLowerCase().includes(query);
        const matchesLga = product.lga.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesSeller && !matchesLocation && !matchesLga) {
          return false;
        }
      }

      if (filter.category !== 'all' && product.category !== filter.category) {
        return false;
      }

      if (filter.lga !== 'all' && product.lga !== filter.lga) {
        return false;
      }

      if (product.price < filter.minPrice || product.price > filter.maxPrice) {
        return false;
      }

      if (filter.availabilityOnly && product.availability !== 'in_stock') {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filter.sortBy === 'price_low') {
        return a.price - b.price;
      }
      if (filter.sortBy === 'price_high') {
        return b.price - a.price;
      }
      if (filter.sortBy === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
  }, [products, filter]);

  return (
    <ProductContext.Provider
      value={{
        products,
        savedProductIds,
        recentlyViewedIds,
        filter,
        setFilter,
        toggleSaveProduct,
        isProductSaved,
        trackRecentlyViewed,
        recentlyViewedProducts,
        filteredProducts,
        featuredProducts,
        getProductById,
        getProductsBySeller,
        resetFilters,
        addNewProduct,
        updateProduct,
        deleteProduct,
        toggleFeatureProduct,
        deleteProductsBySeller,
        updateSellerInfoInProducts,
        refreshProducts,
        isLoading,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};


