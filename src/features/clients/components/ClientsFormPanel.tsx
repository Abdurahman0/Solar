/**
 * ClientsFormPanel - Form for creating/editing clients
 */

import { useState } from 'react'
import { FiX } from 'react-icons/fi'
import { useForm } from '../../../components/hooks'
import { useMutation } from '../../../components/hooks'
import { Form, FormField } from '../../../components/ui/forms'
import { services } from '../../../services'
import type {
	Client,
	CreateClientInput,
	UpdateClientInput,
} from '../../../services/contracts'

export interface ClientsFormPanelProps {
	client?: Client
	onClose?: () => void
	onSuccess?: (client: Client) => void
}

const validateClient = (
	values: CreateClientInput & { name?: string },
): Partial<Record<string, string>> => {
	const errors: Partial<Record<string, string>> = {}

	if (!values.name?.trim()) {
		errors.name = 'Name is required'
	}

	if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
		errors.email = 'Invalid email address'
	}

	return errors
}

export function ClientsFormPanel({
	client,
	onClose,
	onSuccess,
}: ClientsFormPanelProps) {
	const isEditing = !!client

	const [form, formActions] = useForm<CreateClientInput & { name?: string }>({
		initialValues: {
			name: client?.name || '',
			email: client?.email || '',
			phone: client?.phone || '',
			city: client?.city || '',
			status: client?.status || 'active',
		},
		validate: validateClient,
	})

	const [createState, createActions] = useMutation((input: CreateClientInput) =>
		services.clients.createClient(input),
	)

	const [updateState, updateActions] = useMutation((input: UpdateClientInput) =>
		services.clients.updateClient(client!.id, input),
	)

	const isLoading = createState.isLoading || updateState.isLoading

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		if (!form.isValid) {
			return
		}

		try {
			let result: Client | null = null

			if (isEditing) {
				result = await updateActions.mutate(form.values)
			} else {
				result = await createActions.mutate(form.values)
			}

			if (result) {
				onSuccess?.(result)
				formActions.reset()
			}
		} catch (error) {
			console.error('Error submitting form:', error)
		}
	}

	const errorMessage = createState.error?.message || updateState.error?.message

	return (
		<div className='max-h-[85vh] overflow-y-auto'>
			<div className='flex items-center justify-between border-b border-border-soft px-6 py-4'>
				<h2 className='text-lg font-bold text-text-primary'>
					{isEditing ? 'Edit Client' : 'New Client'}
				</h2>
				<button
					onClick={onClose}
					className='flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-subtle'
				>
					<FiX className='text-text-secondary' />
				</button>
			</div>

			<div className='px-6 py-4'>
				{errorMessage && (
					<div className='mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600'>
						{errorMessage}
					</div>
				)}

				<Form
					onSubmit={handleSubmit}
					isSubmitting={isLoading}
					submitLabel={isEditing ? 'Update Client' : 'Create Client'}
					onCancel={onClose}
					layout='grid'
					columns={2}
				>
					<FormField
						name='name'
						label='Name'
						placeholder='Enter client name'
						value={form.values.name}
						error={form.errors.name}
						touched={form.touched.name}
						required
						onChange={formActions.handleChange}
						onBlur={formActions.handleBlur}
					/>

					<FormField
						name='email'
						label='Email'
						type='email'
						placeholder='Enter email address'
						value={form.values.email}
						error={form.errors.email}
						touched={form.touched.email}
						onChange={formActions.handleChange}
						onBlur={formActions.handleBlur}
					/>

					<FormField
						name='phone'
						label='Phone'
						type='tel'
						placeholder='Enter phone number'
						value={form.values.phone}
						error={form.errors.phone}
						touched={form.touched.phone}
						onChange={formActions.handleChange}
						onBlur={formActions.handleBlur}
					/>

					<FormField
						name='city'
						label='City'
						placeholder='Enter city'
						value={form.values.city}
						error={form.errors.city}
						touched={form.touched.city}
						onChange={formActions.handleChange}
						onBlur={formActions.handleBlur}
					/>

					<FormField
						name='status'
						label='Status'
						placeholder='Select status'
						value={form.values.status}
						error={form.errors.status}
						touched={form.touched.status}
						as='select'
						options={[
							{ label: 'Active', value: 'active' },
							{ label: 'Inactive', value: 'inactive' },
							{ label: 'Archived', value: 'archived' },
						]}
						onChange={formActions.handleChange}
						onBlur={formActions.handleBlur}
					/>
				</Form>
			</div>
		</div>
	)
}
