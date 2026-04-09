/**
 * ClientsListView - Clients list with filtering and pagination
 */

import { useState } from 'react'
import { FiPlus, FiSearch } from 'react-icons/fi'
import { useList } from '../../../components/hooks'
import { DataTable, type ColumnDef } from '../../../components/ui/tables'
import { services } from '../../../services'
import type { Client, ClientsListParams } from '../../../services/contracts'

export interface ClientsListViewProps {
	onRowClick?: (client: Client) => void
	onCreateNew?: () => void
}

export function ClientsListView({
	onRowClick,
	onCreateNew,
}: ClientsListViewProps) {
	const [searchQuery, setSearchQuery] = useState('')
	const [filters, setFilters] = useState<ClientsListParams>({
		search: '',
		page: 1,
		page_size: 20,
	})

	const [state, actions] = useList(
		params => services.clients.listClients(params),
		{
			params: filters,
			autoFetch: true,
		},
	)

	const columns: ColumnDef<Client>[] = [
		{
			id: 'name',
			header: 'Name',
			accessorKey: 'name',
			cell: client => <span className='font-medium'>{client.name}</span>,
		},
		{
			id: 'email',
			header: 'Email',
			accessorKey: 'email',
			cell: client => client.email || '—',
		},
		{
			id: 'phone',
			header: 'Phone',
			accessorKey: 'phone',
			cell: client => client.phone || '—',
		},
		{
			id: 'company',
			header: 'Company',
			accessorKey: 'company',
			cell: client => client.company || '—',
		},
		{
			id: 'city',
			header: 'City',
			accessorKey: 'city',
			cell: client => client.city || '—',
		},
		{
			id: 'status',
			header: 'Status',
			accessorKey: 'status',
			cell: client => {
				const statusColors = {
					active: 'bg-green-500/20 text-green-600',
					inactive: 'bg-gray-500/20 text-gray-600',
					archived: 'bg-red-500/20 text-red-600',
				}
				const color =
					statusColors[client.status as keyof typeof statusColors] ||
					statusColors.active
				return (
					<span
						className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}
					>
						{client.status || 'Active'}
					</span>
				)
			},
		},
	]

	const handleSearch = (value: string) => {
		setSearchQuery(value)
		actions.setPage(1)
		setFilters(prev => ({ ...prev, search: value }))
	}

	return (
		<div className='flex flex-col gap-4'>
			{/* Header */}
			<div className='flex items-center justify-between gap-4'>
				<h1 className='text-xl font-bold text-text-primary'>Clients</h1>
				<button
					onClick={onCreateNew}
					className='inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-accent'
				>
					<FiPlus />
					New Client
				</button>
			</div>

			{/* Search */}
			<div className='relative'>
				<FiSearch className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted' />
				<input
					type='text'
					placeholder='Search clients...'
					value={searchQuery}
					onChange={e => handleSearch(e.target.value)}
					className='w-full rounded-lg border border-border-soft bg-surface-card pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20'
				/>
			</div>

			{/* Table */}
			<DataTable
				columns={columns}
				data={state.items}
				isLoading={state.isLoading}
				currentPage={state.pageInfo.page || 1}
				pageSize={state.pageInfo.pageSize || 20}
				totalItems={state.total}
				onRowClick={onRowClick}
				onPageChange={page => {
					actions.setPage(page)
					setFilters(prev => ({ ...prev, page }))
				}}
				onPageSizeChange={pageSize => {
					actions.setPageSize(pageSize)
					setFilters(prev => ({ ...prev, page_size: pageSize }))
				}}
				emptyMessage='No clients found'
				rowKey={client => client.id}
			/>
		</div>
	)
}
