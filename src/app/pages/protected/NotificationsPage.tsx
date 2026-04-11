import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FilterBar,
  FilterSelect,
  Pagination,
  SearchInput,
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
import NotificationDetailPanel from '../../../features/notifications/components/NotificationDetailPanel';
import NotificationList from '../../../features/notifications/components/NotificationList';
import { getNotificationChannelLabel } from '../../../features/notifications/utils/notification-format';
import { usePersistentState } from '../../../lib/persistent-state';
import { services } from '../../../services';
import type {
  AppNotification,
  EntityId,
  NotificationChannel,
  PaginationMeta,
  SelectOption,
} from '../../../types/domain';

type NotificationOrdering = '-created_at' | 'created_at' | '-updated_at' | 'updated_at';
type ChannelFilter = 'all' | NotificationChannel;
type ReadFilter = 'all' | 'read' | 'unread';

const PAGE_SIZE = 9;
const DEFAULT_ORDERING: NotificationOrdering = '-created_at';

const DEFAULT_PAGINATION_META: PaginationMeta = {
  page: 1,
  pageSize: PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
};

const labelClassName =
  'text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted';

function toBooleanReadFilter(value: ReadFilter): boolean | undefined {
  if (value === 'read') {
    return true;
  }

  if (value === 'unread') {
    return false;
  }

  return undefined;
}

function NotificationsPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = usePersistentState('notifications:search', '');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [ordering, setOrdering] = useState<NotificationOrdering>(DEFAULT_ORDERING);
  const [currentPage, setCurrentPage] = useState(1);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>(
    DEFAULT_PAGINATION_META,
  );

  const [selectedNotificationId, setSelectedNotificationId] = useState<EntityId | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [reloadCursor, setReloadCursor] = useState(0);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  useEffect(() => {
    const state = location.state as { notificationId?: EntityId } | null;
    const toastNotificationId = state?.notificationId;
    if (!toastNotificationId || typeof toastNotificationId !== 'string') {
      return;
    }

    setSelectedNotificationId(toastNotificationId);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, channelFilter, readFilter, ordering]);

  useEffect(() => {
    let isActive = true;

    async function loadNotifications() {
      setIsLoading(true);
      setHasError(false);

      try {
        const result = await services.notifications.listNotifications({
          page: currentPage,
          pageSize: PAGE_SIZE,
          search: search.trim() || undefined,
          channel: channelFilter === 'all' ? undefined : channelFilter,
          is_read: toBooleanReadFilter(readFilter),
          ordering,
        });

        if (!isActive) {
          return;
        }

        if (currentPage > result.meta.totalPages) {
          setCurrentPage(result.meta.totalPages);
          return;
        }

        setNotifications(result.items);
        setPaginationMeta(result.meta);
      } catch {
        if (!isActive) {
          return;
        }

        setHasError(true);
        setNotifications([]);
        setPaginationMeta(DEFAULT_PAGINATION_META);
      } finally {
        if (isActive) {
          setHasLoadedOnce(true);
          setIsLoading(false);
        }
      }
    }

    void loadNotifications();

    return () => {
      isActive = false;
    };
  }, [channelFilter, currentPage, ordering, readFilter, reloadCursor, search]);

  const channelOptions = useMemo<SelectOption[]>(
    () => [
      { value: 'all', label: t('notifications.filters.allChannels') },
      { value: 'in_app', label: getNotificationChannelLabel('in_app', i18n.language) },
      { value: 'telegram', label: getNotificationChannelLabel('telegram', i18n.language) },
      { value: 'system', label: getNotificationChannelLabel('system', i18n.language) },
    ],
    [i18n.language, t],
  );

  const readOptions = useMemo<SelectOption[]>(
    () => [
      { value: 'all', label: t('notifications.filters.all') },
      { value: 'read', label: t('notifications.filters.read') },
      { value: 'unread', label: t('notifications.filters.unread') },
    ],
    [t],
  );

  const orderingOptions = useMemo<SelectOption[]>(
    () => [
      { value: '-created_at', label: t('notifications.ordering.createdNewest') },
      { value: 'created_at', label: t('notifications.ordering.createdOldest') },
      { value: '-updated_at', label: t('notifications.ordering.updatedNewest') },
      { value: 'updated_at', label: t('notifications.ordering.updatedOldest') },
    ],
    [t],
  );

  function handleNotificationRead(updated: AppNotification) {
    setNotifications((current) => {
      if (readFilter === 'unread') {
        return current.filter((notification) => notification.id !== updated.id);
      }

      return current.map((notification) =>
        notification.id === updated.id ? updated : notification,
      );
    });
    setReloadCursor((current) => current + 1);
  }

  function handleNotificationDeleted(notificationId: EntityId) {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== notificationId),
    );
    if (selectedNotificationId === notificationId) {
      setSelectedNotificationId(null);
    }
    setReloadCursor((current) => current + 1);
  }

  async function handleMarkAllRead() {
    setIsMarkingAllRead(true);
    try {
      await services.notifications.markAllAsRead();
      setReloadCursor((current) => current + 1);
      window.dispatchEvent(new CustomEvent('notifications:changed'));
    } finally {
      setIsMarkingAllRead(false);
    }
  }

  async function handleDeleteAll() {
    const confirmed = window.confirm(t('notifications.bulk.deleteAllConfirm'));
    if (!confirmed) {
      return;
    }

    setIsDeletingAll(true);
    try {
      await services.notifications.deleteAll();
      setNotifications([]);
      setSelectedNotificationId(null);
      setCurrentPage(1);
      setReloadCursor((current) => current + 1);
      window.dispatchEvent(new CustomEvent('notifications:changed'));
    } finally {
      setIsDeletingAll(false);
    }
  }

  const activeFilterCount =
    Number(search.trim().length > 0) +
    Number(channelFilter !== 'all') +
    Number(readFilter !== 'all') +
    Number(ordering !== DEFAULT_ORDERING);
  const hasNotifications = paginationMeta.totalItems > 0;

  const header = (
    <PageHeader
      eyebrow={t('notifications.eyebrow')}
      title={t('notifications.title')}
      subtitle={t('notifications.subtitle')}
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2 min-[768px]:w-auto">
          <button
            type="button"
            className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-surface-subtle px-3 text-sm font-semibold text-text-primary ring-1 ring-border-soft/40 transition duration-fast hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => {
              void handleMarkAllRead();
            }}
            disabled={isLoading || isMarkingAllRead || isDeletingAll || !hasNotifications}
          >
            <AppIcon name="mark-read-all" className="h-4 w-4" aria-hidden="true" />
            {isMarkingAllRead
              ? t('notifications.bulk.markingAllRead')
              : t('notifications.bulk.markAllRead')}
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-danger-bg px-3 text-sm font-semibold text-danger transition duration-fast hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => {
              void handleDeleteAll();
            }}
            disabled={isLoading || isMarkingAllRead || isDeletingAll || !hasNotifications}
          >
            <AppIcon name="trash" className="h-4 w-4" aria-hidden="true" />
            {isDeletingAll
              ? t('notifications.bulk.deletingAll')
              : t('notifications.bulk.deleteAll')}
          </button>
          <span className="inline-flex min-h-8 items-center gap-2 rounded-pill bg-primary/12 px-3 text-[12px] font-semibold text-text-accent">
            <AppIcon name="notifications" className="h-3.5 w-3.5" aria-hidden="true" />
            {paginationMeta.totalItems} {t('notifications.countSuffix')}
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
            <LoadingState
              title={t('notifications.loadingTitle')}
              description={t('notifications.loadingDescription')}
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
              title={t('notifications.errorTitle')}
              description={t('notifications.errorDescription')}
            />
          </PageCard>
        </PageSection>
      </PageLayout>
    );
  }

  return (
    <PageLayout header={header}>
      <PageSection>
        <FilterBar
          actions={
            <div className="flex w-full flex-wrap items-center gap-2 max-[820px]:justify-start min-[820px]:w-auto min-[820px]:justify-end">
              {activeFilterCount > 0 ? (
                <span className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary/12 px-3 text-sm font-semibold text-text-accent">
                  <AppIcon name="filter" className="h-4 w-4" aria-hidden="true" />
                  {activeFilterCount} {t('notifications.activeFilters')}
                </span>
              ) : null}
              {selectedNotificationId ? (
                <span className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-info-bg px-3 text-sm font-semibold text-info">
                  {t('notifications.detailOpen')}
                </span>
              ) : null}
            </div>
          }
        >
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('notifications.searchPlaceholder')}
          />

          <label className="grid min-w-[min(180px,100%)] flex-[1_1_180px] gap-1.5 min-[640px]:flex-[0_1_180px]">
            <span className={labelClassName}>{t('notifications.filters.channel')}</span>
            <FilterSelect
              value={channelFilter}
              options={channelOptions}
              onChange={(value) => setChannelFilter(value as ChannelFilter)}
              disabled={isLoading}
            />
          </label>

          <label className="grid min-w-[min(180px,100%)] flex-[1_1_180px] gap-1.5 min-[640px]:flex-[0_1_180px]">
            <span className={labelClassName}>{t('notifications.filters.status')}</span>
            <FilterSelect
              value={readFilter}
              options={readOptions}
              onChange={(value) => setReadFilter(value as ReadFilter)}
              disabled={isLoading}
            />
          </label>

          <label className="grid min-w-[min(220px,100%)] flex-[1_1_220px] gap-1.5 min-[640px]:flex-[0_1_240px]">
            <span className={labelClassName}>{t('notifications.filters.ordering')}</span>
            <FilterSelect
              value={ordering}
              options={orderingOptions}
              onChange={(value) => setOrdering(value as NotificationOrdering)}
              disabled={isLoading}
            />
          </label>
        </FilterBar>

        <PageCard>
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <h2 className="m-0 text-[1rem] font-semibold text-text-primary">
                {t('notifications.listTitle')}
              </h2>
              <span className="text-[12px] font-medium text-text-muted">
                {t('notifications.listHint')}
              </span>
            </div>

            <NotificationList
              notifications={notifications}
              selectedNotificationId={selectedNotificationId}
              isLoading={isLoading}
              hasError={false}
              isFiltered={
                search.trim().length > 0 || channelFilter !== 'all' || readFilter !== 'all'
              }
              onSelectNotification={setSelectedNotificationId}
            />
          </div>
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

      {selectedNotificationId ? (
        <NotificationDetailPanel
          notificationId={selectedNotificationId}
          onClose={() => setSelectedNotificationId(null)}
          onNotificationRead={handleNotificationRead}
          onNotificationDeleted={handleNotificationDeleted}
        />
      ) : null}
    </PageLayout>
  );
}

export default NotificationsPage;

