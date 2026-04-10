import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { useDetail } from '../../../components/hooks'
import { EmptyState, LoadingState, PageCard } from '../../../components/shared/page'
import { StatusBadge } from '../../../components/shared/data'
import AppIcon from '../../../components/shared/icons/AppIcon'
import { formatLocalizedDate } from '../../../i18n/date-format'
import { services } from '../../../services'
import type { AuditRequest } from '../../../services/contracts'

const labelClassName =
	'text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted'
const valueClassName =
	'text-sm font-semibold text-text-primary [overflow-wrap:anywhere]'

function getStatusTone(
	status: AuditRequest['status'],
): 'info' | 'warning' | 'accent' | 'success' | 'danger' {
	if (status === 'paid') {
		return 'success'
	}
	if (status === 'published' || status === 'conclusion_given') {
		return 'accent'
	}
	if (status === 'moderation') {
		return 'warning'
	}
	return 'info'
}

function statusLabel(t: (key: string) => string, status: AuditRequest['status']) {
	return t(`auditRequests.statuses.${status}`)
}

export interface AuditRequestsDetailPanelProps {
	auditRequestId: string
	onClose?: () => void
	onEdit?: (auditRequest: AuditRequest) => void
	onRequestDelete?: (auditRequest: AuditRequest) => void
}

export function AuditRequestsDetailPanel({
	auditRequestId,
	onClose,
	onEdit,
	onRequestDelete,
}: AuditRequestsDetailPanelProps) {
	const { t, i18n } = useTranslation()
	const locale = i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'en' ? 'en-US' : 'uz-UZ'
	const [state] = useDetail(
		() => services.auditRequests.getAuditRequest(auditRequestId),
		{ autoFetch: true },
	)

	if (state.isLoading) {
		return (
			<LoadingState
				title={t('auditRequests.detail.loadingTitle')}
				description={t('auditRequests.detail.loadingDescription')}
			/>
		)
	}

	if (state.error || !state.data) {
		return (
			<EmptyState
				title={t('auditRequests.detail.errorTitle')}
				description={t('auditRequests.detail.errorDescription')}
			/>
		)
	}

	const auditRequest = state.data

	return (
		<div className='grid gap-3'>
			<header className='mb-1 rounded-xl bg-surface-card p-4 shadow-sm ring-1 ring-border-soft/40'>
				<div className='flex items-start justify-between gap-3'>
					<div className='min-w-0'>
						<p className='m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary'>
							{t('auditRequests.detail.eyebrow')}
						</p>
						<h2 className='mt-1 font-display text-[1.45rem] font-extrabold leading-[1.08] tracking-[-0.03em] text-text-primary [overflow-wrap:anywhere]'>
							{auditRequest.client_name || t('common.notAvailable')}
						</h2>
						<p className='mt-1 text-sm text-text-secondary [overflow-wrap:anywhere]'>
							{auditRequest.contract_title || '-'}
						</p>
					</div>
					<button
						type='button'
						className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-primary shadow-sm transition duration-fast hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20'
						onClick={onClose}
						aria-label={t('auditRequests.detail.close')}
					>
						<AppIcon name='close' className='h-4.5 w-4.5' aria-hidden='true' />
					</button>
				</div>
				<div className='mt-3'>
					<StatusBadge
						tone={getStatusTone(auditRequest.status)}
						status={auditRequest.status}
						label={statusLabel(t, auditRequest.status)}
					/>
				</div>
			</header>

			<PageCard>
				<div className='grid gap-2.5 sm:grid-cols-2'>
					<div className='rounded-lg bg-surface-subtle/80 p-3'>
						<p className={labelClassName}>{t('auditRequests.fields.client')}</p>
						<p className={`mt-1 ${valueClassName}`}>{auditRequest.client_name || '-'}</p>
					</div>
					<div className='rounded-lg bg-surface-subtle/80 p-3'>
						<p className={labelClassName}>{t('auditRequests.fields.contract')}</p>
						<p className={`mt-1 ${valueClassName}`}>{auditRequest.contract_title || '-'}</p>
					</div>
					<div className='rounded-lg bg-surface-subtle/80 p-3'>
						<p className={labelClassName}>{t('auditRequests.fields.requestedPower')}</p>
						<p className={`mt-1 ${valueClassName}`}>
							{Number.isFinite(auditRequest.requested_power_kw)
								? `${auditRequest.requested_power_kw} kW`
								: '-'}
						</p>
					</div>
					<div className='rounded-lg bg-surface-subtle/80 p-3'>
						<p className={labelClassName}>{t('auditRequests.fields.contactPhone')}</p>
						<p className={`mt-1 ${valueClassName}`}>{auditRequest.contact_phone || '-'}</p>
					</div>
					<div className='rounded-lg bg-surface-subtle/80 p-3 sm:col-span-2'>
						<p className={labelClassName}>{t('auditRequests.fields.siteAddress')}</p>
						<p className={`mt-1 ${valueClassName}`}>{auditRequest.site_address || '-'}</p>
					</div>
					<div className='rounded-lg bg-surface-subtle/80 p-3 sm:col-span-2'>
						<p className={labelClassName}>{t('auditRequests.fields.notes')}</p>
						<p className={`mt-1 ${valueClassName}`}>{auditRequest.notes || '-'}</p>
					</div>
					<div className='rounded-lg bg-surface-subtle/80 p-3 sm:col-span-2'>
						<p className={labelClassName}>{t('auditRequests.fields.conclusion')}</p>
						<p className={`mt-1 ${valueClassName}`}>{auditRequest.conclusion || '-'}</p>
					</div>
				</div>
			</PageCard>

			<PageCard>
				<div className='grid gap-2.5 sm:grid-cols-2'>
					<div className='rounded-lg bg-surface-subtle/35 p-3 ring-1 ring-border-soft/20'>
						<p className={labelClassName}>{t('auditRequests.fields.created')}</p>
						<p className={`mt-1 ${valueClassName}`}>
							{formatLocalizedDate(auditRequest.created_at, locale, {
								locale,
								withYear: true,
								withTime: true,
								shortMonth: true,
								fallback: '-',
							})}
						</p>
					</div>
					<div className='rounded-lg bg-surface-subtle/35 p-3 ring-1 ring-border-soft/20'>
						<p className={labelClassName}>{t('auditRequests.fields.updated')}</p>
						<p className={`mt-1 ${valueClassName}`}>
							{formatLocalizedDate(auditRequest.updated_at, locale, {
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
					className='inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition duration-fast hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35'
					onClick={() => onEdit?.(auditRequest)}
				>
					<FiEdit2 className='h-4 w-4' />
					{t('common.edit')}
				</button>
				<button
					type='button'
					className='inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-surface-card px-4 text-sm font-semibold text-danger shadow-sm ring-1 ring-danger/25 transition duration-fast hover:bg-danger/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/25'
					onClick={() => onRequestDelete?.(auditRequest)}
				>
					<FiTrash2 className='h-4 w-4' />
					{t('common.delete')}
				</button>
			</div>
		</div>
	)
}
