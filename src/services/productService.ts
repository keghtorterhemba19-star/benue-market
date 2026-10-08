import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { Product, BenueLGA, CategoryType, AvailabilityStatus } from '../types';
import { compressFileToMinimumCapacity } from '../utils/imageCompressor';

interface SupabaseProductRow {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_phone: string;
  seller_whatsapp: string | null;
  is_verified_seller: boolean | null;
  name: string;
  category: string;
  description: string;
  price: number | string;
  unit: string;
  quantity: number;
  minimum_order: number;
  location: string;
  lga: string;
  availability: string | null;
  is_featured: boolean | null;
  created_at: string;
  updated_at: string;
  product_images?: Array<{ image_url: string; display_order: number }>;
}

export const mapSupabaseRowToProduct = (row: SupabaseProductRow): Product => {
  const images = (row.product_images && row.product_images.length > 0)
    ? row.product_images.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)).map((img) => img.image_url)
    : [];

  return {
    id: row.id,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    sellerPhone: row.seller_phone,
    sellerWhatsapp: row.seller_whatsapp || row.seller_phone,
    isVerifiedSeller: Boolean(row.is_verified_seller),
    sellerRole: 'farmer',
    name: row.name,
    category: row.category as CategoryType,
    description: row.description,
    price: Number(row.price),
    unit: row.unit,
    quantity: Number(row.quantity) || 1,
    minimumOrder: Number(row.minimum_order) || 1,
    location: row.location,
    lga: row.lga as BenueLGA,
    images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=800'],
    availability: (row.availability as AvailabilityStatus) || 'in_stock',
    isFeatured: Boolean(row.is_featured),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * Fetches public produce listings from Supabase
 */
export const fetchProductsFromSupabase = async (): Promise<Product[] | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(image_url, display_order)')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase products fetch failed:', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];

    return (data as SupabaseProductRow[]).map(mapSupabaseRowToProduct);
  } catch (err) {
    console.warn('Error fetching products from Supabase:', err);
    return null;
  }
};

/**
 * Creates a produce listing in Supabase (Enforces that user is an authenticated seller)
 */
export const createProductInSupabase = async (
  newProd: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  sellerRole?: string
): Promise<Product | null> => {
  if (sellerRole !== 'seller') {
    throw new Error('Only registered Farmers, Producers, or Cooperatives (Sellers) are authorized to list produce.');
  }

  if (!isSupabaseConfigured()) return null;

  try {
    const { data: insertedProduct, error: prodError } = await supabase
      .from('products')
      .insert([
        {
          seller_id: newProd.sellerId,
          seller_name: newProd.sellerName,
          seller_phone: newProd.sellerPhone,
          seller_whatsapp: newProd.sellerWhatsapp,
          is_verified_seller: newProd.isVerifiedSeller,
          name: newProd.name,
          category: newProd.category,
          description: newProd.description,
          price: newProd.price,
          unit: newProd.unit,
          quantity: newProd.quantity,
          minimum_order: newProd.minimumOrder,
          location: newProd.location,
          lga: newProd.lga,
          availability: newProd.availability,
          is_featured: newProd.isFeatured ?? true,
        },
      ])
      .select()
      .single();

    if (prodError || !insertedProduct) {
      console.error('Failed to insert product into Supabase:', prodError);
      throw new Error(prodError?.message || 'Database error creating product listing');
    }

    // Insert photos to product_images
    if (newProd.images && newProd.images.length > 0) {
      const imageRows = newProd.images.map((url, idx) => ({
        product_id: insertedProduct.id,
        image_url: url,
        display_order: idx,
      }));

      const { error: imgError } = await supabase.from('product_images').insert(imageRows);
      if (imgError) {
        console.warn('Could not insert product images:', imgError.message);
      }
    }

    return {
      ...newProd,
      id: insertedProduct.id,
      createdAt: insertedProduct.created_at,
      updatedAt: insertedProduct.updated_at,
    };
  } catch (err: any) {
    console.error('Error in createProductInSupabase:', err);
    throw err;
  }
};

/**
 * Updates an existing produce listing in Supabase (Enforces ownership)
 */
export const updateProductInSupabase = async (
  productId: string,
  sellerId: string,
  updates: Partial<Product>
): Promise<Product | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const payload: Partial<SupabaseProductRow> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.unit !== undefined) payload.unit = updates.unit;
    if (updates.quantity !== undefined) payload.quantity = updates.quantity;
    if (updates.minimumOrder !== undefined) payload.minimum_order = updates.minimumOrder;
    if (updates.location !== undefined) payload.location = updates.location;
    if (updates.lga !== undefined) payload.lga = updates.lga;
    if (updates.availability !== undefined) payload.availability = updates.availability;
    if (updates.isFeatured !== undefined) payload.is_featured = updates.isFeatured;
    if (updates.sellerPhone !== undefined) payload.seller_phone = updates.sellerPhone;
    if (updates.sellerWhatsapp !== undefined) payload.seller_whatsapp = updates.sellerWhatsapp;

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId)
      .eq('seller_id', sellerId)
      .select('*, product_images(image_url, display_order)')
      .single();

    if (error || !updatedProduct) {
      console.error('Failed to update product in Supabase:', error);
      throw new Error(error?.message || 'Database error updating product listing');
    }

    // Update images if provided
    if (updates.images && updates.images.length > 0) {
      // Remove old image records and insert updated ones
      await supabase.from('product_images').delete().eq('product_id', productId);
      const imageRows = updates.images.map((url, idx) => ({
        product_id: productId,
        image_url: url,
        display_order: idx,
      }));
      await supabase.from('product_images').insert(imageRows);
    }

    return mapSupabaseRowToProduct(updatedProduct as SupabaseProductRow);
  } catch (err) {
    console.error('Error updating product in Supabase:', err);
    throw err;
  }
};

/**
 * Deletes a produce listing from Supabase (Checks ownership)
 */
export const deleteProductFromSupabase = async (productId: string, sellerId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return true;

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('seller_id', sellerId);

    if (error) {
      console.error('Failed to delete product from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting product from Supabase:', err);
    return false;
  }
};

/**
 * Uploads media to Supabase storage bucket 'benue-market-media'
 * SECURITY: Validates MIME type, file size, and sanitizes file extension
 */
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
]);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const uploadMediaToSupabaseBucket = async (
  file: File,
  folder: 'produce' | 'avatars' | 'covers' | 'gallery' = 'produce'
): Promise<{ url: string | null; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { url: null, error: 'Supabase is not configured in environment variables.' };
  }

  try {
    // AUTOMATIC COMPRESSION: Compress file before uploading
    const compressedFile = await compressFileToMinimumCapacity(file, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.75,
    });

    // SECURITY: Validate MIME type
    if (!ALLOWED_IMAGE_TYPES.has(compressedFile.type.toLowerCase())) {
      const msg = `Invalid file type "${compressedFile.type}". Only JPEG, PNG, WebP, GIF, and AVIF images are allowed.`;
      console.error(`[StorageUploadError] Bucket: benue-market-media, Folder: ${folder} - ${msg}`);
      return { url: null, error: msg };
    }

    // SECURITY: Validate extension
    const nameExt = (compressedFile.name.split('.').pop() || '').toLowerCase();
    if (nameExt && !ALLOWED_EXTENSIONS.has(nameExt)) {
      const msg = `Suspicious file extension ".${nameExt}". Please upload a valid image file.`;
      console.error(`[StorageUploadError] Bucket: benue-market-media, Folder: ${folder} - ${msg}`);
      return { url: null, error: msg };
    }

    // SECURITY: Enforce file size limit
    if (compressedFile.size > MAX_FILE_SIZE_BYTES) {
      const msg = `File size ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB exceeds 5MB limit.`;
      console.error(`[StorageUploadError] Bucket: benue-market-media, Folder: ${folder} - ${msg}`);
      return { url: null, error: msg };
    }

    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
      'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif',
    };
    const fileExt = mimeToExt[compressedFile.type.toLowerCase()] || nameExt || 'jpg';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('benue-market-media')
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: compressedFile.type,
      });

    if (uploadError) {
      console.error(`[StorageUploadError] Bucket: benue-market-media, Path: ${fileName} - ${uploadError.message}`);
      return { url: null, error: uploadError.message };
    }

    const { data } = supabase.storage.from('benue-market-media').getPublicUrl(fileName);
    return { url: data.publicUrl };
  } catch (err: any) {
    const errorMsg = err?.message || 'Unexpected exception during file upload';
    console.error(`[StorageUploadException] Bucket: benue-market-media, Folder: ${folder} - ${errorMsg}`);
    return { url: null, error: errorMsg };
  }
};

export const uploadProduceImageToSupabase = async (
  file: File,
  folder = 'produce'
): Promise<string | null> => {
  const result = await uploadMediaToSupabaseBucket(file, folder as any);
  if (result.error && !result.url) {
    console.warn('[ProduceUploadWarning]', result.error);
  }
  return result.url;
};

