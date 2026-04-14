import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { FilterSelect } from '../../../components/shared/data'
import AppIcon from '../../../components/shared/icons/AppIcon'
import { services } from '../../../services'
import type {
	AuditRequest,
	CreateAuditRequestInput,
	UpdateAuditRequestInput,
} from '../../../services/contracts'

interface AuditRequestsFormPanelProps {
	auditRequest?: AuditRequest
	onClose?: () => void
	onSuccess?: (auditRequest: AuditRequest) => void
}

type AuditRequestFormState = {
	client: string
	contract: string
	requested_power_kw: number | ''
	status: AuditRequest['status']
	contact_phone: string
	site_address: string
	notes: string
	conclusion: string
}

interface ClientOptionSource {
	id: string
	full_name: string
}

interface ContractOptionSource {
	id: string
	title: string
	client?: string
	client_name?: string
}

const inputClassName = [
	'w-full rounded-lg border border-border-soft/60 bg-surface-card px-3.5 py-2.5 text-sm font-medium text-text-primary',
	'placeholder:text-text-muted outline-none transition duration-fast',
	'focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
	'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ')

const labelClassName =
	'text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted'

function toInitialState(auditRequest?: AuditRequest): AuditRequestFormState {
	return {
		client: auditRequest?.client ?? '',
		contract: auditRequest?.contract ?? '',
		requested_power_kw:
			typeof auditRequest?.requested_power_kw === 'number'
				? auditRequest.requested_power_kw
				: '',
		status: auditRequest?.status ?? 'new',
		contact_phone: auditRequest?.contact_phone ?? '',
		site_address: auditRequest?.site_address ?? '',
		notes: auditRequest?.notes ?? '',
		conclusion: auditRequest?.conclusion ?? '',
	}
}

export function AuditRequestsFormPanel({
	auditRequest,
	onClose,
	onSuccess,
}: AuditRequestsFormPanelProps) {
	const { t } = useTranslation()
	const isEditing = Boolean(auditRequest)
	const [form, setForm] = useState<AuditRequestFormState>(() =>
		toInitialState(auditRequest),
	)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [clients, setClients] = useState<ClientOptionSource[]>([])
	const [contracts, setContracts] = useState<ContractOptionSource[]>([])
	const [isLoadingReferences, setIsLoadingReferences] = useState(true)
	const canSubmit = Boolean(
		form.client &&
			form.contract &&
			form.requested_power_kw !== '',
	)

	const statusOptions = useMemo(
		() => [
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

	useEffect(() => {
		let isActive = true

		void (async () => {
			setIsLoadingReferences(true)
			try {
				const [clientsResponse, contractsResponse] = await Promise.all([
					services.clients.listClients({ page: 1, page_size: 300, ordering: 'full_name' }),
					services.contracts.listContracts({ page: 1, page_size: 300, ordering: 'title' }),
				])

				if (!isActive) {
					return
				}

				setClients(
					clientsResponse.items.map((client: ClientOptionSource) => ({
						id: client.id,
						full_name: client.full_name,
					})),
				)
				setContracts(
					contractsResponse.items.map((contract: ContractOptionSource) => ({
						id: contract.id,
						title: contract.title,
						client: contract.client,
						client_name: contract.client_name,
					})),
				)
			} catch {
				if (!isActive) {
					return
				}

				setClients([])
				setContracts([])
			} finally {
				if (isActive) {
					setIsLoadingReferences(false)
				}
			}
		})()

		return () => {
			isActive = false
		}
	}, [])

	const clientOptions = useMemo(() => {
		const options = clients.map(client => ({
			value: client.id,
			label: client.full_name,
		}))

		if (form.client && !options.some(option => option.value === form.client)) {
			options.unshift({
				value: form.client,
				label: auditRequest?.client_name || form.client,
			})
		}

		return [{ value: '', label: t('shared.filterSelect.select') }, ...options]
	}, [auditRequest?.client_name, clients, form.client, t])

	const contractOptions = useMemo(() => {
		const base = contracts
			.filter(contract => !form.client || !contract.client || contract.client === form.client)
			.map(contract => ({
				value: contract.id,
				label: contract.client_name
					? `${contract.title} - ${contract.client_name}`
					: contract.title,
			}))

		if (form.contract && !base.some(option => option.value === form.contract)) {
			base.unshift({
				value: form.contract,
				label: auditRequest?.contract_title || form.contract,
			})
		}

		return [{ value: '', label: t('shared.filterSelect.select') }, ...base]
	}, [auditRequest?.contract_title, contracts, form.client, form.contract, t])

	function updateField<Key extends keyof AuditRequestFormState>(
		key: Key,
		value: AuditRequestFormState[Key],
	) {
		setForm(current => ({ ...current, [key]: value }))
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setErrorMessage(null)

		if (!form.client || !form.contract || form.requested_power_kw === '') {
			setErrorMessage(t('auditRequests.form.requiredError'))
			return
		}

		const payload: CreateAuditRequestInput | UpdateAuditRequestInput = {
			client: form.client,
			contract: form.contract,
			requested_power_kw: Number(form.requested_power_kw),
			status: form.status,
			contact_phone: form.contact_phone || undefined,
			site_address: form.site_address || undefined,
			notes: form.notes || undefined,
			conclusion: form.conclusion || undefined,
		}

		setIsSubmitting(true)
		try {
			const saved = isEditing
				? await services.auditRequests.updateAuditRequest(
						auditRequest!.id,
						payload as UpdateAuditRequestInput,
					)
				: await services.auditRequests.createAuditRequest(
						payload as CreateAuditRequestInput,
					)
			onSuccess?.(saved)
		} catch {
			setErrorMessage(t('auditRequests.form.saveError'))
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className='grid gap-3'>
			<header className='mb-1 rounded-xl bg-surface-card p-4 shadow-sm ring-1 ring-border-soft/40'>
				<div className='flex items-start justify-between gap-3'>
					<div className='min-w-0'>
						<p className='m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary'>
							{t('auditRequests.form.eyebrow')}
						</p>
						<h2 className='mt-1 font-display text-[1.45rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-text-primary'>
							{isEditing
								? t('auditRequests.form.editTitle')
								: t('auditRequests.form.createTitle')}
						</h2>
					</div>
					<button
						type='button'
						className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-primary shadow-sm transition duration-fast hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-60'
						onClick={onClose}
						disabled={isSubmitting}
						aria-label={t('auditRequests.form.close')}
					>
						<AppIcon name='close' className='h-4.5 w-4.5' aria-hidden='true' />
					</button>
				</div>
			</header>

			<form className='grid gap-3' onSubmit={handleSubmit} noValidate>
				<div className='grid gap-3 sm:grid-cols-3'>
					<div className='grid gap-1.5 sm:col-span-2'>
						<label className={labelClassName}>{t('auditRequests.fields.contract')}</label>
						<FilterSelect
							value={form.contract}
							options={contractOptions}
							onChange={value => updateField('contract', value)}
							disabled={isSubmitting || isLoadingReferences}
						/>
					</div>
					<div className='grid gap-1.5 sm:col-span-1'>
						<label className={labelClassName}>{t('auditRequests.fields.client')}</label>
						<FilterSelect
							value={form.client}
							options={clientOptions}
							onChange={value => {
								updateField('client', value)
								if (form.contract) {
									updateField('contract', '')
								}
							}}
							disabled={isSubmitting || isLoadingReferences}
						/>
					</div>
					<div className='grid gap-1.5'>
						<label className={labelClassName}>{t('auditRequests.fields.requestedPower')}</label>
						<input
							type='number'
							min={1}
							className={inputClassName}
							value={form.requested_power_kw}
							onChange={event =>
								updateField(
									'requested_power_kw',
									event.target.value === '' ? '' : Number(event.target.value),
								)
							}
							disabled={isSubmitting}
						/>
					</div>
					<div className='grid gap-1.5'>
						<label className={labelClassName}>{t('auditRequests.fields.status')}</label>
						<FilterSelect
							value={form.status}
							options={statusOptions}
							onChange={value =>
								updateField('status', value as AuditRequest['status'])
							}
							disabled={isSubmitting}
						/>
					</div>
					<div className='grid gap-1.5'>
						<label className={labelClassName}>{t('auditRequests.fields.contactPhone')}</label>
						<input
							className={inputClassName}
							value={form.contact_phone}
							onChange={event => updateField('contact_phone', event.target.value)}
							disabled={isSubmitting}
						/>
					</div>
					<div className='grid gap-1.5'>
						<label className={labelClassName}>{t('auditRequests.fields.siteAddress')}</label>
						<textarea
							className={`${inputClassName} min-h-[86px] resize-y`}
							value={form.site_address}
							onChange={event => updateField('site_address', event.target.value)}
							disabled={isSubmitting}
						/>
					</div>
					<div className='grid gap-1.5 sm:col-span-2'>
						<label className={labelClassName}>{t('auditRequests.fields.notes')}</label>
						<textarea
							className={`${inputClassName} min-h-[86px] resize-y`}
							value={form.notes}
							onChange={event => updateField('notes', event.target.value)}
							disabled={isSubmitting}
						/>
					</div>
					<div className='grid gap-1.5 sm:col-span-2'>
						<label className={labelClassName}>{t('auditRequests.fields.conclusion')}</label>
						<textarea
							className={`${inputClassName} min-h-[86px] resize-y`}
							value={form.conclusion}
							onChange={event => updateField('conclusion', event.target.value)}
							disabled={isSubmitting}
						/>
					</div>
				</div>

				{errorMessage ? (
					<p className='m-0 rounded-lg bg-danger-bg px-3 py-2 text-sm font-medium text-danger'>
						{errorMessage}
					</p>
				) : null}

				<div className='mt-1 flex flex-wrap items-center gap-2'>
					<button
						type='button'
						className='inline-flex min-h-10 items-center justify-center rounded-lg bg-surface-card px-4 text-sm font-semibold text-text-secondary shadow-sm ring-1 ring-border-soft/40 transition duration-fast hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60'
						onClick={onClose}
						disabled={isSubmitting}
					>
						{t('common.cancel')}
					</button>
					<button
						type='submit'
						className='ml-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition duration-fast hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:cursor-not-allowed disabled:opacity-60'
						disabled={isSubmitting || !canSubmit}
					>
						{isSubmitting
							? t('auditRequests.form.saving')
							: isEditing
								? t('auditRequests.form.editSubmit')
								: t('auditRequests.form.createSubmit')}
					</button>
				</div>
			</form>
		</div>
	)
}
