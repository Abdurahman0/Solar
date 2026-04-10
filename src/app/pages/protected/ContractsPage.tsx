import { useMemo, useState } from 'react'
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
import ContractDeleteDialog from '../../../features/contracts/components/ContractDeleteDialog'
import { ContractsDetailPanel } from '../../../features/contracts/components/ContractsDetailPanel'
import { ContractsFormPanel } from '../../../features/contracts/components/ContractsFormPanel'
import { services } from '../../../services'
import { useAuth } from '../../../auth'
import type { Contract, ContractsListParams } from '../../../services/contracts'

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

function ContractsPage() {
	const { i18n } = useTranslation()
	const isRu = i18n.language === 'ru'
	const { hasPermission } = useAuth()
	const canManageContracts = hasPermission('can_manage_contracts')

	const tx = isRu
		? {
				eyebrow: 'Воронка договоров',
				title: 'Договоры',
				subtitle: 'Управляйте статусами, панелями и доставкой в одном окне.',
				newContract: 'Новый договор',
				visible: 'видно',
				detailOpen: 'Профиль открыт',
				searchPlaceholder: 'Поиск по договору, клиенту или телефону...',
				statusLabel: 'Статус',
				panelLabel: 'Панель',
				inverterLabel: 'Инвертор',
				powerLabel: 'Мощность (кВт)',
				allStatuses: 'Все статусы',
				allPanels: 'Все панели',
				allInverters: 'Все инверторы',
				listTitle: 'Каталог договоров',
				listHint: 'Нажмите на строку для просмотра профиля.',
				errorTitle: 'Договоры недоступны',
				errorDescription: 'Не удалось загрузить список договоров.',
				columns: {
					title: 'Договор',
					panel: 'Панель',
					inverter: 'Инвертор',
					power: 'Мощность',
					status: 'Статус',
					updated: 'Обновлено',
					actions: 'Действия',
				},
				statuses: {
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
				},
				edit: 'Редактировать',
				delete: 'Удалить',
			}
		: {
				eyebrow: 'Shartnoma voronkasi',
				title: 'Shartnomalar',
				subtitle:
					'Shartnomalar holatini, panel va yetkazishni bitta oynada boshqaring.',
				newContract: 'Yangi shartnoma',
				visible: "ko`rinmoqda",
				detailOpen: 'Profil ochiq',
				searchPlaceholder: 'Shartnoma, mijoz yoki telefon bo`yicha qidiring...',
				statusLabel: 'Holat',
				panelLabel: 'Panel',
				inverterLabel: 'Invertor',
				powerLabel: 'Quvvat (kW)',
				allStatuses: 'Barcha holatlar',
				allPanels: 'Barcha panellar',
				allInverters: 'Barcha invertorlar',
				listTitle: 'Shartnomalar katalogi',
				listHint: "Profilni ko`rish uchun satrni bosing.",
				errorTitle: 'Shartnomalar mavjud emas',
				errorDescription: "Shartnomalar ro`yxatini yuklab bo`lmadi.",
				columns: {
					title: 'Shartnoma',
					panel: 'Panel',
					inverter: 'Invertor',
					power: 'Quvvat',
					status: 'Holat',
					updated: 'Yangilangan',
					actions: 'Amallar',
				},
				statuses: {
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
				},
				edit: 'Tahrirlash',
				delete: "O`chirish",
			}

	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [panelFilter, setPanelFilter] = useState<string>('all')
	const [inverterFilter, setInverterFilter] = useState<string>('all')
	const [requestedPowerFilter, setRequestedPowerFilter] = useState('')
	const [filters, setFilters] = useState<ContractsListParams>({
		page: 1,
		page_size: 20,
		search: '',
		ordering: '-updated_at',
	})
	const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
	const [editingContract, setEditingContract] = useState<Contract | null>(null)
	const [isFormOpen, setIsFormOpen] = useState(false)
	const [contractToDelete, setContractToDelete] = useState<Contract | null>(null)
	const [isDeleting, setIsDeleting] = useState(false)
	const [isRecalculating, setIsRecalculating] = useState(false)
	const [detailRefreshToken, setDetailRefreshToken] = useState(0)
	const [isPricingOpen, setIsPricingOpen] = useState(false)
	const [isPricingLoading, setIsPricingLoading] = useState(false)
	const [pricingRows, setPricingRows] = useState<Contract[]>([])

	const fetcher = (params?: ContractsListParams) =>
		services.contracts.listContracts(params)
	const [state, actions] = useList<Contract, ContractsListParams>(fetcher, {
		params: filters,
		autoFetch: true,
	})

	const statusOptions = useMemo(
		() => [
			{ value: 'all', label: tx.allStatuses },
			...Object.entries(tx.statuses).map(([value, label]) => ({ value, label })),
		],
		[tx.allStatuses, tx.statuses],
	)

	const panelOptions = useMemo(
		() => [
			{ value: 'all', label: tx.allPanels },
			{ value: 'jinko_ja', label: 'Jinko / JA Solar' },
			{ value: 'longi_hi_mo_x10', label: 'Longi HI MO X10' },
		],
		[tx.allPanels],
	)

	const inverterOptions = useMemo(
		() => [
			{ value: 'all', label: tx.allInverters },
			{ value: 'deye', label: 'DEYE' },
			{ value: 'solax', label: 'SOLAX' },
		],
		[tx.allInverters],
	)

	const columns = useMemo<DataTableColumn<Contract>[]>(
		() => [
			{
				key: 'title',
				label: tx.columns.title,
				render: contract => (
					<div className='grid gap-0.5'>
						<span className={tablePrimaryTextClassName}>{contract.title}</span>
						<span className={tableSecondaryTextClassName}>
							{contract.client_name || '-'}
						</span>
					</div>
				),
			},
			{
				key: 'panel_type',
				label: tx.columns.panel,
				render: contract => (
					<span className={tablePrimaryTextClassName}>
						{contract.panel_type_label || contract.panel_type || '-'}
					</span>
				),
			},
			{
				key: 'inverter_type',
				label: tx.columns.inverter,
				render: contract => (
					<span className={tablePrimaryTextClassName}>
						{contract.inverter_type_label || contract.inverter_type || '-'}
					</span>
				),
			},
			{
				key: 'requested_power_kw',
				label: tx.columns.power,
				render: contract => (
					<span className={tablePrimaryTextClassName}>
						{contract.requested_power_kw
							? `${contract.requested_power_kw} kW`
							: '-'}
					</span>
				),
			},
			{
				key: 'status',
				label: tx.columns.status,
				render: contract => (
					<StatusBadge
						status={contract.status}
						label={tx.statuses[contract.status as keyof typeof tx.statuses] ?? contract.status}
						tone={statusTone(contract.status)}
					/>
				),
			},
			{
				key: 'updated_at',
				label: tx.columns.updated,
				render: contract => (
					<span className={tablePrimaryTextClassName}>
						{contract.updated_at
							? new Date(contract.updated_at).toLocaleDateString(
									isRu ? 'ru-RU' : 'uz-UZ',
								)
							: '-'}
					</span>
				),
			},
			...(canManageContracts
				? [
						{
							key: 'actions',
							label: tx.columns.actions,
							align: 'right' as const,
							render: (contract: Contract) => (
								<div className='flex items-center justify-end gap-1.5'>
									<button
										type='button'
										className={actionButtonClassName}
										onClick={event => {
											event.stopPropagation()
											setEditingContract(contract)
											setIsFormOpen(true)
										}}
										aria-label={tx.edit}
									>
										<FiEdit2 className='h-3.5 w-3.5' />
									</button>
									<button
										type='button'
										className={actionButtonClassName}
										onClick={event => {
											event.stopPropagation()
											setContractToDelete(contract)
										}}
										aria-label={tx.delete}
									>
										<FiTrash2 className='h-3.5 w-3.5' />
									</button>
								</div>
							),
						},
					]
				: []),
		],
		[canManageContracts, isRu, tx],
	)

	function applyFilters(next: Partial<ContractsListParams>) {
		setFilters(current => ({ ...current, page: 1, ...next }))
		actions.setPage(1)
	}

	async function handleConfirmDelete() {
		if (!contractToDelete) {
			return
		}
		setIsDeleting(true)
		try {
			await services.contracts.deleteContract(contractToDelete.id)
			setContractToDelete(null)
			if (selectedContractId === contractToDelete.id) {
				setSelectedContractId(null)
			}
			await actions.refresh()
		} finally {
			setIsDeleting(false)
		}
	}

	async function handleRecalculate(contract: Contract) {
		setIsRecalculating(true)
		try {
			await services.contracts.recalculate(contract.id, {
				client: contract.client,
				title: contract.title,
				status: contract.status,
				panel_type: contract.panel_type,
				inverter_type: contract.inverter_type,
				requested_power_kw: contract.requested_power_kw ?? null,
				audit_power_kw: contract.audit_power_kw ?? null,
				subsidy_percent: contract.subsidy_percent ?? null,
				customer_phone: contract.customer_phone ?? '',
				installation_address: contract.installation_address ?? '',
				delivery_status: contract.delivery_status ?? '',
				delivery_notes: contract.delivery_notes ?? '',
				details:
					typeof contract.details === 'string'
						? contract.details
						: JSON.stringify(contract.details ?? {}),
				items: (contract.items ?? []).map(item => ({
					product: item.product,
					quantity: item.quantity,
					unit_price: item.unit_price,
				})),
			})
			setDetailRefreshToken(current => current + 1)
			await actions.refresh()
		} finally {
			setIsRecalculating(false)
		}
	}

	async function openPricingMatrix() {
		setIsPricingOpen(true)
		setIsPricingLoading(true)
		try {
			const result = await services.contracts.getPricingMatrix()
			setPricingRows(result)
		} finally {
			setIsPricingLoading(false)
		}
	}

	if (state.error) {
		return (
			<PageLayout
				header={<PageHeader eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.subtitle} />}
			>
				<EmptyState title={tx.errorTitle} description={tx.errorDescription} />
			</PageLayout>
		)
	}

	return (
		<>
			<PageLayout
				header={
					<PageHeader
						eyebrow={tx.eyebrow}
						title={tx.title}
						subtitle={tx.subtitle}
						actions={
							<div className='flex w-full flex-wrap items-center gap-2 min-[768px]:w-auto'>
								{canManageContracts ? (
									<>
										<button
											type='button'
											className='inline-flex min-h-9 items-center gap-2 rounded-lg bg-surface-card px-3.5 text-sm font-semibold text-text-primary shadow-sm ring-1 ring-border-soft/40 transition duration-fast hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25'
											onClick={() => {
												void openPricingMatrix()
											}}
										>
											<AppIcon name='activity' className='h-4 w-4' aria-hidden='true' />
											{isRu ? 'Pricing matrix' : 'Pricing matrix'}
										</button>
										<button
											type='button'
											className='inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition duration-fast hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35'
											onClick={() => {
												setEditingContract(null)
												setIsFormOpen(true)
											}}
										>
											<AppIcon name='plus' className='h-4 w-4' aria-hidden='true' />
											{tx.newContract}
										</button>
									</>
								) : null}
								<span className='inline-flex min-h-8 items-center gap-2 rounded-pill bg-success-bg px-3 text-[12px] font-semibold text-success'>
									<AppIcon name='contracts' className='h-3.5 w-3.5' aria-hidden='true' />
									{state.items.length} {tx.visible}
								</span>
								{selectedContractId ? (
									<span className='inline-flex min-h-8 items-center gap-2 rounded-pill bg-primary/12 px-3 text-[12px] font-semibold text-text-accent'>
										<AppIcon name='contracts' className='h-3.5 w-3.5' aria-hidden='true' />
										{tx.detailOpen}
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
									applyFilters({ search: value || undefined })
								}}
								placeholder={tx.searchPlaceholder}
							/>
							<label className='grid min-w-[min(180px,100%)] flex-[1_1_180px] gap-1.5 min-[640px]:flex-[0_1_220px]'>
								<span className={labelClassName}>{tx.statusLabel}</span>
								<FilterSelect
									value={statusFilter}
									options={statusOptions}
									onChange={value => {
										setStatusFilter(value)
										applyFilters({ status: value === 'all' ? undefined : value })
									}}
									disabled={state.isLoading}
								/>
							</label>
							<label className='grid min-w-[min(180px,100%)] flex-[1_1_180px] gap-1.5 min-[640px]:flex-[0_1_220px]'>
								<span className={labelClassName}>{tx.panelLabel}</span>
								<FilterSelect
									value={panelFilter}
									options={panelOptions}
									onChange={value => {
										setPanelFilter(value)
										applyFilters({
											panel_type:
												value === 'all'
													? undefined
													: (value as ContractsListParams['panel_type']),
										})
									}}
									disabled={state.isLoading}
								/>
							</label>
							<label className='grid min-w-[min(180px,100%)] flex-[1_1_180px] gap-1.5 min-[640px]:flex-[0_1_220px]'>
								<span className={labelClassName}>{tx.inverterLabel}</span>
								<FilterSelect
									value={inverterFilter}
									options={inverterOptions}
									onChange={value => {
										setInverterFilter(value)
										applyFilters({
											inverter_type:
												value === 'all'
													? undefined
													: (value as ContractsListParams['inverter_type']),
										})
									}}
									disabled={state.isLoading}
								/>
							</label>
							<label className='grid min-w-[min(180px,100%)] flex-[1_1_180px] gap-1.5 min-[640px]:flex-[0_1_180px]'>
								<span className={labelClassName}>{tx.powerLabel}</span>
								<input
									type='number'
									min={0}
									className='w-full rounded-lg border border-border-soft/60 bg-surface-card px-3.5 py-2.5 text-sm font-medium text-text-primary placeholder:text-text-muted outline-none transition duration-fast focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60'
									value={requestedPowerFilter}
									onChange={event => {
										const value = event.target.value
										setRequestedPowerFilter(value)
										applyFilters({
											requested_power_kw:
												value.trim() === '' ? undefined : Number(value),
										})
									}}
									disabled={state.isLoading}
								/>
							</label>
						</FilterBar>
						<div className='grid min-w-0 gap-3'>
							<div className='flex flex-wrap items-center justify-between gap-2 px-1'>
								<h2 className='m-0 text-[1rem] font-semibold text-text-primary'>
									{tx.listTitle}
								</h2>
								<span className='text-[12px] font-medium text-text-muted'>
									{tx.listHint}
								</span>
							</div>
							<DataTable
								data={state.items}
								columns={columns}
								rowKey='id'
								selectedRowKey={selectedContractId ?? null}
								loading={state.isLoading}
								onRowClick={contract => setSelectedContractId(contract.id)}
								emptyTitle={tx.errorTitle}
								emptyDescription={tx.errorDescription}
							/>
						</div>
						{state.total > 0 ? (
							<Pagination
								currentPage={filters.page ?? 1}
								totalPages={Math.max(
									1,
									Math.ceil(state.total / (filters.page_size ?? 20)),
								)}
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

			{selectedContractId ? (
				<div
					className='fixed inset-0 z-[140] flex justify-end bg-background-overlay/72 backdrop-blur-[3px]'
					role='presentation'
					onClick={() => setSelectedContractId(null)}
				>
					<div
						className='h-full w-full max-w-[560px] overflow-y-auto bg-background-subtle p-4 shadow-xl ring-1 ring-border-soft/50 min-[641px]:p-5'
						onClick={event => event.stopPropagation()}
					>
						<ContractsDetailPanel
							contractId={selectedContractId}
							refreshToken={detailRefreshToken}
							isRecalculating={isRecalculating}
							onClose={() => setSelectedContractId(null)}
							onEdit={contract => {
								setSelectedContractId(null)
								setEditingContract(contract)
								setIsFormOpen(true)
							}}
							onRecalculate={contract => {
								void handleRecalculate(contract)
							}}
							onRequestDelete={contract => {
								setSelectedContractId(null)
								setContractToDelete(contract)
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
						<ContractsFormPanel
							contract={editingContract ?? undefined}
							onClose={() => {
								setIsFormOpen(false)
								setEditingContract(null)
							}}
							onSuccess={async contract => {
								setIsFormOpen(false)
								setEditingContract(null)
								setSelectedContractId(contract.id)
								setDetailRefreshToken(current => current + 1)
								await actions.refresh()
							}}
						/>
					</div>
				</div>
			) : null}

			{contractToDelete ? (
				<ContractDeleteDialog
					contract={contractToDelete}
					isDeleting={isDeleting}
					onCancel={() => {
						if (!isDeleting) {
							setContractToDelete(null)
						}
					}}
					onConfirm={() => {
						void handleConfirmDelete()
					}}
				/>
			) : null}

			{isPricingOpen ? (
				<div
					className='fixed inset-0 z-[160] flex justify-end bg-background-overlay/72 backdrop-blur-[3px]'
					role='presentation'
					onClick={() => setIsPricingOpen(false)}
				>
					<div
						className='h-full w-full max-w-[560px] overflow-y-auto bg-background-subtle p-4 shadow-xl ring-1 ring-border-soft/50 min-[641px]:p-5'
						onClick={event => event.stopPropagation()}
					>
						<div className='grid gap-3'>
							<header className='rounded-xl bg-surface-card p-4 shadow-sm ring-1 ring-border-soft/40'>
								<div className='flex items-start justify-between gap-3'>
									<div>
										<p className='m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary'>
											{isRu ? 'Pricing matrix' : 'Pricing matrix'}
										</p>
										<h2 className='mt-1 font-display text-[1.35rem] font-extrabold leading-[1.08] tracking-[-0.03em] text-text-primary'>
											{isRu ? 'Narxlar jadvali' : 'Narxlar jadvali'}
										</h2>
									</div>
									<button
										type='button'
										className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-primary shadow-sm transition duration-fast hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20'
										onClick={() => setIsPricingOpen(false)}
									>
										<AppIcon name='close' className='h-4.5 w-4.5' aria-hidden='true' />
									</button>
								</div>
							</header>

							{isPricingLoading ? (
								<EmptyState
									title={isRu ? 'Загрузка...' : 'Yuklanmoqda...'}
									description={isRu ? 'Получаем данные матрицы.' : "Matritsa ma'lumotlari olinmoqda."}
								/>
							) : pricingRows.length === 0 ? (
								<EmptyState
									title={isRu ? 'Матрица пуста' : 'Matritsa bo`sh'}
									description={isRu ? 'Нет данных для отображения.' : "Ko`rsatish uchun ma'lumot yo`q."}
								/>
							) : (
								<div className='grid gap-2'>
									{pricingRows.map(row => (
										<div
											key={row.id}
											className='rounded-lg bg-surface-card p-3 shadow-sm ring-1 ring-border-soft/35'
										>
											<p className='m-0 text-sm font-semibold text-text-primary'>
												{row.title || '-'}
											</p>
											<p className='mt-1 text-xs text-text-secondary'>
												{row.client_name || '-'} • {String(row.total_amount ?? '-')}
											</p>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			) : null}
		</>
	)
}

export default ContractsPage

