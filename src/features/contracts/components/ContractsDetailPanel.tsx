// @ts-nocheck

/**
 * ContractsDetailPanel - Read-only detail view for contracts
 */

import { useEffect, useState } from 'react'
import {
	FiX,
	FiEdit,
	FiTrash2,
	FiFileText,
	FiUser,
	FiDollarSign,
	FiCalendar,
} from 'react-icons/fi'
import { useDetail } from '../../../components/hooks'
import {
	EmptyState,
	LoadingState,
	PageCard,
} from '../../../components/shared/page'
import { StatusBadge } from '../../../components/shared/data'
import { services } from '../../../services'
import type { Contract, Client } from '../../../services/contracts'

export interface ContractsDetailPanelProps {
	contractId: string
	onClose?: () => void
	onEdit?: (contract: Contract) => void
	onDelete?: (contract: Contract) => void
}

export function ContractsDetailPanel({
	contractId,
	onClose,
	onEdit,
	onDelete,
}: ContractsDetailPanelProps) {
	const [state, actions] = useDetail(
		() => services.contracts.getContract(contractId),
		{ autoFetch: true },
	)

	const [client, setClient] = useState<Client | null>(null)

	useEffect(() => {
		if (state.data?.client_id) {
			services.clients
				.getClient(state.data.client_id)
				.then(setClient)
				.catch(console.error)
		}
	}, [state.data?.client_id])

	const handleDelete = async () => {
		if (!state.data) return

		if (window.confirm('Are you sure you want to delete this contract?')) {
			try {
				await services.contracts.deleteContract(state.data.id)
				onDelete?.(state.data)
			} catch (error) {
				console.error('Error deleting contract:', error)
			}
		}
	}

	if (state.isLoading) {
		return (
			<div className='max-h-[85vh] overflow-y-auto'>
				<div className='flex items-center justify-between border-b border-border-soft px-6 py-4'>
					<h2 className='text-lg font-bold text-text-primary'>
						Contract Details
					</h2>
					<button
						onClick={onClose}
						className='flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-subtle'
					>
						<FiX className='text-text-secondary' />
					</button>
				</div>
				<div className='p-6'>
					<LoadingState />
				</div>
			</div>
		)
	}

	if (state.error || !state.data) {
		return (
			<div className='max-h-[85vh] overflow-y-auto'>
				<div className='flex items-center justify-between border-b border-border-soft px-6 py-4'>
					<h2 className='text-lg font-bold text-text-primary'>
						Contract Details
					</h2>
					<button
						onClick={onClose}
						className='flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-subtle'
					>
						<FiX className='text-text-secondary' />
					</button>
				</div>
				<div className='p-6'>
					<EmptyState
						title='Contract Not Found'
						description="The contract you're looking for doesn't exist or has been deleted."
					/>
				</div>
			</div>
		)
	}

	const contract = state.data

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'active':
				return 'success'
			case 'completed':
				return 'info'
			case 'cancelled':
				return 'danger'
			case 'draft':
				return 'warning'
			default:
				return 'neutral'
		}
	}

	const formatCurrency = (amount: number, currency: string) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency,
		}).format(amount)
	}

	return (
		<div className='max-h-[85vh] overflow-y-auto'>
			<div className='flex items-center justify-between border-b border-border-soft px-6 py-4'>
				<h2 className='text-lg font-bold text-text-primary'>
					Contract Details
				</h2>
				<div className='flex items-center gap-2'>
					<button
						onClick={() => onEdit?.(contract)}
						className='flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-subtle'
						title='Edit contract'
					>
						<FiEdit className='text-text-secondary' />
					</button>
					<button
						onClick={handleDelete}
						className='flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-500/10 hover:text-red-600'
						title='Delete contract'
					>
						<FiTrash2 className='text-text-secondary' />
					</button>
					<button
						onClick={onClose}
						className='flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-subtle'
					>
						<FiX className='text-text-secondary' />
					</button>
				</div>
			</div>

			<div className='p-6 space-y-6'>
				{/* Header */}
				<div className='flex items-start justify-between'>
					<div>
						<h3 className='text-xl font-bold text-text-primary'>
							{contract.title}
						</h3>
						<div className='mt-1'>
							<StatusBadge tone={getStatusColor(contract.status)}>
								{contract.status}
							</StatusBadge>
						</div>
					</div>
					<div className='text-right'>
						<div className='text-2xl font-bold text-text-primary'>
							{formatCurrency(contract.amount, contract.currency)}
						</div>
						<div className='text-sm text-text-secondary'>
							{contract.currency}
						</div>
					</div>
				</div>

				{/* Description */}
				{contract.description && (
					<PageCard>
						<h4 className='text-lg font-semibold text-text-primary mb-4'>
							Description
						</h4>
						<div className='text-sm text-text-primary whitespace-pre-wrap'>
							{contract.description}
						</div>
					</PageCard>
				)}

				{/* Client Information */}
				<PageCard>
					<h4 className='text-lg font-semibold text-text-primary mb-4'>
						Client Information
					</h4>
					<div className='flex items-center gap-3'>
						<FiUser className='text-text-secondary flex-shrink-0' />
						<div>
							<div className='text-sm font-medium text-text-primary'>
								{client?.name || 'Loading client...'}
							</div>
							{client?.email && (
								<div className='text-sm text-text-secondary'>
									{client.email}
								</div>
							)}
						</div>
					</div>
				</PageCard>

				{/* Contract Details */}
				<PageCard>
					<h4 className='text-lg font-semibold text-text-primary mb-4'>
						Contract Details
					</h4>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div className='flex items-center gap-3'>
							<FiCalendar className='text-text-secondary flex-shrink-0' />
							<div>
								<div className='text-sm font-medium text-text-primary'>
									Start Date
								</div>
								<div className='text-sm text-text-primary'>
									{new Date(contract.start_date).toLocaleDateString()}
								</div>
							</div>
						</div>

						{contract.end_date && (
							<div className='flex items-center gap-3'>
								<FiCalendar className='text-text-secondary flex-shrink-0' />
								<div>
									<div className='text-sm font-medium text-text-primary'>
										End Date
									</div>
									<div className='text-sm text-text-primary'>
										{new Date(contract.end_date).toLocaleDateString()}
									</div>
								</div>
							</div>
						)}

						<div className='flex items-center gap-3'>
							<FiDollarSign className='text-text-secondary flex-shrink-0' />
							<div>
								<div className='text-sm font-medium text-text-primary'>
									Amount
								</div>
								<div className='text-sm text-text-primary'>
									{formatCurrency(contract.amount, contract.currency)}
								</div>
							</div>
						</div>
					</div>
				</PageCard>

				{/* Terms & Conditions */}
				{contract.terms && (
					<PageCard title='Terms & Conditions'>
						<div className='text-sm text-text-primary whitespace-pre-wrap'>
							{contract.terms}
						</div>
					</PageCard>
				)}

				{/* Metadata */}
				<PageCard title='Additional Information'>
					<div className='grid grid-cols-2 gap-4 text-sm'>
						<div>
							<div className='font-medium text-text-secondary'>Created</div>
							<div className='text-text-primary'>
								{new Date(contract.created_at).toLocaleDateString()}
							</div>
						</div>
						<div>
							<div className='font-medium text-text-secondary'>
								Last Updated
							</div>
							<div className='text-text-primary'>
								{new Date(contract.updated_at).toLocaleDateString()}
							</div>
						</div>
					</div>
				</PageCard>
			</div>
		</div>
	)
}

