import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useDetail } from '../../../components/hooks'
import { EmptyState, LoadingState, PageCard } from '../../../components/shared/page'
import { StatusBadge } from '../../../components/shared/data'
import AppIcon from '../../../components/shared/icons/AppIcon'
import { formatLocalizedDate } from '../../../i18n/date-format'
import { routePaths } from '../../../config/routes'
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
	if (isRu) {
		const map: Record<string, string> = {
			draft: "\u0427\u0435\u0440\u043d\u043e\u0432\u0438\u043a",
			audit_pending: "\u0410\u0443\u0434\u0438\u0442 \u043e\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044f",
			audit_paid: "\u0410\u0443\u0434\u0438\u0442 \u043e\u043f\u043b\u0430\u0447\u0435\u043d",
			moderation: "\u041c\u043e\u0434\u0435\u0440\u0430\u0446\u0438\u044f",
			contract_ready: "\u0414\u043e\u0433\u043e\u0432\u043e\u0440 \u0433\u043e\u0442\u043e\u0432",
			payment_pending: "\u041e\u0436\u0438\u0434\u0430\u0435\u0442 \u043e\u043f\u043b\u0430\u0442\u0443",
			paid: "\u041e\u043f\u043b\u0430\u0447\u0435\u043d",
			delivered: "\u0414\u043e\u0441\u0442\u0430\u0432\u043b\u0435\u043d",
			sent: "\u041e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d",
			signed: "\u041f\u043e\u0434\u043f\u0438\u0441\u0430\u043d",
			canceled: "\u041e\u0442\u043c\u0435\u043d\u0435\u043d",
		}
		return map[status] ?? status
	}

	const map: Record<string, string> = {
		draft: 'Qoralama',
		audit_pending: 'Audit kutilmoqda',
		audit_paid: 'Audit to\'langan',
		moderation: 'Moderatsiya',
		contract_ready: 'Shartnoma tayyor',
		payment_pending: 'To\'lov kutilmoqda',
		paid: 'To\'langan',
		delivered: 'Yetkazilgan',
		sent: 'Yuborilgan',
		signed: 'Imzolangan',
		canceled: 'Bekor qilingan',
	}
	return map[status] ?? status
}
function getDeliveryStatusLabel(
	status: string | null | undefined,
	isRu: boolean,
): string | null {
	if (!status) {
		return null
	}
	if (isRu) {
		const map: Record<string, string> = {
			pending: "\u041e\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044f",
			in_progress: "\u0412 \u043f\u0440\u043e\u0446\u0435\u0441\u0441\u0435",
			delivered: "\u0414\u043e\u0441\u0442\u0430\u0432\u043b\u0435\u043d\u043e",
			canceled: "\u041e\u0442\u043c\u0435\u043d\u0435\u043d\u043e",
		}
		return map[status] ?? null
	}

	const map: Record<string, string> = {
		pending: 'Kutilmoqda',
		in_progress: 'Jarayonda',
		delivered: 'Yetkazilgan',
		canceled: 'Bekor qilingan',
	}
	return map[status] ?? null
}
function formatDetailsText(details: Contract['details']): string {
	if (!details) {
		return '-'
	}
	if (typeof details === 'string') {
		const trimmed = details.trim()
		return trimmed.length ? trimmed : '-'
	}
	try {
		// Details can contain nested objects (e.g. pricing breakdown). Render as readable JSON.
		return JSON.stringify(details, null, 2)
	} catch {
		return String(details)
	}
}

type PlainObject = Record<string, unknown>

function isPlainObject(value: unknown): value is PlainObject {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function humanizeKey(key: string): string {
	return key
		.replace(/_/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/^\w/, match => match.toUpperCase())
}

function formatSmartValue(
	key: string,
	value: unknown,
	locale: string,
	currencyLabel: string,
): string {
	if (value === null || value === undefined) {
		return '-'
	}
	if (typeof value === 'boolean') {
		return value ? 'true' : 'false'
	}
	if (typeof value === 'number') {
		if (key.endsWith('_percent')) {
			return `${value}%`
		}
		if (key.endsWith('_kw') || key.includes('power')) {
			return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)} kW`
		}
		if (key.endsWith('_amount') || key.endsWith('_price')) {
			return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)} ${currencyLabel}`
		}
		return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)
	}
	if (typeof value === 'string') {
		const trimmed = value.trim()
		if (!trimmed.length) {
			return '-'
		}
		const asNumber = Number(trimmed)
		if (Number.isFinite(asNumber)) {
			return formatSmartValue(key, asNumber, locale, currencyLabel)
		}
		return trimmed
	}
	if (Array.isArray(value)) {
		const parts = value
			.map(item => formatSmartValue(key, item, locale, currencyLabel))
			.filter(Boolean)
		return parts.length ? parts.join(', ') : '-'
	}
	if (isPlainObject(value)) {
		return '[object]'
	}
	return String(value)
}

function getDetailsLabel(key: string, isRu: boolean): string {
	const ru: Record<string, string> = {
		pricing_breakdown: '\u0420\u0430\u0441\u0447\u0435\u0442 \u0441\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u0438',
		base_price: '\u0411\u0430\u0437\u043e\u0432\u0430\u044f \u0446\u0435\u043d\u0430',
		subsidy_amount: '\u0421\u0443\u043c\u043c\u0430 \u0441\u0443\u0431\u0441\u0438\u0434\u0438\u0438',
		customer_amount: '\u0421\u0443\u043c\u043c\u0430 \u0434\u043b\u044f \u043a\u043b\u0438\u0435\u043d\u0442\u0430',
		subsidy_percent: '\u0421\u0443\u0431\u0441\u0438\u0434\u0438\u044f (%)',
		requested_power_kw:
			'\u0417\u0430\u043f\u0440\u043e\u0448\u0435\u043d\u043d\u0430\u044f \u043c\u043e\u0449\u043d\u043e\u0441\u0442\u044c',
		audit_power_kw: '\u0410\u0443\u0434\u0438\u0442 \u043c\u043e\u0449\u043d\u043e\u0441\u0442\u044c',
		subsidy_reference_power_kw:
			'\u041c\u043e\u0449\u043d\u043e\u0441\u0442\u044c \u0434\u043b\u044f \u0441\u0443\u0431\u0441\u0438\u0434\u0438\u0438',
		panel_type: '\u0422\u0438\u043f \u043f\u0430\u043d\u0435\u043b\u0438',
		inverter_type: '\u0422\u0438\u043f \u0438\u043d\u0432\u0435\u0440\u0442\u043e\u0440\u0430',
	}

	const uz: Record<string, string> = {
		pricing_breakdown: 'Narx hisob-kitobi',
		base_price: 'Bazaviy narx',
		subsidy_amount: 'Subsidiya summasi',
		customer_amount: 'Mijoz summasi',
		subsidy_percent: 'Subsidiya (%)',
		requested_power_kw: 'So\'ralgan quvvat',
		audit_power_kw: 'Audit quvvati',
		subsidy_reference_power_kw: 'Subsidiya uchun quvvat',
		panel_type: 'Panel turi',
		inverter_type: 'Invertor turi',
	}

	return (isRu ? ru[key] : uz[key]) ?? humanizeKey(key)
}

function DetailsGrid({
	data,
	isRu,
	locale,
}: {
	data: PlainObject
	isRu: boolean
	locale: string
}) {
	const currencyLabel = isRu ? '\u0441\u0443\u043c' : "so'm"
	const entries = Object.entries(data).filter(([, value]) => value !== undefined)

	if (!entries.length) {
		return <p className='mt-1 text-sm font-semibold text-text-secondary'>-</p>
	}

	return (
		<div className='mt-2 grid gap-2 sm:grid-cols-2'>
			{entries.map(([key, value]) => {
				const label = getDetailsLabel(key, isRu)
				const formatted = formatSmartValue(key, value, locale, currencyLabel)
				const isAmount = key.endsWith('_amount') || key.endsWith('_price')
				return (
					<div
						key={key}
						className='rounded-lg bg-surface-subtle/50 p-3 ring-1 ring-border-soft/25'
					>
						<p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted'>
							{label}
						</p>
						<p
							className={[
								'mt-1 font-semibold [overflow-wrap:anywhere]',
								isAmount ? 'text-base text-text-primary' : 'text-sm text-text-primary',
							].join(' ')}
						>
							{formatted}
						</p>
					</div>
				)
			})}
		</div>
	)
}

function ContractsDetailsView({
	details,
	isRu,
	locale,
}: {
	details: Contract['details']
	isRu: boolean
	locale: string
}) {
	if (!details) {
		return <p className='mt-1 text-sm font-semibold text-text-secondary'>-</p>
	}

	if (typeof details === 'string') {
		const trimmed = details.trim()
		return (
			<p className='mt-1 text-sm font-semibold text-text-primary [overflow-wrap:anywhere]'>
				{trimmed.length ? trimmed : '-'}
			</p>
		)
	}

	if (!isPlainObject(details)) {
		return (
			<pre className='mt-2 whitespace-pre-wrap break-words rounded-lg bg-surface-subtle/60 p-3 text-xs font-medium leading-relaxed text-text-primary ring-1 ring-border-soft/25'>
				{formatDetailsText(details)}
			</pre>
		)
	}

	const pricing = isPlainObject(details.pricing_breakdown)
		? (details.pricing_breakdown as PlainObject)
		: null

	const hasExtra = Object.keys(details).some(key => key !== 'pricing_breakdown')

	return (
		<div className='mt-2 grid gap-2'>
			{pricing ? (
				<div className='rounded-xl bg-surface-subtle/60 p-3 ring-1 ring-border-soft/30'>
					<p className='text-[11px] font-semibold uppercase tracking-[0.14em] text-primary'>
						{getDetailsLabel('pricing_breakdown', isRu)}
					</p>
					<DetailsGrid data={pricing} isRu={isRu} locale={locale} />
				</div>
			) : null}

			{hasExtra ? (
				<div className='rounded-xl bg-surface-subtle/40 p-3 ring-1 ring-border-soft/25'>
					<p className='text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted'>
						{isRu
							? '\u0414\u0440\u0443\u0433\u0438\u0435 \u0434\u0430\u043d\u043d\u044b\u0435'
							: "Boshqa ma'lumotlar"}
					</p>
					<pre className='mt-2 whitespace-pre-wrap break-words rounded-lg bg-surface-card/70 p-3 text-xs font-medium leading-relaxed text-text-primary ring-1 ring-border-soft/25'>
						{formatDetailsText(details)}
					</pre>
				</div>
			) : null}
		</div>
	)
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
	const navigate = useNavigate()
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
				loadingDescription: "Shartnoma ma'lumotlari olinmoqda.",
				errorTitle: 'Shartnoma topilmadi',
				errorDescription: "Shartnoma mavjud emas yoki o\'chirilgan.",
				edit: 'Tahrirlash',
				delete: "O'chirish",
				fields: {
					client: 'Mijoz',
					panel: 'Panel turi',
					inverter: 'Invertor turi',
					power: 'Quvvat (kW)',
					auditPower: 'Audit quvvati (kW)',
					subsidy: 'Subsidiya (%)',
					phone: 'Telefon',
					address: "O'rnatish manzili",
					deliveryStatus: 'Yetkazib berish holati',
					deliveryNotes: 'Yetkazish izohi',
					total: 'Jami summa',
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
	const recalculateLabel = isRu ? "\u041f\u0435\u0440\u0435\u0441\u0447\u0438\u0442\u0430\u0442\u044c" : 'Qayta hisoblash'
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
					{contract.client && contract.client_name ? (
						<div
							className='cursor-pointer rounded-lg bg-surface-subtle/80 p-3'
							role='button'
							tabIndex={0}
							onClick={() => {
								onClose?.()
								navigate(routePaths.clients, { state: { clientId: contract.client } })
							}}
							onKeyDown={event => {
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault()
									onClose?.()
									navigate(routePaths.clients, { state: { clientId: contract.client } })
								}
							}}
							aria-label={contract.client_name}
						>
							<p className={labelClassName}>{tx.fields.client}</p>
							<p className={`mt-1 ${valueClassName}`}>{contract.client_name}</p>
						</div>
					) : (
						<div className='rounded-lg bg-surface-subtle/80 p-3'>
							<p className={labelClassName}>{tx.fields.client}</p>
							<p className={`mt-1 ${valueClassName}`}>{contract.client_name || '-'}</p>
						</div>
					)}
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
							{getDeliveryStatusLabel(contract.delivery_status, isRu) ||
								contract.delivery_status_label ||
								contract.delivery_status ||
								'-'}
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
