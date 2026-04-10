import { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import {
  DataTable,
  FilterBar,
  FilterSelect,
  Pagination,
  SearchInput,
  StatusBadge,
  type DataTableColumn,
} from '../../../components/shared/data';
import AppIcon from '../../../components/shared/icons/AppIcon';
import {
  EmptyState,
  LoadingState,
  PageCard,
  PageHeader,
  PageLayout,
  PageSection,
} from '../../../components/shared/page';
import ProductCategoryDeleteDialog from '../../../features/products/components/ProductCategoryDeleteDialog';
import ProductCategoryDetailPanel from '../../../features/products/components/ProductCategoryDetailPanel';
import ProductCategoryFormDialog from '../../../features/products/components/ProductCategoryFormDialog';
import ProductDeleteDialog from '../../../features/products/components/ProductDeleteDialog';
import ProductDetailPanel from '../../../features/products/components/ProductDetailPanel';
import ProductFormPanel from '../../../features/products/components/ProductFormPanel';
import { formatLocalizedDate } from '../../../i18n/date-format';
import { usePersistentState } from '../../../lib/persistent-state';
import { services } from '../../../services';
import type {
  PaginationMeta,
  Product,
  ProductCategory,
  ProductMutationInput,
  SelectOption,
  TableQueryParams,
} from '../../../types/domain';

type ActiveFilter = 'all' | 'active' | 'inactive';
type ProductOrdering = '-created_at' | 'created_at' | 'name' | '-name' | 'price' | '-price';
type CatalogView = 'products' | 'categories' | 'promoted';

const PAGE_SIZE = 10;
const CATEGORY_FETCH_SIZE = 500;
const PROMOTED_FETCH_SIZE = 500;
const DEFAULT_ORDERING: ProductOrdering = '-created_at';

const DEFAULT_PAGINATION_META: PaginationMeta = {
  page: 1,
  pageSize: PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
};

const tablePrimaryTextClassName =
  'block max-w-[140px] truncate text-sm font-semibold leading-[1.35] text-text-primary min-[640px]:max-w-[220px]';

const tableSecondaryTextClassName =
  'block max-w-[140px] truncate text-[12px] leading-[1.45] text-text-secondary min-[640px]:max-w-[220px]';

const labelClassName =
  'text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted';

const actionButtonClassName =
  'inline-flex h-8 w-8 items-center justify-center rounded-md bg-surface-card text-text-secondary shadow-sm ring-1 ring-border-soft/40 transition duration-fast hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20';

function parseOrdering(ordering: ProductOrdering): Pick<TableQueryParams, 'sortBy' | 'sortDirection'> {
  const direction = ordering.startsWith('-') ? 'desc' : 'asc';
  const sortBy = ordering.replace('-', '');

  return {
    sortBy,
    sortDirection: direction,
  };
}

function ProductsPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ru' ? 'ru-RU' : 'uz-UZ';
  const [search, setSearch] = usePersistentState('products:search', '');
  const [catalogView, setCatalogView] = usePersistentState<CatalogView>(
    'products:catalog-view',
    'products',
    {
      deserialize: (value) => {
        const parsed = JSON.parse(value);
        return parsed === 'categories' || parsed === 'promoted' ? parsed : 'products';
      },
    },
  );
  const isCategoriesView = catalogView === 'categories';

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [ordering, setOrdering] = useState<ProductOrdering>(DEFAULT_ORDERING);
  const [currentPage, setCurrentPage] = useState(1);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>(DEFAULT_PAGINATION_META);
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [isCategoryOptionsLoading, setIsCategoryOptionsLoading] = useState(true);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [reloadCursor, setReloadCursor] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryFormMode, setCategoryFormMode] = useState<'create' | 'edit'>('create');
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [isCategorySaving, setIsCategorySaving] = useState(false);
  const [categoryFormErrorMessage, setCategoryFormErrorMessage] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<ProductCategory | null>(null);
  const [isCategoryDeleting, setIsCategoryDeleting] = useState(false);

  const orderingOptions = useMemo<SelectOption[]>(
    () => [
      { value: '-created_at', label: t('products.createdNewest') },
      { value: 'created_at', label: t('products.createdOldest') },
      { value: 'name', label: t('products.nameAz') },
      { value: '-name', label: t('products.nameZa') },
      { value: '-price', label: t('products.priceHighLow') },
      { value: 'price', label: t('products.priceLowHigh') },
    ],
    [t],
  );

  const activeFilterOptions = useMemo<SelectOption[]>(
    () => [
      { value: 'all', label: t('products.allStatuses') },
      { value: 'active', label: t('common.active') },
      { value: 'inactive', label: t('common.inactive') },
    ],
    [t],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, activeFilter, ordering, catalogView]);

  useEffect(() => {
    if (catalogView === 'categories') {
      setSelectedProductId(null);
    } else {
      setSelectedCategoryId(null);
    }
  }, [catalogView]);

  useEffect(() => {
    let isActive = true;

    async function loadCategoryOptions() {
      setIsCategoryOptionsLoading(true);

      try {
        const result = await services.products.listProductCategories({
          page: 1,
          pageSize: CATEGORY_FETCH_SIZE,
          ordering: 'name',
        });

        if (!isActive) {
          return;
        }

        const options = result.items
          .map((category: ProductCategory): SelectOption => ({
            value: category.id,
            label: category.name,
            description: category.code,
          }))
          .sort((left: SelectOption, right: SelectOption) => left.label.localeCompare(right.label));

        setCategories(result.items);
        setCategoryOptions(options);
      } catch {
        if (!isActive) {
          return;
        }

        setCategories([]);
        setCategoryOptions([]);
      } finally {
        if (isActive) {
          setIsCategoryOptionsLoading(false);
        }
      }
    }

    void loadCategoryOptions();

    return () => {
      isActive = false;
    };
  }, [reloadCursor]);

  useEffect(() => {
    let isActive = true;

    async function loadProducts() {
      if (isCategoriesView) {
        setIsLoading(false);
        setHasLoadedOnce(true);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      try {
        const sortConfig = parseOrdering(ordering);
        const isPromotedView = catalogView === 'promoted';
        const result = await services.products.listProducts({
          page: isPromotedView ? 1 : currentPage,
          pageSize: isPromotedView ? PROMOTED_FETCH_SIZE : PAGE_SIZE,
          search: search.trim() || undefined,
          category: categoryFilter === 'all' ? undefined : categoryFilter,
          isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
          isPromoted: isPromotedView ? true : undefined,
          ordering,
          ...sortConfig,
        });

        if (!isActive) {
          return;
        }

        if (isPromotedView) {
          const promotedOnly = result.items.filter((item: Product) => item.isPromoted);
          const totalItems = promotedOnly.length;
          const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
          const page = Math.min(currentPage, totalPages);
          const start = (page - 1) * PAGE_SIZE;
          const pageItems = promotedOnly.slice(start, start + PAGE_SIZE);

          if (currentPage > totalPages) {
            setCurrentPage(totalPages);
            return;
          }

          setProducts(pageItems);
          setPaginationMeta({
            page,
            pageSize: PAGE_SIZE,
            totalItems,
            totalPages,
          });
          return;
        }

        if (currentPage > result.meta.totalPages) {
          setCurrentPage(result.meta.totalPages);
          return;
        }

        setProducts(result.items);
        setPaginationMeta(result.meta);
      } catch {
        if (!isActive) {
          return;
        }

        setHasError(true);
        setProducts([]);
        setPaginationMeta(DEFAULT_PAGINATION_META);
      } finally {
        if (isActive) {
          setHasLoadedOnce(true);
          setIsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isActive = false;
    };
  }, [activeFilter, categoryFilter, currentPage, isCategoriesView, ordering, reloadCursor, search, catalogView]);

  function openCreateForm() {
    setFormMode('create');
    setEditingProduct(null);
    setFormErrorMessage(null);
    setIsFormOpen(true);
  }

  function openEditForm(product: Product) {
    setFormMode('edit');
    setEditingProduct(product);
    setFormErrorMessage(null);
    setIsFormOpen(true);
  }

  function requestDelete(product: Product) {
    setProductToDelete(product);
  }

  async function handleSaveProduct(payload: ProductMutationInput) {
    setIsSaving(true);
    setFormErrorMessage(null);

    try {
      if (formMode === 'create') {
        await services.products.createProduct(payload);
        setCurrentPage(1);
      } else {
        const editingId = editingProduct?.id;
        if (!editingId) {
          throw new Error(t('products.form.saveError'));
        }

        await services.products.patchProduct(editingId, payload);
      }

      setIsFormOpen(false);
      setEditingProduct(null);
      setReloadCursor((current) => current + 1);
    } catch (error) {
      setFormErrorMessage(error instanceof Error ? error.message : t('products.form.saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!productToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await services.products.deleteProduct(productToDelete.id);
      if (selectedProductId === productToDelete.id) {
        setSelectedProductId(null);
      }
      setProductToDelete(null);
      setReloadCursor((current) => current + 1);
    } finally {
      setIsDeleting(false);
    }
  }

  function openCreateCategoryForm() {
    setCategoryFormMode('create');
    setEditingCategory(null);
    setCategoryFormErrorMessage(null);
    setIsCategoryFormOpen(true);
  }

  function openEditCategoryForm(category: ProductCategory) {
    setCategoryFormMode('edit');
    setEditingCategory(category);
    setCategoryFormErrorMessage(null);
    setSelectedCategoryId(null);
    setIsCategoryFormOpen(true);
  }

  async function handleSaveCategory(payload: { name: string; code: string }) {
    setIsCategorySaving(true);
    setCategoryFormErrorMessage(null);

    try {
      if (categoryFormMode === 'create') {
        await services.products.createProductCategory(payload);
      } else if (editingCategory?.id) {
        await services.products.patchProductCategory(editingCategory.id, payload);
      }

      setIsCategoryFormOpen(false);
      setEditingCategory(null);
      setReloadCursor((current) => current + 1);
    } catch {
      setCategoryFormErrorMessage(t('products.categoryForm.saveError'));
    } finally {
      setIsCategorySaving(false);
    }
  }

  async function handleConfirmDeleteCategory() {
    if (!categoryToDelete) {
      return;
    }

    setIsCategoryDeleting(true);
    try {
      await services.products.deleteProductCategory(categoryToDelete.id);
      setCategoryToDelete(null);
      setReloadCursor((current) => current + 1);
    } finally {
      setIsCategoryDeleting(false);
    }
  }

  const productColumns = useMemo<DataTableColumn<Product>[]>(() => {
    return [
      {
        key: 'name',
        label: t('products.columns.product'),
        render: (product) => (
          <div className="flex items-center gap-3">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-9 w-9 rounded-full object-cover ring-1 ring-border-soft/50"
                loading="lazy"
              />
            ) : (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-subtle text-xs font-semibold text-text-secondary ring-1 ring-border-soft/50">
                -
              </span>
            )}
            <div className="min-w-0 grid gap-0.5">
              <span className={tablePrimaryTextClassName}>{product.name}</span>
              <span className={tableSecondaryTextClassName}>
                {product.description || t('products.noDescription')}
              </span>
              {product.isPromoted ? (
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                  {t('products.promotedBadge')}
                </span>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        key: 'category',
        label: t('products.form.category'),
        render: (product) => (
          <span className={tablePrimaryTextClassName}>{product.categoryName || product.category?.name || '-'}</span>
        ),
      },
      {
        key: 'price',
        label: t('products.columns.price'),
        render: (product) => (
          <span className={tablePrimaryTextClassName}>{product.price}</span>
        ),
      },
      {
        key: 'stock',
        label: t('products.columns.stock'),
        render: (product) => (
          <span className={tablePrimaryTextClassName}>{product.stockQuantity ?? 0}</span>
        ),
      },
      {
        key: 'status',
        label: t('products.columns.status'),
        render: (product) => (
          <StatusBadge
            status={product.isActive ? 'active' : 'inactive'}
            tone={product.isActive ? 'success' : 'neutral'}
            label={product.isActive ? t('common.active') : t('common.inactive')}
          />
        ),
      },
      {
        key: 'updatedAt',
        label: t('products.columns.updated'),
        render: (product) => (
          <span className={tablePrimaryTextClassName}>
            {formatLocalizedDate(product.updatedAt, locale, {
              locale,
              withYear: true,
              shortMonth: true,
              fallback: '-',
            })}
          </span>
        ),
      },
      {
        key: 'actions',
        label: t('products.columns.actions'),
        align: 'right',
        render: (product) => (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={actionButtonClassName}
              onClick={(event) => {
                event.stopPropagation();
                openEditForm(product);
              }}
              aria-label={t('products.actions.edit')}
            >
              <FiEdit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={actionButtonClassName}
              onClick={(event) => {
                event.stopPropagation();
                requestDelete(product);
              }}
              aria-label={t('products.actions.delete')}
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ];
  }, [locale, t]);

  const categoryColumns = useMemo<DataTableColumn<ProductCategory>[]>(() => {
    return [
      {
        key: 'name',
        label: t('products.categoryColumns.name'),
        render: (category) => (
          <div className="flex items-center">
            <span className={tablePrimaryTextClassName}>{category.name}</span>
          </div>
        ),
      },
      {
        key: 'code',
        label: t('products.categoryColumns.code'),
        render: (category) => <span className={tablePrimaryTextClassName}>{category.code || '-'}</span>,
      },
      {
        key: 'updatedAt',
        label: t('products.categoryColumns.updated'),
        render: (category) => (
          <span className={tablePrimaryTextClassName}>
            {formatLocalizedDate(category.updatedAt, locale, {
              locale,
              withYear: true,
              shortMonth: true,
              fallback: '-',
            })}
          </span>
        ),
      },
      {
        key: 'actions',
        label: t('products.categoryColumns.actions'),
        align: 'right',
        render: (category) => (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={actionButtonClassName}
              onClick={(event) => {
                event.stopPropagation();
                openEditCategoryForm(category);
              }}
              aria-label={t('products.categoryActions.edit')}
            >
              <FiEdit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={actionButtonClassName}
              onClick={(event) => {
                event.stopPropagation();
                setCategoryToDelete(category);
              }}
              aria-label={t('products.categoryActions.delete')}
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ];
  }, [locale, t]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return [...categories].sort((left, right) => left.name.localeCompare(right.name, locale));
    }

    return [...categories]
      .filter((category) => {
        return (
          category.name.toLowerCase().includes(query) ||
          category.code.toLowerCase().includes(query)
        );
      })
      .sort((left, right) => left.name.localeCompare(right.name, locale));
  }, [categories, locale, search]);

  const categoryMeta = useMemo(() => {
    const totalItems = filteredCategories.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    const page = Math.min(currentPage, totalPages);
    return { page, totalItems, totalPages };
  }, [currentPage, filteredCategories.length]);

  const pagedCategories = useMemo(() => {
    const start = (categoryMeta.page - 1) * PAGE_SIZE;
    return filteredCategories.slice(start, start + PAGE_SIZE);
  }, [categoryMeta.page, filteredCategories]);

  const visibleItemsCount = isCategoriesView ? pagedCategories.length : products.length;
  const totalItemsCount = isCategoriesView ? categoryMeta.totalItems : paginationMeta.totalItems;

  const header = (
    <PageHeader
      eyebrow={t('products.title')}
      title={t('products.title')}
      subtitle={t('products.subtitle')}
      actions={
        <div className="flex w-full flex-wrap items-center gap-2 min-[768px]:w-auto">
          <button
            type="button"
            className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition duration-fast hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            onClick={isCategoriesView ? openCreateCategoryForm : openCreateForm}
          >
            <AppIcon name="plus" className="h-4 w-4" aria-hidden="true" />
            {isCategoriesView ? t('products.newCategory') : t('products.newProduct')}
          </button>
          <span className="inline-flex min-h-8 items-center gap-2 rounded-pill bg-primary/12 px-3 text-[12px] font-semibold text-text-accent">
            <AppIcon name="products" className="h-3.5 w-3.5" aria-hidden="true" />
            {visibleItemsCount} / {totalItemsCount} {isCategoriesView ? t('products.categoriesRecords') : t('products.records')}
          </span>
        </div>
      }
    />
  );

  if (!hasLoadedOnce && isLoading) {
    return (
      <PageLayout header={header}>
        <PageSection>
          <PageCard>
            <LoadingState title={t('products.loadingTitle')} description={t('products.loadingDescription')} />
          </PageCard>
        </PageSection>
      </PageLayout>
    );
  }

  if (hasError) {
    return (
      <PageLayout header={header}>
        <PageSection>
          <PageCard>
            <EmptyState
              title={t('products.errorTitle')}
              description={t('products.errorDescription')}
            />
          </PageCard>
        </PageSection>
      </PageLayout>
    );
  }

  return (
    <PageLayout header={header}>
      <PageSection>
        <FilterBar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={isCategoriesView ? t('products.categorySearchPlaceholder') : t('products.searchPlaceholder')}
          />

          {!isCategoriesView ? (
            <label className="grid min-w-[min(180px,100%)] flex-[1_1_180px] gap-1.5 min-[640px]:flex-[0_1_200px]">
              <span className={labelClassName}>{t('products.form.category')}</span>
              <FilterSelect
                value={categoryFilter}
                options={[{ value: 'all', label: t('common.all') }, ...categoryOptions]}
                onChange={setCategoryFilter}
                disabled={isLoading || isCategoryOptionsLoading}
              />
            </label>
          ) : null}

          {!isCategoriesView ? (
            <label className="grid min-w-[min(180px,100%)] flex-[1_1_180px] gap-1.5 min-[640px]:flex-[0_1_180px]">
              <span className={labelClassName}>{t('products.status')}</span>
              <FilterSelect
                value={activeFilter}
                options={activeFilterOptions}
                onChange={(value) => setActiveFilter(value as ActiveFilter)}
                disabled={isLoading}
              />
            </label>
          ) : null}

          {!isCategoriesView ? (
            <label className="grid min-w-[min(220px,100%)] flex-[1_1_220px] gap-1.5 min-[640px]:flex-[0_1_240px]">
              <span className={labelClassName}>{t('products.orderBy')}</span>
              <FilterSelect
                value={ordering}
                options={orderingOptions}
                onChange={(value) => setOrdering(value as ProductOrdering)}
                disabled={isLoading}
              />
            </label>
          ) : null}
        </FilterBar>

        <PageCard>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 max-w-full overflow-x-auto">
              <div className="inline-flex min-w-max flex-nowrap items-center gap-1 rounded-pill bg-surface-subtle/85 p-1 ring-1 ring-border-soft/50">
              {[
                { id: 'products' as const, label: t('products.catalogTitle') },
                { id: 'categories' as const, label: t('products.categoriesCatalogTitle') },
                { id: 'promoted' as const, label: t('products.promotedCatalogTitle') },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCatalogView(tab.id)}
                  className={[
                    'shrink-0 whitespace-nowrap rounded-pill px-4 py-2 text-sm font-semibold transition duration-fast',
                    catalogView === tab.id
                      ? 'bg-background-subtle text-text-primary shadow-sm ring-1 ring-border-soft/55'
                      : 'text-text-secondary hover:bg-background-subtle/65 hover:text-text-primary',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              ))}
              </div>
            </div>
            <span className="text-sm text-text-secondary">{t('products.catalogHint')}</span>
          </div>

          {isCategoriesView ? (
            <DataTable
              data={pagedCategories}
              columns={categoryColumns}
              rowKey="id"
              selectedRowKey={selectedCategoryId}
              loading={isCategoryOptionsLoading}
              onRowClick={(category) => setSelectedCategoryId(category.id)}
              emptyTitle={t('products.categoriesEmptyTitle')}
              emptyDescription={t('products.categoriesEmptyDescription')}
            />
          ) : (
            <DataTable
              data={products}
              columns={productColumns}
              rowKey="id"
              selectedRowKey={selectedProductId}
              loading={isLoading}
              onRowClick={(product) => setSelectedProductId(product.id)}
              emptyTitle={catalogView === 'promoted' ? t('products.emptyTitle') : t('products.emptyTitle')}
              emptyDescription={t('products.emptyDescription')}
            />
          )}
        </PageCard>

        {isCategoriesView ? (
          !isCategoryOptionsLoading && categoryMeta.totalItems > 0 ? (
            <Pagination
              currentPage={categoryMeta.page}
              totalPages={categoryMeta.totalPages}
              totalItems={categoryMeta.totalItems}
              onPageChange={setCurrentPage}
            />
          ) : null
        ) : !isLoading && paginationMeta.totalItems > 0 ? (
          <Pagination
            currentPage={Math.min(currentPage, paginationMeta.totalPages)}
            totalPages={paginationMeta.totalPages}
            totalItems={paginationMeta.totalItems}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </PageSection>

      {!isCategoriesView && selectedProductId ? (
        <ProductDetailPanel
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
          onProductChanged={() => setReloadCursor((current) => current + 1)}
          onEdit={(product) => {
            openEditForm(product);
            setSelectedProductId(null);
          }}
          onDelete={(product) => {
            requestDelete(product);
            setSelectedProductId(null);
          }}
        />
      ) : null}

      {isCategoriesView && selectedCategoryId ? (
        <ProductCategoryDetailPanel
          categoryId={selectedCategoryId}
          onClose={() => setSelectedCategoryId(null)}
          onEdit={(category) => {
            openEditCategoryForm(category);
            setSelectedCategoryId(null);
          }}
          onDelete={(category) => {
            setCategoryToDelete(category);
            setSelectedCategoryId(null);
          }}
        />
      ) : null}

      {isFormOpen ? (
        <ProductFormPanel
          mode={formMode}
          product={editingProduct}
          categoryOptions={categoryOptions}
          isCategoryOptionsLoading={isCategoryOptionsLoading}
          isSubmitting={isSaving}
          errorMessage={formErrorMessage}
          onClose={() => {
            if (!isSaving) {
              setIsFormOpen(false);
              setEditingProduct(null);
              setFormErrorMessage(null);
            }
          }}
          onSubmit={(payload) => {
            void handleSaveProduct(payload);
          }}
        />
      ) : null}

      {productToDelete ? (
        <ProductDeleteDialog
          product={productToDelete}
          isDeleting={isDeleting}
          onCancel={() => {
            if (!isDeleting) {
              setProductToDelete(null);
            }
          }}
          onConfirm={() => {
            void handleConfirmDelete();
          }}
        />
      ) : null}

      {isCategoryFormOpen ? (
        <ProductCategoryFormDialog
          mode={categoryFormMode}
          category={editingCategory}
          isSubmitting={isCategorySaving}
          errorMessage={categoryFormErrorMessage}
          onClose={() => {
            if (!isCategorySaving) {
              setIsCategoryFormOpen(false);
              setEditingCategory(null);
              setCategoryFormErrorMessage(null);
            }
          }}
          onSubmit={(payload) => {
            void handleSaveCategory(payload);
          }}
        />
      ) : null}

      {categoryToDelete ? (
        <ProductCategoryDeleteDialog
          category={categoryToDelete}
          isDeleting={isCategoryDeleting}
          onCancel={() => {
            if (!isCategoryDeleting) {
              setCategoryToDelete(null);
            }
          }}
          onConfirm={() => {
            void handleConfirmDeleteCategory();
          }}
        />
      ) : null}
    </PageLayout>
  );
}

export default ProductsPage;
