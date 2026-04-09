// @ts-nocheck

/**
 * ClientsDetailPanel - Read-only detail view for clients
 */

import { useEffect, useState } from 'react'
import {
	FiX,
	FiEdit,
	FiTrash2,
	FiMail,
	FiPhone,
	FiMapPin,
} from 'react-icons/fi'
import { useDetail } from '../../../components/hooks'
import {
	EmptyState,
	LoadingState,
	PageCard,
} from '../../../components/shared/page'
import { StatusBadge } from '../../../components/shared/data'
import { services } from '../../../services'
import type { Client } from '../../../services/contracts'

export interface ClientsDetailPanelProps {
	clientId: string
	onClose?: () => void
	onEdit?: (client: Client) => void
	onDelete?: (client: Client) => void
}

export function ClientsDetailPanel({
	clientId,
	onClose,
	onEdit,
	onDelete,
}: ClientsDetailPanelProps) {
	const [state, actions] = useDetail(
		() => services.clients.getClient(clientId),
		{ autoFetch: true },
	)

	const handleDelete = async () => {
		if (!state.data) return

		if (window.confirm('Are you sure you want to delete this client?')) {
			try {
				await services.clients.deleteClient(state.data.id)
				onDelete?.(state.data)
			} catch (error) {
				console.error('Error deleting client:', error)
			}
		}
	}

	if (state.isLoading) {
		return (
			<div className='max-h-[85vh] overflow-y-auto'>
				<div className='flex items-center justify-between border-b border-border-soft px-6 py-4'>
					<h2 className='text-lg font-bold text-text-primary'>
						Client Details
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
						Client Details
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
						title='Client Not Found'
						description="The client you're looking for doesn't exist or has been deleted."
					/>
				</div>
			</div>
		)
	}

	const client = state.data

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'active':
				return 'success'
			case 'inactive':
				return 'neutral'
			case 'archived':
				return 'warning'
			default:
				return 'neutral'
		}
	}

	return (
		<div className='max-h-[85vh] overflow-y-auto'>
			<div className='flex items-center justify-between border-b border-border-soft px-6 py-4'>
				<h2 className='text-lg font-bold text-text-primary'>Client Details</h2>
				<div className='flex items-center gap-2'>
					<button
						onClick={() => onEdit?.(client)}
						className='flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-subtle'
						title='Edit client'
					>
						<FiEdit className='text-text-secondary' />
					</button>
					<button
						onClick={handleDelete}
						className='flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-500/10 hover:text-red-600'
						title='Delete client'
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
							{client.name}
						</h3>
						<div className='mt-1'>
							<StatusBadge tone={getStatusColor(client.status)}>
								{client.status}
							</StatusBadge>
						</div>
					</div>
				</div>

				{/* Contact Information */}
				<PageCard>
					<h4 className='text-lg font-semibold text-text-primary mb-4'>
						Contact Information
					</h4>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						{client.email && (
							<div className='flex items-center gap-3'>
								<FiMail className='text-text-secondary flex-shrink-0' />
								<div>
									<div className='text-sm font-medium text-text-primary'>
										Email
									</div>
									<a
										href={`mailto:${client.email}`}
										className='text-sm text-primary hover:underline'
									>
										{client.email}
									</a>
								</div>
							</div>
						)}

						{client.phone && (
							<div className='flex items-center gap-3'>
								<FiPhone className='text-text-secondary flex-shrink-0' />
								<div>
									<div className='text-sm font-medium text-text-primary'>
										Phone
									</div>
									<a
										href={`tel:${client.phone}`}
										className='text-sm text-primary hover:underline'
									>
										{client.phone}
									</a>
								</div>
							</div>
						)}

						{client.city && (
							<div className='flex items-center gap-3'>
								<FiMapPin className='text-text-secondary flex-shrink-0' />
								<div>
									<div className='text-sm font-medium text-text-primary'>
										City
									</div>
									<div className='text-sm text-text-primary'>{client.city}</div>
								</div>
							</div>
						)}
					</div>
				</PageCard>

				{/* Notes */}
				{client.metadata && (
					<PageCard>
						<h4 className='text-lg font-semibold text-text-primary mb-4'>
							Additional Information
						</h4>
						<div className='text-sm text-text-primary whitespace-pre-wrap'>
							{JSON.stringify(client.metadata, null, 2)}
						</div>
					</PageCard>
				)}

				{/* Metadata */}
				<PageCard>
					<h4 className='text-lg font-semibold text-text-primary mb-4'>
						Additional Information
					</h4>
					<div className='grid grid-cols-2 gap-4 text-sm'>
						<div>
							<div className='font-medium text-text-secondary'>Created</div>
							<div className='text-text-primary'>
								{new Date(client.created_at).toLocaleDateString()}
							</div>
						</div>
						<div>
							<div className='font-medium text-text-secondary'>
								Last Updated
							</div>
							<div className='text-text-primary'>
								{new Date(client.updated_at).toLocaleDateString()}
							</div>
						</div>
					</div>
				</PageCard>
			</div>
		</div>
	)
}

