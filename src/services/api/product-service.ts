// @ts-nocheck

import type { ProductService } from '../core/contracts';
import type {
  EntityId,
  PaginatedResult,
  ProductCategoryListParams,
  ProductCategoryMutationInput,
  ProductCategoryPatchInput,
  ProductMutationInput,
  ProductPatchInput,
  TableQueryParams,
} from '../../types/domain';
import { apiClient } from '../../lib/api-client';
import {
  mapProductCategoryDtoToModel,
  mapProductCategoryListDtoToItems,
  mapProductDtoToModel,
  mapProductImageDtoToModel,
  mapProductListDtoToItems,
  type ProductCategoryDto,
  type ProductDto,
  type ProductImageDto,
} from '../adapters/product-adapter';

function isNotFoundError(error: unknown): boolean {
  const status =
    error &&
    typeof error === 'object' &&
    'response' in error &&
    (error as { response?: { status?: number } }).response?.status;

  return status === 404;
}

function shouldTryAlternativeImageEndpoint(error: unknown): boolean {
  const status =
    error &&
    typeof error === 'object' &&
    'response' in error &&
    (error as { response?: { status?: number } }).response?.status;

  return status === 400 || status === 404 || status === 405 || status === 422;
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function toPaginatedResult<T>(
  allItems: T[],
  params?: { page?: number; pageSize?: number; page_size?: number },
  totalItemsHint?: number | null,
): PaginatedResult<T> {
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.max(1, params?.pageSize ?? params?.page_size ?? 10);
  const start = (page - 1) * pageSize;
  const hasServerPaginationHint = typeof totalItemsHint === 'number' && totalItemsHint >= 0;

  const items = hasServerPaginationHint ? allItems : allItems.slice(start, start + pageSize);
  const totalItems = hasServerPaginationHint ? totalItemsHint : allItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    items,
    meta: {
      page: Math.min(page, totalPages),
      pageSize,
      totalItems,
      totalPages,
    },
  };
}

function toMutationPayload(input: ProductMutationInput | ProductPatchInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) {
    payload.name = input.name;
  }
  if (input.description !== undefined) {
    payload.description = input.description;
  }
  if (input.price !== undefined) {
    payload.price = input.price;
  }
  if (input.stockQuantity !== undefined) {
    payload.stock_quantity = input.stockQuantity;
  }
  if (input.minimalStock !== undefined) {
    payload.minimal_stock = input.minimalStock;
  }
  if (input.isActive !== undefined) {
    payload.is_active = input.isActive;
  }
  if (input.isPromoted !== undefined) {
    payload.is_promoted = input.isPromoted;
  }
  if (input.categoryId !== undefined) {
    const normalizedCategoryId =
      typeof input.categoryId === 'string' ? input.categoryId.trim() : input.categoryId;
    payload.category = normalizedCategoryId;
  }
  if (input.metadata !== undefined) {
    payload.metadata = input.metadata;
  }
  return payload;
}

function toCategoryMutationPayload(
  input: ProductCategoryMutationInput | ProductCategoryPatchInput,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) {
    payload.name = input.name;
  }
  if (input.code !== undefined) {
    payload.code = input.code;
  }
  return payload;
}

export const apiProductService: ProductService = {
  async list(params) {
    return apiProductService.listProducts(params);
  },

  async getById(id) {
    return apiProductService.getProductById(id);
  },

  async listProducts(params) {
    const { data } = await apiClient.get<unknown>('/api/products/', {
      params: {
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? params?.page_size,
        search: params?.search,
        is_promoted: params?.isPromoted ?? params?.is_promoted,
        ordering:
          params?.ordering ??
          (params?.sortBy ? `${params?.sortDirection === 'desc' ? '-' : ''}${params.sortBy}` : undefined),
      },
    });

    const items = mapProductListDtoToItems(data);
    const payload =
      data && typeof data === 'object' && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : null;
    const totalItemsHint = readNumber(payload?.count);

    return toPaginatedResult(items, params, totalItemsHint);
  },

  async getProductById(id) {
    const { data } = await apiClient.get<ProductDto>(`/api/products/${id}/`);
    return mapProductDtoToModel(data);
  },

  async create(input) {
    return apiProductService.createProduct(input);
  },

  async createProduct(input) {
    const { data } = await apiClient.post<ProductDto>('/api/products/', toMutationPayload(input));
    return mapProductDtoToModel(data);
  },

  async update(id, input) {
    return apiProductService.updateProduct(id, input);
  },

  async updateProduct(id, input) {
    const { data } = await apiClient.patch<ProductDto>(`/api/products/${id}/`, toMutationPayload(input));
    return mapProductDtoToModel(data);
  },

  async patch(id, input) {
    return apiProductService.patchProduct(id, input);
  },

  async patchProduct(id, input) {
    const { data } = await apiClient.patch<ProductDto>(`/api/products/${id}/`, toMutationPayload(input));
    return mapProductDtoToModel(data);
  },

  async delete(id) {
    return apiProductService.deleteProduct(id);
  },

  async deleteProduct(id: EntityId) {
    await apiClient.delete(`/api/products/${id}/`);
    return true;
  },

  async listProductCategories(params?: ProductCategoryListParams) {
    const { data } = await apiClient.get<unknown>('/api/products/categories/', {
      params: {
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? params?.page_size,
        search: params?.search,
        ordering: params?.ordering,
      },
    });

    const items = mapProductCategoryListDtoToItems(data);
    const payload =
      data && typeof data === 'object' && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : null;
    const totalItemsHint = readNumber(payload?.count);

    return toPaginatedResult(items, params, totalItemsHint);
  },

  async getProductCategoryById(id) {
    const { data } = await apiClient.get<ProductCategoryDto>(`/api/products/categories/${id}/`);
    return mapProductCategoryDtoToModel(data);
  },

  async createProductCategory(input) {
    const { data } = await apiClient.post<ProductCategoryDto>(
      '/api/products/categories/',
      toCategoryMutationPayload(input),
    );
    return mapProductCategoryDtoToModel(data);
  },

  async updateProductCategory(id, input) {
    const { data } = await apiClient.patch<ProductCategoryDto>(
      `/api/products/categories/${id}/`,
      toCategoryMutationPayload(input),
    );
    return mapProductCategoryDtoToModel(data);
  },

  async patchProductCategory(id, input) {
    const { data } = await apiClient.patch<ProductCategoryDto>(
      `/api/products/categories/${id}/`,
      toCategoryMutationPayload(input),
    );
    return mapProductCategoryDtoToModel(data);
  },

  async deleteProductCategory(id: EntityId) {
    await apiClient.delete(`/api/products/categories/${id}/`);
    return true;
  },

  async listProductImages(productId, params) {
    let data: unknown;

    try {
      const response = await apiClient.get<unknown>(`/api/products/${productId}/images/`, {
        params: {
          page: params?.page,
          page_size: params?.pageSize ?? params?.page_size,
          search: params?.search,
          ordering:
            params?.ordering ??
            (params?.sortBy
              ? `${params?.sortDirection === 'desc' ? '-' : ''}${params.sortBy}`
              : undefined),
        },
      });
      data = response.data;
    } catch (error) {
      if (!shouldTryAlternativeImageEndpoint(error)) {
        throw error;
      }

      const response = await apiClient.get<unknown>('/api/products/images/', {
        params: {
          page: params?.page,
          page_size: params?.pageSize ?? params?.page_size,
          search: params?.search,
          product: productId,
          ordering:
            params?.ordering ??
            (params?.sortBy
              ? `${params?.sortDirection === 'desc' ? '-' : ''}${params.sortBy}`
              : undefined),
        },
      });
      data = response.data;
    }

    if (Array.isArray(data)) {
      return data
        .map((item) => toRecord(item))
        .filter((item): item is ProductImageDto => item !== null)
        .map((item, index) => mapProductImageDtoToModel(item, index));
    }

    const payload = toRecord(data);
    const results = Array.isArray(payload?.results) ? payload.results : [];
    return results
      .map((item) => toRecord(item))
      .filter((item): item is ProductImageDto => item !== null)
      .map((item, index) => mapProductImageDtoToModel(item, index));
  },

  async createProductImage(
    productId,
    input: { image: File; altText?: string; isPrimary?: boolean },
  ) {
    const scopedFormData = new FormData();
    scopedFormData.append('image', input.image);
    if (input.altText) {
      scopedFormData.append('alt_text', input.altText);
    }
    if (input.isPrimary !== undefined) {
      scopedFormData.append('is_primary', String(input.isPrimary));
    }

    try {
      const { data } = await apiClient.post<ProductImageDto>(`/api/products/${productId}/images/`, scopedFormData);
      return mapProductImageDtoToModel(data);
    } catch (error) {
      if (!shouldTryAlternativeImageEndpoint(error)) {
        throw error;
      }

      const fallbackFormData = new FormData();
      fallbackFormData.append('product', String(productId));
      fallbackFormData.append('image', input.image);
      if (input.altText) {
        fallbackFormData.append('alt_text', input.altText);
      }
      if (input.isPrimary !== undefined) {
        fallbackFormData.append('is_primary', String(input.isPrimary));
      }

      const { data } = await apiClient.post<ProductImageDto>('/api/products/images/', fallbackFormData);
      return mapProductImageDtoToModel(data);
    }
  },

  async uploadProductImages(productId, payload) {
    if (payload instanceof FormData) {
      try {
        await apiClient.post(`/api/products/${productId}/images/`, payload);
      } catch (error) {
        if (!shouldTryAlternativeImageEndpoint(error)) {
          throw error;
        }

        await apiClient.post('/api/products/images/', payload);
      }
      return apiProductService.getProductById(productId);
    }

    for (const file of payload) {
      const scopedFormData = new FormData();
      scopedFormData.append('image', file);
      try {
        await apiClient.post(`/api/products/${productId}/images/`, scopedFormData);
      } catch (error) {
        if (!shouldTryAlternativeImageEndpoint(error)) {
          throw error;
        }

        const fallbackFormData = new FormData();
        fallbackFormData.append('product', String(productId));
        fallbackFormData.append('image', file);
        await apiClient.post('/api/products/images/', fallbackFormData);
      }
    }

    return apiProductService.getProductById(productId);
  },

  async deleteProductImage(productId, imageId) {
    try {
      await apiClient.delete(`/api/products/${productId}/images/${imageId}/`);
    } catch (error) {
      if (!shouldTryAlternativeImageEndpoint(error)) {
        throw error;
      }

      await apiClient.delete(`/api/products/images/${imageId}/`);
    }
    return true;
  },
};
