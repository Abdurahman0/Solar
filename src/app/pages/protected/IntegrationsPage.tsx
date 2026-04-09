import { useEffect, useMemo, useState } from 'react';
import { FaInstagram, FaTelegramPlane } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import {
  DataTable,
  FilterBar,
  FilterSelect,
  Pagination,
  SearchInput,
  StatusBadge,
  Switch,
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
import { useAuth } from '../../../auth';
import { formatLocalizedDate } from '../../../i18n/date-format';
import {
  getIntegrationProviderClassName,
  getIntegrationProviderLabel,
  maskSecretValue,
} from '../../../features/integrations/utils/integration-format';
import { usePersistentState } from '../../../lib/persistent-state';
import { services } from '../../../services';
import type {
  IntegrationConfig,
  IntegrationConfigListParams,
  IntegrationProvider,
  PaginationMeta,
  SelectOption,
} from '../../../types/domain';

type ProviderFilter = 'all' | IntegrationProvider;
type ActiveFilter = 'all' | 'active' | 'inactive';
type SecretFilter = 'all' | 'secret' | 'public';
type ConfigOrdering =
  | '-updated_at'
  | 'updated_at'
  | '-created_at'
  | 'created_at'
  | 'provider'
  | '-provider'
  | 'key'
  | '-key';

const PAGE_SIZE = 8;
const DEFAULT_ORDERING: ConfigOrdering = '-updated_at';

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

function ProviderIcon({ provider }: { provider: IntegrationProvider }) {
  if (provider === 'telegram') {
    return <FaTelegramPlane className="h-3.5 w-3.5" aria-hidden="true" />;
  }

  if (provider === 'instagram') {
    return <FaInstagram className="h-3.5 w-3.5" aria-hidden="true" />;
  }

  return <AppIcon name="sparkles" className="h-3.5 w-3.5" aria-hidden="true" />;
}

function parseConfigOrdering(ordering: ConfigOrdering): Pick<
  IntegrationConfigListParams,
  'sortBy' | 'sortDirection'
> {
  return {
    sortBy: ordering.replace('-', ''),
    sortDirection: ordering.startsWith('-') ? 'desc' : 'asc',
  };
}

function toBooleanActiveFilter(value: ActiveFilter): boolean | undefined {
  if (value === 'active') return true;
  if (value === 'inactive') return false;
  return undefined;
}

function toBooleanSecretFilter(value: SecretFilter): boolean | undefined {
  if (value === 'secret') return true;
  if (value === 'public') return false;
  return undefined;
}

function IntegrationsPage() {
  const { t, i18n } = useTranslation();
  const { hasPermission, hasRole } = useAuth();
  const locale = i18n.language === 'ru' ? 'ru-RU' : 'uz-UZ';
  const canManageIntegrations = hasRole('developer') || hasPermission('can_manage_integrations');

  const [configSearch, setConfigSearch] = usePersistentState('integrations:config-search', '');
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>('all');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [secretFilter, setSecretFilter] = useState<SecretFilter>('all');
  const [ordering, setOrdering] = useState<ConfigOrdering>(DEFAULT_ORDERING);
  const [currentPage, setCurrentPage] = useState(1);
  const [configs, setConfigs] = useState<IntegrationConfig[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>(DEFAULT_PAGINATION_META);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [configSearch, providerFilter, activeFilter, secretFilter, ordering]);

  useEffect(() => {
    let isActive = true;

    async function loadConfigs() {
      setIsLoading(true);
      setHasError(false);

      try {
        const result = await services.integrations.listConfigs({
          page: currentPage,
          pageSize: PAGE_SIZE,
          search: configSearch.trim() || undefined,
          provider: providerFilter === 'all' ? undefined : providerFilter,
          is_active: toBooleanActiveFilter(activeFilter),
          is_secret: toBooleanSecretFilter(secretFilter),
          ordering,
          ...parseConfigOrdering(ordering),
        });

        if (!isActive) return;

        if (currentPage > result.meta.totalPages) {
          setCurrentPage(result.meta.totalPages);
          return;
        }

        setConfigs(result.items);
        setPaginationMeta(result.meta);
      } catch {
        if (!isActive) return;
        setHasError(true);
        setConfigs([]);
        setPaginationMeta(DEFAULT_PAGINATION_META);
      } finally {
        if (isActive) {
          setHasLoadedOnce(true);
          setIsLoading(false);
        }
      }
    }

    void loadConfigs();

    return () => {
      isActive = false;
    };
  }, [activeFilter, configSearch, currentPage, ordering, providerFilter, secretFilter]);

  async function handleToggleConfigActive(config: IntegrationConfig, nextIsActive: boolean) {
    if (!canManageIntegrations) {
      return;
    }

    try {
      const updated = await services.integrations.patchConfig(config.id, {
        is_active: nextIsActive,
      });

      if (!updated) {
        return;
      }

      setConfigs((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
    } catch {
      // No-op: keep current UI state.
    }
  }

  const providerOptions = useMemo<SelectOption[]>(
    () => [
      { value: 'all', label: t('integrations.filters.allProviders') },
      { value: 'telegram', label: t('integrations.providers.telegram') },
      { value: 'instagram', label: t('integrations.providers.instagram') },
      { value: 'openai', label: t('integrations.providers.openai') },
    ],
    [t],
  );

  const activeOptions = useMemo<SelectOption[]>(
    () => [
      { value: 'all', label: t('integrations.filters.allStatuses') },
      { value: 'active', label: t('common.active') },
      { value: 'inactive', label: t('common.inactive') },
    ],
    [t],
  );

  const secretOptions = useMemo<SelectOption[]>(
    () => [
      { value: 'all', label: t('integrations.filters.allTypes') },
      { value: 'secret', label: t('integrations.secret') },
      { value: 'public', label: t('integrations.public') },
    ],
    [t],
  );

  const orderingOptions = useMemo<SelectOption[]>(
    () => [
      { value: '-updated_at', label: t('integrations.ordering.updatedNewest') },
      { value: 'updated_at', label: t('integrations.ordering.updatedOldest') },
      { value: '-created_at', label: t('integrations.ordering.createdNewest') },
      { value: 'created_at', label: t('integrations.ordering.createdOldest') },
      { value: 'provider', label: t('integrations.ordering.providerAsc') },
      { value: '-provider', label: t('integrations.ordering.providerDesc') },
      { value: 'key', label: t('integrations.ordering.keyAsc') },
      { value: '-key', label: t('integrations.ordering.keyDesc') },
    ],
    [t],
  );

  const columns = useMemo<DataTableColumn<IntegrationConfig>[]>(() => {
    return [
      {
        key: 'provider',
        label: t('integrations.configColumns.provider'),
        render: (config) => (
          <span
            className={[
              'inline-flex min-h-7 items-center gap-1.5 rounded-pill px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em]',
              getIntegrationProviderClassName(config.provider),
            ].join(' ')}
          >
            <ProviderIcon provider={config.provider} />
            {getIntegrationProviderLabel(config.provider)}
          </span>
        ),
      },
      {
        key: 'key',
        label: t('integrations.configColumns.key'),
        render: (config) => (
          <div className="grid gap-0.5">
            <span className={tablePrimaryTextClassName}>{config.key}</span>
            <span className={tableSecondaryTextClassName}>{config.label}</span>
          </div>
        ),
      },
      {
        key: 'value',
        label: t('integrations.configColumns.value'),
        render: (config) => (
          <span className={tablePrimaryTextClassName}>
            {config.is_secret ? maskSecretValue(config.value) : config.value}
          </span>
        ),
      },
      {
        key: 'visibility',
        label: t('integrations.configColumns.visibility'),
        render: (config) => (
          <StatusBadge
            status={config.is_secret ? 'secret' : 'public'}
            tone={config.is_secret ? 'warning' : 'info'}
            label={config.is_secret ? t('integrations.secret') : t('integrations.public')}
          />
        ),
      },
      {
        key: 'active',
        label: t('integrations.configColumns.active'),
        render: (config) =>
          canManageIntegrations ? (
            <Switch
              checked={config.is_active}
              onChange={(nextValue) => {
                void handleToggleConfigActive(config, nextValue);
              }}
              stopPropagation
            />
          ) : (
            <StatusBadge
              status={config.is_active ? 'active' : 'inactive'}
              tone={config.is_active ? 'success' : 'neutral'}
              label={config.is_active ? t('common.active') : t('common.inactive')}
            />
          ),
      },
      {
        key: 'updatedAt',
        label: t('integrations.configColumns.updatedAt'),
        render: (config) => (
          <span className={tablePrimaryTextClassName}>
            {formatLocalizedDate(config.updated_at, i18n.language, {
              locale,
              withYear: true,
              shortMonth: true,
              fallback: t('common.na'),
            })}
          </span>
        ),
      },
    ];
  }, [canManageIntegrations, i18n.language, locale, t]);

  const header = (
    <PageHeader
      eyebrow={t('integrations.eyebrow')}
      title={t('integrations.title')}
      subtitle={t('integrations.subtitle')}
      actions={
        <span className="inline-flex min-h-8 items-center gap-2 rounded-pill bg-primary/12 px-3 text-[12px] font-semibold text-text-accent">
          <AppIcon name="integrations" className="h-3.5 w-3.5" aria-hidden="true" />
          {paginationMeta.totalItems} {t('integrations.configRecords')}
        </span>
      }
    />
  );

  if (!hasLoadedOnce && isLoading) {
    return (
      <PageLayout header={header}>
        <PageSection>
          <PageCard>
            <LoadingState
              title={t('integrations.loadingTitle')}
              description={t('integrations.loadingDescription')}
            />
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
              title={t('integrations.errorTitle')}
              description={t('integrations.errorDescription')}
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
            value={configSearch}
            onChange={setConfigSearch}
            placeholder={t('integrations.configSearchPlaceholder')}
          />
          <label className="grid min-w-[min(160px,100%)] flex-[1_1_160px] gap-1.5 min-[640px]:flex-[0_1_170px]">
            <span className={labelClassName}>{t('integrations.filters.provider')}</span>
            <FilterSelect
              value={providerFilter}
              options={providerOptions}
              onChange={(value) => setProviderFilter(value as ProviderFilter)}
              disabled={isLoading}
            />
          </label>
          <label className="grid min-w-[min(150px,100%)] flex-[1_1_150px] gap-1.5 min-[640px]:flex-[0_1_160px]">
            <span className={labelClassName}>{t('integrations.filters.status')}</span>
            <FilterSelect
              value={activeFilter}
              options={activeOptions}
              onChange={(value) => setActiveFilter(value as ActiveFilter)}
              disabled={isLoading}
            />
          </label>
          <label className="grid min-w-[min(150px,100%)] flex-[1_1_150px] gap-1.5 min-[640px]:flex-[0_1_160px]">
            <span className={labelClassName}>{t('integrations.filters.visibility')}</span>
            <FilterSelect
              value={secretFilter}
              options={secretOptions}
              onChange={(value) => setSecretFilter(value as SecretFilter)}
              disabled={isLoading}
            />
          </label>
          <label className="grid min-w-[min(220px,100%)] flex-[1_1_220px] gap-1.5 min-[640px]:flex-[0_1_240px]">
            <span className={labelClassName}>{t('integrations.filters.ordering')}</span>
            <FilterSelect
              value={ordering}
              options={orderingOptions}
              onChange={(value) => setOrdering(value as ConfigOrdering)}
              disabled={isLoading}
            />
          </label>
        </FilterBar>

        <PageCard>
          <DataTable
            data={configs}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            emptyTitle={t('integrations.configEmptyTitle')}
            emptyDescription={t('integrations.configEmptyDescription')}
          />
        </PageCard>

        {!isLoading && paginationMeta.totalItems > 0 ? (
          <Pagination
            currentPage={Math.min(currentPage, paginationMeta.totalPages)}
            totalPages={paginationMeta.totalPages}
            totalItems={paginationMeta.totalItems}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </PageSection>
    </PageLayout>
  );
}

export default IntegrationsPage;
