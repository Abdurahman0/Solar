import { useEffect, useMemo, useRef, useState } from 'react'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import {
	DataTable,
	FilterBar,
	FilterSelect,
	Pagination,
	SearchInput,
	StatusBadge,
	type DataTableColumn,
} from '../../../components/shared/data'
import AppIcon from '../../../components/shared/icons/AppIcon'
import {
	EmptyState,
	PageHeader,
	PageLayout,
	PageSection,
} from '../../../components/shared/page'
import { useList } from '../../../components/hooks'
import AuditRequestDeleteDialog from '../../../features/audit-requests/components/AuditRequestDeleteDialog'
import { AuditRequestsDetailPanel } from '../../../features/audit-requests/components/AuditRequestsDetailPanel'
import { AuditRequestsFormPanel } from '../../../features/audit-requests/components/AuditRequestsFormPanel'
import { formatLocalizedDate } from '../../../i18n/date-format'
import { services } from '../../../services'
import { useAuth } from '../../../auth'
import type { AuditRequest, AuditRequestsListParams } from '../../../services/contracts'

const labelClassName =
	'text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted'
const tablePrimaryTextClassName =
	'block max-w-[160px] truncate text-sm font-semibold leading-[1.35] text-text-primary min-[640px]:max-w-[240px]'
const tableSecondaryTextClassName =
	'block max-w-[160px] truncate text-[12px] leading-[1.45] text-text-secondary min-[640px]:max-w-[240px]'
const actionButtonClassName =
	'inline-flex h-8 w-8 items-center justify-center rounded-md bg-surface-card text-text-secondary shadow-sm ring-1 ring-border-soft/40 transition duration-fast hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20'

function statusTone(
	status?: string,
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

function AuditRequestsPage() {
	const { t, i18n } = useTranslation()
	const locale = i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'en' ? 'en-US' : 'uz-UZ'
	const { hasPermission } = useAuth()
	const canManageAuditRequests = hasPermission('can_manage_contracts')
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [clientFilter, setClientFilter] = useState('')
	const [requestedPowerFilter, setRequestedPowerFilter] = useState('')
	const searchQueryRef = useRef('')
	const clientFilterRef = useRef('')
	const clientDebounceRef = useRef<number | null>(null)
	const requestedPowerDebounceRef = useRef<number | null>(null)
	const [ordering, setOrdering] = useState('-updated_at')
	const [filters, setFilters] = useState<AuditRequestsListParams>({
		page: 1,
		page_size: 20,
		search: '',
		ordering: '-updated_at',
	})
	const [selectedAuditRequestId, setSelectedAuditRequestId] = useState<string | null>(null)
	const [editingAuditRequest, setEditingAuditRequest] = useState<AuditRequest | null>(null)
	const [isFormOpen, setIsFormOpen] = useState(false)
	const [auditRequestToDelete, setAuditRequestToDelete] = useState<AuditRequest | null>(null)
	const [isDeleting, setIsDeleting] = useState(false)

	const fetcher = (params?: AuditRequestsListParams) =>
		services.auditRequests.listAuditRequests(params)
	const [state, actions] = useList<AuditRequest, AuditRequestsListParams>(fetcher, {
		params: filters,
		autoFetch: true,
	})

	const statusOptions = useMemo(
		() => [
			{ value: 'all', label: t('auditRequests.filters.allStatuses') },
			{ value: 'new', label: t('auditRequests.statuses.new') },
			{ value: 'moderation', label: t('auditRequests.statuses.moderation') },
			{ value: 'published', label: t('auditRequests.statuses.published') },
			{ value: 'paid', label: t('auditRequests.statuses.paid') },
			{
				value: 'conclusion_given',
				label: t('auditRequests.statuses.conclusion_given'),
			},
		],
		[t],
	)

	const orderingOptions = useMemo(
		() => [
			{ value: '-updated_at', label: t('auditRequests.ordering.updatedNewest') },
			{ value: 'updated_at', label: t('auditRequests.ordering.updatedOldest') },
			{ value: '-created_at', label: t('auditRequests.ordering.createdNewest') },
			{ value: 'created_at', label: t('auditRequests.ordering.createdOldest') },
			{ value: '-requested_power_kw', label: t('auditRequests.ordering.powerHighLow') },
			{ value: 'requested_power_kw', label: t('auditRequests.ordering.powerLowHigh') },
		],
		[t],
	)

	const columns = useMemo<DataTableColumn<AuditRequest>[]>(
		() => [
			{
				key: 'client_name',
				label: t('auditRequests.columns.request'),
				render: auditRequest => (
					<div className='grid gap-0.5'>
						<span className={tablePrimaryTextClassName}>
							{auditRequest.client_name || t('common.notAvailable')}
						</span>
						<span className={tableSecondaryTextClassName}>
							{auditRequest.contract_title || '-'}
						</span>
					</div>
				),
			},
			{
				key: 'requested_power_kw',
				label: t('auditRequests.columns.requestedPower'),
				render: auditRequest => (
					<span className={tablePrimaryTextClassName}>
						{`${auditRequest.requested_power_kw} kW`}
					</span>
				),
			},
			{
				key: 'contact_phone',
				label: t('auditRequests.columns.contactPhone'),
				render: auditRequest => (
					<span className={tablePrimaryTextClassName}>
						{auditRequest.contact_phone || '-'}
					</span>
				),
			},
			{
				key: 'status',
				label: t('auditRequests.columns.status'),
				render: auditRequest => (
					<StatusBadge
						status={auditRequest.status}
						label={t(`auditRequests.statuses.${auditRequest.status}`)}
						tone={statusTone(auditRequest.status)}
					/>
				),
			},
			{
				key: 'updated_at',
				label: t('auditRequests.columns.updated'),
				render: auditRequest => (
					<span className={tablePrimaryTextClassName}>
						{formatLocalizedDate(auditRequest.updated_at, locale, {
							locale,
							withYear: true,
							shortMonth: true,
							fallback: '-',
						})}
					</span>
				),
			},
			...(canManageAuditRequests
				? [
						{
							key: 'actions',
							label: t('auditRequests.columns.actions'),
							align: 'right' as const,
							render: (auditRequest: AuditRequest) => (
								<div className='flex items-center justify-end gap-1.5'>
									<button
										type='button'
										className={actionButtonClassName}
										onClick={event => {
											event.stopPropagation()
											setEditingAuditRequest(auditRequest)
											setIsFormOpen(true)
										}}
										aria-label={t('common.edit')}
									>
										<FiEdit2 className='h-3.5 w-3.5' />
									</button>
									<button
										type='button'
										className={actionButtonClassName}
										onClick={event => {
											event.stopPropagation()
											setAuditRequestToDelete(auditRequest)
										}}
										aria-label={t('common.delete')}
									>
										<FiTrash2 className='h-3.5 w-3.5' />
									</button>
								</div>
							),
						},
					]
				: []),
		],
		[canManageAuditRequests, locale, t],
	)

	function applyFilters(next: Partial<AuditRequestsListParams>) {
		setFilters(current => ({ ...current, page: 1, ...next }))
		actions.setPage(1)
	}

	function composeSearch(query: string, client: string) {
		return [query.trim(), client.trim()].filter(Boolean).join(' ')
	}

	useEffect(() => {
		return () => {
			if (clientDebounceRef.current !== null) {
				window.clearTimeout(clientDebounceRef.current)
			}
			if (requestedPowerDebounceRef.current !== null) {
				window.clearTimeout(requestedPowerDebounceRef.current)
			}
		}
	}, [])

	async function handleConfirmDelete() {
		if (!auditRequestToDelete) {
			return
		}
		setIsDeleting(true)
		try {
			await services.auditRequests.deleteAuditRequest(auditRequestToDelete.id)
			setAuditRequestToDelete(null)
			if (selectedAuditRequestId === auditRequestToDelete.id) {
				setSelectedAuditRequestId(null)
			}
			await actions.refresh()
		} finally {
			setIsDeleting(false)
		}
	}

	return (
		<>
			<PageLayout
				header={
					<PageHeader
						eyebrow={t('auditRequests.eyebrow')}
						title={t('auditRequests.title')}
						subtitle={t('auditRequests.subtitle')}
						actions={
							<div className='flex w-full flex-wrap items-center gap-2 min-[768px]:w-auto'>
								{canManageAuditRequests ? (
									<button
										type='button'
										className='inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition duration-fast hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35'
										onClick={() => {
											setEditingAuditRequest(null)
											setIsFormOpen(true)
										}}
									>
										<AppIcon name='plus' className='h-4 w-4' aria-hidden='true' />
										{t('auditRequests.newAuditRequest')}
									</button>
								) : null}
								<span className='inline-flex min-h-8 items-center gap-2 rounded-pill bg-success-bg px-3 text-[12px] font-semibold text-success'>
									<AppIcon name='contracts' className='h-3.5 w-3.5' aria-hidden='true' />
									{state.items.length} {t('auditRequests.visible')}
								</span>
								{selectedAuditRequestId ? (
									<span className='inline-flex min-h-8 items-center gap-2 rounded-pill bg-primary/12 px-3 text-[12px] font-semibold text-text-accent'>
										<AppIcon name='contracts' className='h-3.5 w-3.5' aria-hidden='true' />
										{t('auditRequests.detailOpen')}
									</span>
								) : null}
							</div>
						}
					/>
				}
			>
				<PageSection>
					<div className='flex flex-col gap-4'>
						<FilterBar>
							<SearchInput
								value={searchQuery}
								onChange={value => {
									setSearchQuery(value)
									searchQueryRef.current = value
									applyFilters({
										search: composeSearch(value, clientFilterRef.current) || undefined,
									})
								}}
								placeholder={t('auditRequests.searchPlaceholder')}
							/>
							<label className='grid min-w-[min(180px,100%)] flex-[1_1_180px] gap-1.5 min-[640px]:flex-[0_1_220px]'>
								<span className={labelClassName}>{t('auditRequests.filters.status')}</span>
								<FilterSelect
									value={statusFilter}
									options={statusOptions}
									onChange={value => {
										setStatusFilter(value)
										applyFilters({
											status:
												value === 'all'
													? undefined
													: (value as AuditRequest['status']),
										})
									}}
									disabled={state.isLoading}
								/>
							</label>
							<label className='grid min-w-[min(180px,100%)] flex-[1_1_180px] gap-1.5 min-[640px]:flex-[0_1_240px]'>
								<span className={labelClassName}>{t('auditRequests.filters.client')}</span>
								<input
									type='text'
									className='w-full rounded-lg border border-border-soft/60 bg-surface-card px-3.5 py-2.5 text-sm font-medium text-text-primary placeholder:text-text-muted outline-none transition duration-fast focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60'
									value={clientFilter}
									onChange={event => {
										const value = event.target.value
										setClientFilter(value)
										clientFilterRef.current = value

										if (clientDebounceRef.current !== null) {
											window.clearTimeout(clientDebounceRef.current)
										}

										clientDebounceRef.current = window.setTimeout(() => {
											clientDebounceRef.current = null
											applyFilters({
												search:
													composeSearch(searchQueryRef.current, value) ||
													undefined,
											})
										}, 450)
									}}
									onKeyDown={event => {
										if (event.key !== 'Enter') {
											return
										}

										if (clientDebounceRef.current !== null) {
											window.clearTimeout(clientDebounceRef.current)
											clientDebounceRef.current = null
										}

										const normalized = event.currentTarget.value.trim()
										applyFilters({
											search:
												composeSearch(searchQueryRef.current, normalized) ||
												undefined,
										})
									}}
									onBlur={() => {
										if (clientDebounceRef.current === null) {
											return
										}

										window.clearTimeout(clientDebounceRef.current)
										clientDebounceRef.current = null

										const normalized = clientFilterRef.current.trim()
										applyFilters({
											search:
												composeSearch(searchQueryRef.current, normalized) ||
												undefined,
										})
									}}
									placeholder={t('auditRequests.filters.clientPlaceholder')}
								/>
							</label>
							<label className='grid min-w-[min(180px,100%)] flex-[1_1_180px] gap-1.5 min-[640px]:flex-[0_1_180px]'>
								<span className={labelClassName}>
									{t('auditRequests.filters.requestedPower')}
								</span>
								<input
									type='number'
									min={0}
									className='w-full rounded-lg border border-border-soft/60 bg-surface-card px-3.5 py-2.5 text-sm font-medium text-text-primary placeholder:text-text-muted outline-none transition duration-fast focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60'
									value={requestedPowerFilter}
									onChange={event => {
										const value = event.target.value
										setRequestedPowerFilter(value)

										if (requestedPowerDebounceRef.current !== null) {
											window.clearTimeout(requestedPowerDebounceRef.current)
										}

										requestedPowerDebounceRef.current = window.setTimeout(() => {
											requestedPowerDebounceRef.current = null
											const normalized = value.trim()
											const parsed =
												normalized === '' ? undefined : Number(normalized)

											applyFilters({
												requested_power_kw:
													parsed === undefined || Number.isFinite(parsed)
														? parsed
														: undefined,
											})
										}, 450)
									}}
									onKeyDown={event => {
										if (event.key !== 'Enter') {
											return
										}

										if (requestedPowerDebounceRef.current !== null) {
											window.clearTimeout(requestedPowerDebounceRef.current)
											requestedPowerDebounceRef.current = null
										}

										const normalized = event.currentTarget.value.trim()
										const parsed =
											normalized === '' ? undefined : Number(normalized)

										applyFilters({
											requested_power_kw:
												parsed === undefined || Number.isFinite(parsed)
													? parsed
													: undefined,
										})
									}}
									onBlur={() => {
										if (requestedPowerDebounceRef.current === null) {
											return
										}

										window.clearTimeout(requestedPowerDebounceRef.current)
										requestedPowerDebounceRef.current = null

										const normalized = requestedPowerFilter.trim()
										const parsed =
											normalized === '' ? undefined : Number(normalized)

										applyFilters({
											requested_power_kw:
												parsed === undefined || Number.isFinite(parsed)
													? parsed
													: undefined,
										})
									}}
								/>
							</label>
							<label className='grid min-w-[min(180px,100%)] flex-[1_1_180px] gap-1.5 min-[640px]:flex-[0_1_220px]'>
								<span className={labelClassName}>{t('auditRequests.filters.ordering')}</span>
								<FilterSelect
									value={ordering}
									options={orderingOptions}
									onChange={value => {
										setOrdering(value)
										applyFilters({ ordering: value })
									}}
									disabled={state.isLoading}
								/>
							</label>
						</FilterBar>

						<div className='grid min-w-0 gap-3'>
							<div className='flex flex-wrap items-center justify-between gap-2 px-1'>
								<h2 className='m-0 text-[1rem] font-semibold text-text-primary'>
									{t('auditRequests.listTitle')}
								</h2>
								<span className='text-[12px] font-medium text-text-muted'>
									{t('auditRequests.listHint')}
								</span>
							</div>

							{state.error ? (
								<div className='rounded-xl bg-surface-card p-6 shadow-sm ring-1 ring-border-soft/40'>
									<EmptyState
										title={t('auditRequests.errorTitle')}
										description={t('auditRequests.errorDescription')}
									/>
								</div>
							) : (
								<DataTable
									data={state.items}
									columns={columns}
									rowKey='id'
									selectedRowKey={selectedAuditRequestId ?? null}
									loading={state.isLoading}
									onRowClick={auditRequest => setSelectedAuditRequestId(auditRequest.id)}
									emptyTitle={t('auditRequests.emptyTitle')}
									emptyDescription={t('auditRequests.emptyDescription')}
								/>
							)}
						</div>

						{!state.error && state.total > 0 ? (
							<Pagination
								currentPage={filters.page ?? 1}
								totalPages={Math.max(1, Math.ceil(state.total / (filters.page_size ?? 20)))}
								totalItems={state.total}
								onPageChange={page => {
									actions.setPage(page)
									setFilters(current => ({ ...current, page }))
								}}
							/>
						) : null}
					</div>
				</PageSection>
			</PageLayout>

			{selectedAuditRequestId ? (
				<div
					className='fixed inset-0 z-[140] flex justify-end bg-background-overlay/72 backdrop-blur-[3px]'
					role='presentation'
					onClick={() => setSelectedAuditRequestId(null)}
				>
					<div
						className='h-full w-full max-w-[560px] overflow-y-auto bg-background-subtle p-4 shadow-xl ring-1 ring-border-soft/50 min-[641px]:p-5'
						onClick={event => event.stopPropagation()}
					>
						<AuditRequestsDetailPanel
							auditRequestId={selectedAuditRequestId}
							onClose={() => setSelectedAuditRequestId(null)}
							onEdit={auditRequest => {
								setSelectedAuditRequestId(null)
								setEditingAuditRequest(auditRequest)
								setIsFormOpen(true)
							}}
							onRequestDelete={auditRequest => {
								setSelectedAuditRequestId(null)
								setAuditRequestToDelete(auditRequest)
							}}
						/>
					</div>
				</div>
			) : null}

			{isFormOpen ? (
				<div
					className='fixed inset-0 z-[150] flex justify-end bg-background-overlay/72 backdrop-blur-[3px]'
					role='presentation'
					onClick={() => setIsFormOpen(false)}
				>
					<div
						className='h-full w-full max-w-[640px] overflow-y-auto bg-background-subtle p-4 shadow-xl ring-1 ring-border-soft/50 min-[641px]:p-5'
						onClick={event => event.stopPropagation()}
					>
						<AuditRequestsFormPanel
							auditRequest={editingAuditRequest ?? undefined}
							onClose={() => {
								setIsFormOpen(false)
								setEditingAuditRequest(null)
							}}
							onSuccess={async auditRequest => {
								setIsFormOpen(false)
								setEditingAuditRequest(null)
								setSelectedAuditRequestId(auditRequest.id)
								await actions.refresh()
							}}
						/>
					</div>
				</div>
			) : null}

			{auditRequestToDelete ? (
				<AuditRequestDeleteDialog
					auditRequest={auditRequestToDelete}
					isDeleting={isDeleting}
					onCancel={() => {
						if (!isDeleting) {
							setAuditRequestToDelete(null)
						}
					}}
					onConfirm={() => {
						void handleConfirmDelete()
					}}
				/>
			) : null}
		</>
	)
}

export default AuditRequestsPage
