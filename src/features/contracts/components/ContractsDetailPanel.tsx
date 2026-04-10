import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { useDetail } from '../../../components/hooks'
import { EmptyState, LoadingState, PageCard } from '../../../components/shared/page'
import { StatusBadge } from '../../../components/shared/data'
import AppIcon from '../../../components/shared/icons/AppIcon'
import { formatLocalizedDate } from '../../../i18n/date-format'
import { services } from '../../../services'
import type { Contract } from '../../../services/contracts'

export interface ContractsDetailPanelProps {
	contractId: string
	refreshToken?: number
	isRecalculating?: boolean
	onClose?: () => void
	onEdit?: (contract: Contract) => void
	onRequestDelete?: (contract: Contract) => void
	onRecalculate?: (contract: Contract) => void
}

const labelClassName =
	'text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted'
const valueClassName =
	'text-sm font-semibold text-text-primary [overflow-wrap:anywhere]'

function getStatusTone(
	status: string,
): 'info' | 'warning' | 'accent' | 'success' | 'danger' {
	if (status === 'paid' || status === 'signed' || status === 'delivered') {
		return 'success'
	}
	if (status === 'canceled') {
		return 'danger'
	}
	if (status === 'audit_paid' || status === 'contract_ready') {
		return 'accent'
	}
	if (status === 'draft') {
		return 'info'
	}
	return 'warning'
}

function getStatusLabel(status: string, isRu: boolean): string {
	const map: Record<string, string> = isRu
		? {
				draft: 'Черновик',
				audit_pending: 'Аудит ожидается',
				audit_paid: 'Аудит оплачен',
				moderation: 'Модерация',
				contract_ready: 'Договор готов',
				payment_pending: 'Ожидает оплату',
				paid: 'Оплачен',
				delivered: 'Доставлен',
				sent: 'Отправлен',
				signed: 'Подписан',
				canceled: 'Отменен',
			}
		: {
				draft: 'Qoralama',
				audit_pending: 'Audit kutilmoqda',
				audit_paid: 'Audit to`langan',
				moderation: 'Moderatsiya',
				contract_ready: 'Shartnoma tayyor',
				payment_pending: 'To`lov kutilmoqda',
				paid: 'To`langan',
				delivered: 'Yetkazilgan',
				sent: 'Yuborilgan',
				signed: 'Imzolangan',
				canceled: 'Bekor qilingan',
			}
	return map[status] ?? status
}

function formatDetailsText(details: Contract['details']): string {
	if (!details) {
		return '-'
	}
	if (typeof details === 'string') {
		const trimmed = details.trim()
		return trimmed.length ? trimmed : '-'
	}
	const values = Object.values(details)
		.map(value => (typeof value === 'string' ? value.trim() : String(value)))
		.filter(value => value.length > 0)
	if (!values.length) {
		return '-'
	}
	return values.join(', ')
}

export function ContractsDetailPanel({
	contractId,
	refreshToken = 0,
	isRecalculating = false,
	onClose,
	onEdit,
	onRequestDelete,
	onRecalculate,
}: ContractsDetailPanelProps) {
	const { i18n } = useTranslation()
	const isRu = i18n.language === 'ru'
	const locale = isRu ? 'ru-RU' : 'uz-UZ'
	const tx = isRu
		? {
				title: 'Профиль договора',
				loadingTitle: 'Загрузка...',
				loadingDescription: 'Получаем данные договора.',
				errorTitle: 'Договор не найден',
				errorDescription: 'Договор недоступен или был удален.',
				edit: 'Редактировать',
				delete: 'Удалить',
				fields: {
					client: 'Клиент',
					panel: 'Тип панели',
					inverter: 'Тип инвертора',
					power: 'Мощность (кВт)',
					auditPower: 'Аудит мощность (кВт)',
					subsidy: 'Субсидия (%)',
					phone: 'Телефон',
					address: 'Адрес установки',
					deliveryStatus: 'Статус доставки',
					deliveryNotes: 'Примечание доставки',
					total: 'Итоговая сумма',
					details: 'Детали',
					created: 'Создан',
					updated: 'Обновлен',
					items: 'Позиции договора',
				},
			}
		: {
				title: 'Shartnoma profili',
				loadingTitle: 'Yuklanmoqda...',
				loadingDescription: "Shartnoma ma`lumotlari olinmoqda.",
				errorTitle: 'Shartnoma topilmadi',
				errorDescription: "Shartnoma mavjud emas yoki o`chirilgan.",
				edit: 'Tahrirlash',
				delete: "O`chirish",
				fields: {
					client: 'Mijoz',
					panel: 'Panel turi',
					inverter: 'Invertor turi',
					power: 'Quvvat (kW)',
					auditPower: 'Audit quvvati (kW)',
					subsidy: 'Subsidiya (%)',
					phone: 'Telefon',
					address: "O`rnatish manzili",
					deliveryStatus: 'Yetkazish holati',
					deliveryNotes: 'Yetkazish izohi',
					total: 'Jami summa',
					details: 'Tafsilotlar',
					created: 'Yaratilgan',
					updated: 'Yangilangan',
					items: 'Shartnoma pozitsiyalari',
				},
			}

	const fetchContract = useCallback(
		() => services.contracts.getContract(contractId),
		[contractId],
	)
	const [state, { fetch: fetchContractDetail }] = useDetail(fetchContract, {
		autoFetch: true,
	})

	useEffect(() => {
		if (refreshToken > 0) {
			void fetchContractDetail()
		}
	}, [fetchContractDetail, refreshToken])

	if (state.isLoading) {
		return <LoadingState title={tx.loadingTitle} description={tx.loadingDescription} />
	}
	if (state.error || !state.data) {
		return <EmptyState title={tx.errorTitle} description={tx.errorDescription} />
	}

	const contract = state.data
	const recalculateLabel = isRu ? 'РџРµСЂРµСЃС‡РёС‚Р°С‚СЊ' : 'Qayta hisoblash'

	return (
		<div className='grid gap-3'>
			<header className='mb-1 rounded-xl bg-surface-card p-4 shadow-sm ring-1 ring-border-soft/40'>
				<div className='flex items-start justify-between gap-3'>
					<div className='min-w-0'>
						<p className='m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary'>
							{tx.title}
						</p>
						<h2 className='mt-1 font-display text-[1.45rem] font-extrabold leading-[1.08] tracking-[-0.03em] text-text-primary [overflow-wrap:anywhere]'>
							{contract.title}
						</h2>
					</div>
					<button
						type='button'
						className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-primary shadow-sm transition duration-fast hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20'
						onClick={onClose}
						aria-label={tx.title}
					>
						<AppIcon name='close' className='h-4.5 w-4.5' aria-hidden='true' />
					</button>
				</div>
				<div className='mt-3'>
					<StatusBadge
						tone={getStatusTone(contract.status)}
						status={contract.status}
						label={getStatusLabel(contract.status, isRu)}
					/>
				</div>
			</header>

			<PageCard>
				<div className='grid gap-2.5 sm:grid-cols-2'>
					<div className='rounded-lg bg-surface-subtle/80 p-3'>
						<p className={labelClassName}>{tx.fields.client}</p>
						<p className={`mt-1 ${valueClassName}`}>{contract.client_name || '-'}</p>
					</div>
					<div className='rounded-lg bg-surface-subtle/80 p-3'>
						<p className={labelClassName}>{tx.fields.panel}</p>
						<p className={`mt-1 ${valueClassName}`}>
							{contract.panel_type_label || contract.panel_type || '-'}
						</p>
					</div>
					<div className='rounded-lg bg-surface-subtle/80 p-3'>
						<p className={labelClassName}>{tx.fields.inverter}</p>
						<p className={`mt-1 ${valueClassName}`}>
							{contract.inverter_type_label || contract.inverter_type || '-'}
						</p>
					</div>
					<div className='rounded-lg bg-surface-subtle/80 p-3'>
						<p className={labelClassName}>{tx.fields.power}</p>
						<p className={`mt-1 ${valueClassName}`}>{contract.requested_power_kw ?? '-'}</p>
					</div>
					<div className='rounded-lg bg-surface-subtle/80 p-3'>
						<p className={labelClassName}>{tx.fields.auditPower}</p>
						<p className={`mt-1 ${valueClassName}`}>{contract.audit_power_kw ?? '-'}</p>
					</div>
					<div className='rounded-lg bg-surface-subtle/80 p-3'>
						<p className={labelClassName}>{tx.fields.subsidy}</p>
						<p className={`mt-1 ${valueClassName}`}>{String(contract.subsidy_percent ?? '-')}</p>
					</div>
					<div className='rounded-lg bg-surface-subtle/80 p-3'>
						<p className={labelClassName}>{tx.fields.phone}</p>
						<p className={`mt-1 ${valueClassName}`}>{contract.customer_phone || '-'}</p>
					</div>
					<div className='rounded-lg bg-surface-subtle/80 p-3'>
						<p className={labelClassName}>{tx.fields.deliveryStatus}</p>
						<p className={`mt-1 ${valueClassName}`}>
							{contract.delivery_status_label || contract.delivery_status || '-'}
						</p>
					</div>
					<div className='rounded-lg bg-surface-subtle/80 p-3 sm:col-span-2'>
						<p className={labelClassName}>{tx.fields.address}</p>
						<p className={`mt-1 ${valueClassName}`}>{contract.installation_address || '-'}</p>
					</div>
					<div className='rounded-lg bg-surface-subtle/80 p-3 sm:col-span-2'>
						<p className={labelClassName}>{tx.fields.deliveryNotes}</p>
						<p className={`mt-1 ${valueClassName}`}>{contract.delivery_notes || '-'}</p>
					</div>
					<div className='rounded-lg bg-surface-subtle/80 p-3 sm:col-span-2'>
						<p className={labelClassName}>{tx.fields.details}</p>
						<p className={`mt-1 ${valueClassName}`}>{formatDetailsText(contract.details)}</p>
					</div>
					<div className='rounded-lg bg-surface-subtle/80 p-3'>
						<p className={labelClassName}>{tx.fields.total}</p>
						<p className={`mt-1 ${valueClassName}`}>{String(contract.total_amount ?? '-')}</p>
					</div>
				</div>
			</PageCard>

			<PageCard>
				<p className={labelClassName}>{tx.fields.items}</p>
				<div className='mt-2 grid gap-2'>
					{contract.items?.length ? (
						contract.items.map((item, index) => (
							<div
								key={item.id ?? `${item.product}-${index}`}
								className='rounded-lg bg-surface-subtle/70 p-3 text-sm text-text-primary'
							>
								{item.product_name || item.product} x {item.quantity} - {String(item.unit_price)}
							</div>
						))
					) : (
						<div className='rounded-lg bg-surface-subtle/70 p-3 text-sm text-text-secondary'>-</div>
					)}
				</div>
			</PageCard>

			<PageCard>
				<div className='grid gap-2.5 sm:grid-cols-2'>
					<div className='rounded-lg bg-surface-subtle/35 p-3 ring-1 ring-border-soft/20'>
						<p className={labelClassName}>{tx.fields.created}</p>
						<p className={`mt-1 ${valueClassName}`}>
							{formatLocalizedDate(contract.created_at, locale, {
								locale,
								withYear: true,
								withTime: true,
								shortMonth: true,
								fallback: '-',
							})}
						</p>
					</div>
					<div className='rounded-lg bg-surface-subtle/35 p-3 ring-1 ring-border-soft/20'>
						<p className={labelClassName}>{tx.fields.updated}</p>
						<p className={`mt-1 ${valueClassName}`}>
							{formatLocalizedDate(contract.updated_at, locale, {
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

			<div className='mt-1 flex flex-wrap items-center gap-2'>
				<button
					type='button'
					className='inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-info-bg px-4 text-sm font-semibold text-info shadow-sm ring-1 ring-info/25 transition duration-fast hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/30 disabled:cursor-not-allowed disabled:opacity-60'
					onClick={() => onRecalculate?.(contract)}
					disabled={isRecalculating}
				>
					<AppIcon name='activity' className='h-4 w-4' />
					{recalculateLabel}
				</button>
				<button
					type='button'
					className='inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition duration-fast hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35'
					onClick={() => onEdit?.(contract)}
				>
					<FiEdit2 className='h-4 w-4' />
					{tx.edit}
				</button>
				<button
					type='button'
					className='inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-surface-card px-4 text-sm font-semibold text-danger shadow-sm ring-1 ring-danger/25 transition duration-fast hover:bg-danger/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/25'
					onClick={() => onRequestDelete?.(contract)}
				>
					<FiTrash2 className='h-4 w-4' />
					{tx.delete}
				</button>
			</div>
		</div>
	)
}

