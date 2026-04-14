import { useTranslation } from 'react-i18next';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useDetail } from '../../../components/hooks';
import { EmptyState, LoadingState, PageCard } from '../../../components/shared/page';
import { StatusBadge } from '../../../components/shared/data';
import AppIcon from '../../../components/shared/icons/AppIcon';
import { formatLocalizedDate } from '../../../i18n/date-format';
import { services } from '../../../services';
import type { Client } from '../../../services/contracts';

export interface ClientsDetailPanelProps {
  clientId: string;
  onClose?: () => void;
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
  onRequestDelete?: (client: Client) => void;
}

function isUuidLike(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

const labelClassName =
  'text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted';

const valueClassName =
  'text-sm font-semibold text-text-primary [overflow-wrap:anywhere]';

export function ClientsDetailPanel({
  clientId,
  onClose,
  onEdit,
  onDelete,
  onRequestDelete,
}: ClientsDetailPanelProps) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const locale = isRu ? 'ru-RU' : 'uz-UZ';
  const tx = isRu
    ? {
        title: 'Профиль клиента',
        loadingTitle: 'Загрузка...',
        loadingDescription: 'Получение данных клиента.',
        errorTitle: 'Клиент не найден',
        errorDescription: 'Клиент недоступен или был удален.',
        fields: {
          phone: 'Телефон',
          region: 'Регион',
          address: 'Адрес',
          objectType: 'Тип объекта',
          segment: 'Сегмент клиента',
          electricity: 'Потребление электроэнергии',
          monthlyBill: 'Ежемесячный счет',
          solutionType: 'Тип решения',
          budget: 'Бюджет',
          source: 'Источник',
          manager: 'Менеджер',
          notes: 'Заметки',
          aiSummary: 'AI сводка',
          created: 'Создан',
          updated: 'Обновлен',
        },
        edit: 'Редактировать',
        delete: 'Удалить',
      }
    : {
        title: 'Mijoz profili',
        loadingTitle: 'Yuklanmoqda...',
        loadingDescription: 'Mijoz ma\'lumotlari olinmoqda.',
        errorTitle: 'Mijoz topilmadi',
        errorDescription: 'Mijoz mavjud emas yoki o\'chirilgan.',
        fields: {
          phone: 'Telefon',
          region: 'Hudud',
          address: 'Manzil',
          objectType: 'Obyekt turi',
          segment: 'Mijoz segmenti',
          electricity: 'Elektr iste\'moli',
          monthlyBill: 'Oylik hisob',
          solutionType: 'Yechim turi',
          budget: 'Byudjet',
          source: 'Manba',
          manager: 'Menejer',
          notes: 'Izohlar',
          aiSummary: 'AI xulosa',
          created: 'Yaratilgan',
          updated: 'Yangilangan',
        },
        edit: 'Tahrirlash',
        delete: 'O\'chirish',
      };

  const statusLabels = isRu
    ? {
        new: 'Новый',
        contacted: 'Связались',
        qualified: 'Квалифицирован',
        need_follow_up: 'Нужен фоллоу-ап',
        proposal_preparing: 'Подготовка предложения',
        proposal_sent: 'Предложение отправлено',
        negotiation: 'Переговоры',
        waiting_for_decision: 'Ожидание решения',
        won: 'Выигран',
        lost: 'Потерян',
        postponed: 'Отложен',
      }
    : {
        new: 'Yangi',
        contacted: "Bog'lanildi",
        qualified: 'Saralangan',
        need_follow_up: 'Qayta aloqa kerak',
        proposal_preparing: 'Taklif tayyorlanmoqda',
        proposal_sent: 'Taklif yuborildi',
        negotiation: 'Muzokara',
        waiting_for_decision: 'Qaror kutilmoqda',
        won: 'Yutildi',
        lost: "Yo'qotildi",
        postponed: 'Kechiktirildi',
      };

  const [state] = useDetail(() => services.clients.getClient(clientId), { autoFetch: true });

  const getStatusTone = (status: string) => {
    switch (status) {
      case 'won':
        return 'success';
      case 'lost':
        return 'danger';
      case 'qualified':
        return 'accent';
      case 'new':
        return 'info';
      default:
        return 'warning';
    }
  };

  if (state.isLoading) {
    return <LoadingState title={tx.loadingTitle} description={tx.loadingDescription} />;
  }

  if (state.error || !state.data) {
    return <EmptyState title={tx.errorTitle} description={tx.errorDescription} />;
  }

  const client = state.data;
  const statusKey = (client.status || 'new') as keyof typeof statusLabels;
  const localizedStatusLabel =
    statusLabels[statusKey] || client.status_label || client.status || 'new';

  return (
    <div className="grid gap-3">
      <header className="mb-1 rounded-xl bg-surface-card p-4 shadow-sm ring-1 ring-border-soft/40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              {tx.title}
            </p>
            <h2 className="mt-1 font-display text-[1.45rem] font-extrabold leading-[1.08] tracking-[-0.03em] text-text-primary [overflow-wrap:anywhere]">
              {client.full_name}
            </h2>
          </div>

          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-primary shadow-sm transition duration-fast hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            onClick={onClose}
            aria-label={tx.title}
          >
            <AppIcon name="close" className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-3">
          <StatusBadge
            tone={getStatusTone(client.status)}
            status={client.status || 'new'}
            label={localizedStatusLabel}
          />
        </div>
      </header>

      <PageCard>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-lg bg-surface-subtle/80 p-3">
            <p className={labelClassName}>{tx.fields.phone}</p>
            <p className={`mt-1 ${valueClassName}`}>{client.phone || '-'}</p>
          </div>
          <div className="rounded-lg bg-surface-subtle/80 p-3">
            <p className={labelClassName}>{tx.fields.region}</p>
            <p className={`mt-1 ${valueClassName}`}>{client.region || '-'}</p>
          </div>
          <div className="rounded-lg bg-surface-subtle/80 p-3">
            <p className={labelClassName}>{tx.fields.address}</p>
            <p className={`mt-1 ${valueClassName}`}>{client.address || '-'}</p>
          </div>
          <div className="rounded-lg bg-surface-subtle/80 p-3">
            <p className={labelClassName}>{tx.fields.objectType}</p>
            <p className={`mt-1 ${valueClassName}`}>{client.object_type || '-'}</p>
          </div>
          <div className="rounded-lg bg-surface-subtle/80 p-3">
            <p className={labelClassName}>{tx.fields.segment}</p>
            <p className={`mt-1 ${valueClassName}`}>{client.customer_segment || '-'}</p>
          </div>
          <div className="rounded-lg bg-surface-subtle/80 p-3">
            <p className={labelClassName}>{tx.fields.electricity}</p>
            <p className={`mt-1 ${valueClassName}`}>{client.electricity_consumption || '-'}</p>
          </div>
          <div className="rounded-lg bg-surface-subtle/80 p-3">
            <p className={labelClassName}>{tx.fields.monthlyBill}</p>
            <p className={`mt-1 ${valueClassName}`}>{String(client.monthly_bill ?? '-')}</p>
          </div>
          <div className="rounded-lg bg-surface-subtle/80 p-3">
            <p className={labelClassName}>{tx.fields.solutionType}</p>
            <p className={`mt-1 ${valueClassName}`}>{client.solution_type || '-'}</p>
          </div>
          <div className="rounded-lg bg-surface-subtle/80 p-3">
            <p className={labelClassName}>{tx.fields.budget}</p>
            <p className={`mt-1 ${valueClassName}`}>{client.budget_range || '-'}</p>
          </div>
          <div className="rounded-lg bg-surface-subtle/80 p-3">
            <p className={labelClassName}>{tx.fields.source}</p>
            <p className={`mt-1 ${valueClassName}`}>
              {client.source_platform === 'manual' 
                ? (isRu ? 'Вручную' : 'Qo\'lda') 
                : client.source_platform === 'telegram'
                ? 'Telegram'
                : client.source_platform === 'instagram'
                ? 'Instagram'
                : (client.source_platform_label || client.source_platform || '-')}
            </p>
          </div>
          <div className="rounded-lg bg-surface-subtle/80 p-3">
            <p className={labelClassName}>{tx.fields.manager}</p>
            <p className={`mt-1 ${valueClassName}`}>
              {client.manager_username && !isUuidLike(client.manager_username)
                ? client.manager_username
                : '-'}
            </p>
          </div>
          {client.notes ? (
            <div className="rounded-lg bg-surface-subtle/80 p-3 sm:col-span-2">
              <p className={labelClassName}>{tx.fields.notes}</p>
              <p className="mt-1 text-sm leading-6 text-text-secondary [overflow-wrap:anywhere]">
                {client.notes}
              </p>
            </div>
          ) : null}
          {client.ai_summary ? (
            <div className="rounded-lg bg-surface-subtle/80 p-3 sm:col-span-2">
              <p className={labelClassName}>{tx.fields.aiSummary}</p>
              <p className="mt-1 text-sm leading-6 text-text-secondary [overflow-wrap:anywhere]">
                {client.ai_summary}
              </p>
            </div>
          ) : null}
        </div>
      </PageCard>

      <PageCard>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-lg bg-surface-subtle/35 p-3 ring-1 ring-border-soft/20">
            <p className={labelClassName}>{tx.fields.created}</p>
            <p className={`mt-1 ${valueClassName}`}>
              {formatLocalizedDate(client.created_at, locale, {
                locale,
                withYear: true,
                withTime: true,
                shortMonth: true,
                fallback: '-',
              })}
            </p>
          </div>
          <div className="rounded-lg bg-surface-subtle/35 p-3 ring-1 ring-border-soft/20">
            <p className={labelClassName}>{tx.fields.updated}</p>
            <p className={`mt-1 ${valueClassName}`}>
              {formatLocalizedDate(client.updated_at, locale, {
                locale,
                withYear: true,
                withTime: true,
                shortMonth: true,
                fallback: '-',
              })}
            </p>
          </div>
        </div>
      </PageCard>

      <div className="mt-1 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition duration-fast hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          onClick={() => onEdit?.(client)}
        >
          <FiEdit2 className="h-4 w-4" />
          {tx.edit}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-surface-card px-4 text-sm font-semibold text-danger shadow-sm ring-1 ring-danger/25 transition duration-fast hover:bg-danger/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/25"
          onClick={() => {
            onRequestDelete?.(client);
            onDelete?.(client);
          }}
        >
          <FiTrash2 className="h-4 w-4" />
          {tx.delete}
        </button>
      </div>
    </div>
  );
}
