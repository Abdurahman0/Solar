import { useMemo, useState } from 'react'
import { FiPlus, FiSearch } from 'react-icons/fi'
import { useList } from '../../../components/hooks'
import { DataTable, type ColumnDef } from '../../../components/ui/tables'
import { ContractsDetailPanel } from '../../../features/contracts/components/ContractsDetailPanel'
import { ContractsFormPanel } from '../../../features/contracts/components/ContractsFormPanel'
import { services } from '../../../services'
import type {
	Contract,
	ContractsListParams,
} from '../../../services/contracts'

function formatCurrency(value: number | undefined, currency: string | undefined): string {
	if (typeof value !== 'number') {
		return '-'
	}

	try {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency || 'USD',
			maximumFractionDigits: 2,
		}).format(value)
	} catch {
		return String(value)
	}
}

function ContractsPage() {
	const [search, setSearch] = useState('')
	const [filters, setFilters] = useState<ContractsListParams>({
		page: 1,
		page_size: 20,
		search: '',
		ordering: '-updated_at',
	})
	const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
	const [editingContract, setEditingContract] = useState<Contract | null>(null)
	const [isFormOpen, setIsFormOpen] = useState(false)

	const [state, actions] = useList<Contract, ContractsListParams>(
		params => services.contracts.listContracts(params),
		{
			params: filters,
			autoFetch: true,
		},
	)

	const columns = useMemo<ColumnDef<Contract>[]>(
		() => [
			{
				id: 'title',
				header: 'Title',
				cell: contract => (
					<div className='grid gap-0.5'>
						<span className='font-semibold text-text-primary'>{contract.title}</span>
						<span className='text-xs text-text-secondary'>{contract.client_id || '-'}</span>
					</div>
				),
			},
			{
				id: 'status',
				header: 'Status',
				cell: contract => (
					<span className='inline-flex rounded-pill bg-surface-subtle px-2 py-1 text-xs font-semibold capitalize text-text-secondary'>
						{contract.status || 'draft'}
					</span>
				),
			},
			{
				id: 'amount',
				header: 'Amount',
				cell: contract => (
					<span className='font-medium text-text-primary'>
						{formatCurrency(contract.amount, contract.currency)}
					</span>
				),
			},
			{
				id: 'start_date',
				header: 'Start Date',
				cell: contract =>
					contract.start_date
						? new Date(contract.start_date).toLocaleDateString()
						: '-',
			},
			{
				id: 'updated_at',
				header: 'Updated',
				cell: contract =>
					contract.updated_at
						? new Date(contract.updated_at).toLocaleDateString()
						: '-',
			},
		],
		[],
	)

	function handleSearch(value: string) {
		setSearch(value)
		actions.setPage(1)
		setFilters(current => ({
			...current,
			page: 1,
			search: value.trim() || undefined,
		}))
	}

	function openCreateForm() {
		setEditingContract(null)
		setIsFormOpen(true)
	}

	function openEditForm(contract: Contract) {
		setEditingContract(contract)
		setIsFormOpen(true)
	}

	async function refreshContracts() {
		await actions.refresh()
	}

	return (
		<>
			<div className='flex flex-col gap-4 p-6'>
				<div className='flex items-center justify-between gap-3'>
					<h1 className='text-xl font-bold text-text-primary'>Contracts</h1>
					<button
						type='button'
						onClick={openCreateForm}
						className='inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition duration-fast hover:bg-primary-accent'
					>
						<FiPlus className='h-4 w-4' />
						New Contract
					</button>
				</div>

				<div className='relative'>
					<FiSearch className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted' />
					<input
						type='text'
						value={search}
						onChange={event => handleSearch(event.target.value)}
						placeholder='Search contracts...'
						className='w-full rounded-lg border border-border-soft bg-surface-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20'
					/>
				</div>

				<DataTable
					columns={columns}
					data={state.items}
					isLoading={state.isLoading}
					currentPage={state.pageInfo.page || 1}
					pageSize={state.pageInfo.pageSize || 20}
					totalItems={state.total}
					onRowClick={contract => setSelectedContractId(contract.id)}
					onPageChange={page => {
						actions.setPage(page)
						setFilters(current => ({ ...current, page }))
					}}
					onPageSizeChange={pageSize => {
						actions.setPageSize(pageSize)
						setFilters(current => ({ ...current, page_size: pageSize, page: 1 }))
					}}
					emptyMessage='No contracts found'
					rowKey={contract => contract.id}
				/>
			</div>

			{selectedContractId ? (
				<div
					className='fixed inset-0 z-[140] flex justify-end bg-background-overlay/70 p-3'
					role='presentation'
					onClick={() => setSelectedContractId(null)}
				>
					<div
						className='h-full w-full max-w-[780px] overflow-y-auto rounded-xl bg-surface-card ring-1 ring-border-soft/45'
						onClick={event => event.stopPropagation()}
					>
						<ContractsDetailPanel
							contractId={selectedContractId}
							onClose={() => setSelectedContractId(null)}
							onEdit={(contract: Contract) => {
								setSelectedContractId(null)
								openEditForm(contract)
							}}
							onDelete={async () => {
								setSelectedContractId(null)
								await refreshContracts()
							}}
						/>
					</div>
				</div>
			) : null}

			{isFormOpen ? (
				<div
					className='fixed inset-0 z-[150] grid place-items-center bg-background-overlay/70 p-3'
					role='presentation'
					onClick={() => setIsFormOpen(false)}
				>
					<div
						className='w-full max-w-[900px] overflow-hidden rounded-xl bg-surface-card ring-1 ring-border-soft/45'
						onClick={event => event.stopPropagation()}
					>
						<ContractsFormPanel
							contract={editingContract ?? undefined}
							onClose={() => {
								setIsFormOpen(false)
								setEditingContract(null)
							}}
							onSuccess={async (contract: Contract) => {
								setIsFormOpen(false)
								setEditingContract(null)
								setSelectedContractId(contract.id)
								await refreshContracts()
							}}
						/>
					</div>
				</div>
			) : null}
		</>
	)
}

export default ContractsPage
