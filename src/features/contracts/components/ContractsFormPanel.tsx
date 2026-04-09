// @ts-nocheck

/**
 * ContractsFormPanel - Form for creating/editing contracts
 */

import { useState, useEffect } from 'react'
import { FiX } from 'react-icons/fi'
import { useForm } from '../../../components/hooks'
import { useMutation } from '../../../components/hooks'
import { Form, FormField } from '../../../components/ui/forms'
import { services } from '../../../services'
import type {
	Contract,
	CreateContractInput,
	UpdateContractInput,
	Client,
} from '../../../services/contracts'

export interface ContractsFormPanelProps {
	contract?: Contract
	onClose?: () => void
	onSuccess?: (contract: Contract) => void
}

const validateContract = (
	values: CreateContractInput & { title?: string },
): Partial<Record<string, string>> => {
	const errors: Partial<Record<string, string>> = {}

	if (!values.title?.trim()) {
		errors.title = 'Title is required'
	}

	if (!values.client_id) {
		errors.client_id = 'Client is required'
	}

	if (!values.amount || values.amount <= 0) {
		errors.amount = 'Amount must be greater than 0'
	}

	if (!values.start_date) {
		errors.start_date = 'Start date is required'
	}

	return errors
}

export function ContractsFormPanel({
	contract,
	onClose,
	onSuccess,
}: ContractsFormPanelProps) {
	const isEditing = !!contract

	const [clients, setClients] = useState<Client[]>([])
	const [loadingClients, setLoadingClients] = useState(true)

	useEffect(() => {
		const loadClients = async () => {
			try {
				const result = await services.clients.listClients({ page_size: 100 })
				setClients(result.items)
			} catch (error) {
				console.error('Error loading clients:', error)
			} finally {
				setLoadingClients(false)
			}
		}

		loadClients()
	}, [])

	const [form, formActions] = useForm<CreateContractInput & { title?: string }>(
		{
			initialValues: {
				title: contract?.title || '',
				description: contract?.description || '',
				client_id: contract?.client_id || '',
				amount: contract?.amount || 0,
				currency: contract?.currency || 'USD',
				start_date: contract?.start_date || '',
				end_date: contract?.end_date || '',
				status: contract?.status || 'draft',
				terms: contract?.terms || '',
			},
			validate: validateContract,
		},
	)

	const [createState, createActions] = useMutation(
		(input: CreateContractInput) => services.contracts.createContract(input),
	)

	const [updateState, updateActions] = useMutation(
		(input: UpdateContractInput) =>
			services.contracts.updateContract(contract!.id, input),
	)

	const isLoading = createState.isLoading || updateState.isLoading

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		if (!form.isValid) {
			return
		}

		try {
			let result: Contract | null = null

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

	const clientOptions = clients.map(client => ({
		label: client.name,
		value: client.id,
	}))

	return (
		<div className='max-h-[85vh] overflow-y-auto'>
			<div className='flex items-center justify-between border-b border-border-soft px-6 py-4'>
				<h2 className='text-lg font-bold text-text-primary'>
					{isEditing ? 'Edit Contract' : 'New Contract'}
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
					submitLabel={isEditing ? 'Update Contract' : 'Create Contract'}
					onCancel={onClose}
					layout='grid'
					columns={2}
				>
					<FormField
						name='title'
						label='Title'
						placeholder='Enter contract title'
						value={form.values.title}
						error={form.errors.title}
						touched={form.touched.title}
						required
						onChange={formActions.handleChange}
						onBlur={formActions.handleBlur}
					/>

					<FormField
						name='client_id'
						label='Client'
						placeholder={
							loadingClients ? 'Loading clients...' : 'Select client'
						}
						value={form.values.client_id}
						error={form.errors.client_id}
						touched={form.touched.client_id}
						as='select'
						options={clientOptions}
						required
						disabled={loadingClients}
						onChange={formActions.handleChange}
						onBlur={formActions.handleBlur}
					/>

					<FormField
						name='amount'
						label='Amount'
						type='number'
						step='0.01'
						min='0'
						placeholder='0.00'
						value={form.values.amount}
						error={form.errors.amount}
						touched={form.touched.amount}
						required
						onChange={formActions.handleChange}
						onBlur={formActions.handleBlur}
					/>

					<FormField
						name='currency'
						label='Currency'
						placeholder='Select currency'
						value={form.values.currency}
						error={form.errors.currency}
						touched={form.touched.currency}
						as='select'
						options={[
							{ label: 'USD', value: 'USD' },
							{ label: 'EUR', value: 'EUR' },
							{ label: 'UZS', value: 'UZS' },
							{ label: 'RUB', value: 'RUB' },
						]}
						onChange={formActions.handleChange}
						onBlur={formActions.handleBlur}
					/>

					<FormField
						name='start_date'
						label='Start Date'
						type='date'
						value={form.values.start_date}
						error={form.errors.start_date}
						touched={form.touched.start_date}
						required
						onChange={formActions.handleChange}
						onBlur={formActions.handleBlur}
					/>

					<FormField
						name='end_date'
						label='End Date'
						type='date'
						value={form.values.end_date}
						error={form.errors.end_date}
						touched={form.touched.end_date}
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
							{ label: 'Draft', value: 'draft' },
							{ label: 'Active', value: 'active' },
							{ label: 'Completed', value: 'completed' },
							{ label: 'Cancelled', value: 'cancelled' },
						]}
						onChange={formActions.handleChange}
						onBlur={formActions.handleBlur}
					/>

					<div className='col-span-2'>
						<FormField
							name='description'
							label='Description'
							placeholder='Enter contract description'
							value={form.values.description}
							error={form.errors.description}
							touched={form.touched.description}
							as='textarea'
							rows={3}
							multiline
							onChange={formActions.handleChange}
							onBlur={formActions.handleBlur}
						/>
					</div>

					<div className='col-span-2'>
						<FormField
							name='terms'
							label='Terms & Conditions'
							placeholder='Enter contract terms'
							value={form.values.terms}
							error={form.errors.terms}
							touched={form.touched.terms}
							as='textarea'
							rows={4}
							multiline
							onChange={formActions.handleChange}
							onBlur={formActions.handleBlur}
						/>
					</div>
				</Form>
			</div>
		</div>
	)
}

