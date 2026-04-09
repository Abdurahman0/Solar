import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/shared/icons/AppIcon';
import { FilterSelect, Switch } from '../../../components/shared/data';
import type { Product, ProductMutationInput, SelectOption } from '../../../types/domain';

interface ProductFormPanelProps {
  mode: 'create' | 'edit';
  product?: Product | null;
  categoryOptions: SelectOption[];
  isCategoryOptionsLoading?: boolean;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (payload: ProductMutationInput) => void;
}

interface ProductFormState {
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
  minimalStock: string;
  isActive: boolean;
  categoryId: string;
}

const inputClassName = [
  'w-full rounded-lg border border-border-soft/60 bg-surface-card px-3.5 py-2.5 text-sm font-medium text-text-primary',
  'placeholder:text-text-muted outline-none transition duration-fast',
  'focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
  'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ');

const labelClassName =
  'text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted';

function createInitialState(
  mode: 'create' | 'edit',
  product: Product | null | undefined,
): ProductFormState {
  if (mode === 'edit' && product) {
    return {
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      stockQuantity: String(product.stockQuantity ?? 0),
      minimalStock: String(product.minimalStock ?? 0),
      isActive: product.isActive,
      categoryId: product.categoryId ?? '',
    };
  }

  return {
    name: '',
    description: '',
    price: '',
    stockQuantity: '0',
    minimalStock: '0',
    isActive: true,
    categoryId: '',
  };
}

function ProductFormPanel({
  mode,
  product,
  categoryOptions,
  isCategoryOptionsLoading = false,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: ProductFormPanelProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ProductFormState>(() =>
    createInitialState(mode, product),
  );
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    setForm(createInitialState(mode, product));
    setFieldError(null);
  }, [mode, product]);

  const categorySelectOptions = useMemo<SelectOption[]>(
    () => [{ value: '', label: t('shared.filterSelect.select') }, ...categoryOptions],
    [categoryOptions, t],
  );

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      form.description.trim().length > 0 &&
      form.categoryId.trim().length > 0 &&
      Number(form.price) >= 0 &&
      Number(form.stockQuantity) >= 0 &&
      Number(form.minimalStock) >= 0
    );
  }, [form]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);

    const normalizedName = form.name.trim();
    const normalizedDescription = form.description.trim();
    const normalizedCategoryId = form.categoryId.trim();
    const parsedPrice = Number(form.price);
    const parsedStock = Number(form.stockQuantity);
    const parsedMinimalStock = Number(form.minimalStock);

    if (!normalizedName || !normalizedDescription || !normalizedCategoryId) {
      setFieldError(t('products.form.requiredError'));
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setFieldError(t('products.form.priceError'));
      return;
    }

    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      setFieldError(t('products.form.stockError'));
      return;
    }

    if (!Number.isFinite(parsedMinimalStock) || parsedMinimalStock < 0) {
      setFieldError(t('products.form.stockError'));
      return;
    }

    onSubmit({
      name: normalizedName,
      description: normalizedDescription,
      categoryId: normalizedCategoryId,
      price: parsedPrice,
      stockQuantity: Math.floor(parsedStock),
      minimalStock: Math.floor(parsedMinimalStock),
      isActive: form.isActive,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-background-overlay/72 backdrop-blur-[3px]"
      onClick={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
      role="presentation"
    >
      <aside
        className="h-full w-full overflow-y-auto bg-background-subtle p-4 shadow-xl ring-1 ring-border-soft/50 min-[641px]:max-w-[520px] min-[641px]:p-5"
        onClick={(event) => event.stopPropagation()}
        aria-label={mode === 'create' ? t('products.form.createTitle') : t('products.form.editTitle')}
      >
        <header className="mb-4 rounded-xl bg-surface-card p-4 shadow-sm ring-1 ring-border-soft/40">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                {t('products.form.eyebrow')}
              </p>
              <h2 className="mt-1 font-display text-[1.45rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-text-primary">
                {mode === 'create' ? t('products.form.createTitle') : t('products.form.editTitle')}
              </h2>
            </div>

            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-primary shadow-sm transition duration-fast hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-60"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label={t('products.form.close')}
            >
              <AppIcon name="close" className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <form className="grid gap-3" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-1.5">
            <label className={labelClassName} htmlFor="product-form-name">{t('products.form.name')}</label>
            <input
              id="product-form-name"
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className={inputClassName}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <label className={labelClassName} htmlFor="product-form-description">{t('products.form.description')}</label>
            <textarea
              id="product-form-description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className={`${inputClassName} min-h-[110px] resize-y`}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <label className={labelClassName} htmlFor="product-form-price">{t('products.form.price')}</label>
              <input
                id="product-form-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                className={inputClassName}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid gap-1.5">
              <label className={labelClassName} htmlFor="product-form-stock">{t('products.form.stockQuantity')}</label>
              <input
                id="product-form-stock"
                type="number"
                min="0"
                step="1"
                value={form.stockQuantity}
                onChange={(event) => setForm((current) => ({ ...current, stockQuantity: event.target.value }))}
                className={inputClassName}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid gap-1.5">
              <label className={labelClassName} htmlFor="product-form-minimal-stock">{t('products.columns.stock')}</label>
              <input
                id="product-form-minimal-stock"
                type="number"
                min="0"
                step="1"
                value={form.minimalStock}
                onChange={(event) => setForm((current) => ({ ...current, minimalStock: event.target.value }))}
                className={inputClassName}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className={labelClassName}>{t('products.form.category')}</label>
            <FilterSelect
              value={form.categoryId}
              options={categorySelectOptions}
              onChange={(value) => setForm((current) => ({ ...current, categoryId: value }))}
              disabled={isSubmitting || isCategoryOptionsLoading}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-card px-4 py-4 ring-1 ring-border-soft/35">
            <div className="grid gap-0.5">
              <p className="m-0 text-sm font-semibold text-text-primary">{t('products.form.activeProduct')}</p>
              <p className="m-0 text-[12px] text-text-secondary">{t('products.form.activeProductHint')}</p>
            </div>
            <Switch
              checked={form.isActive}
              onChange={(nextValue) => setForm((current) => ({ ...current, isActive: nextValue }))}
              disabled={isSubmitting}
            />
          </div>

          {fieldError ? (
            <p className="m-0 rounded-lg bg-danger-bg px-3 py-2 text-sm font-medium text-danger">{fieldError}</p>
          ) : null}

          {errorMessage ? (
            <p className="m-0 rounded-lg bg-danger-bg px-3 py-2 text-sm font-medium text-danger">{errorMessage}</p>
          ) : null}

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-surface-card px-4 text-sm font-semibold text-text-secondary shadow-sm ring-1 ring-border-soft/40 transition duration-fast hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="ml-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition duration-fast hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting
                ? mode === 'create'
                  ? t('products.form.creating')
                  : t('products.form.saving')
                : mode === 'create'
                  ? t('products.form.createSubmit')
                  : t('products.form.editSubmit')}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export default ProductFormPanel;
