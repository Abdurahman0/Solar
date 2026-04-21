import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import AppIcon from '../../../components/shared/icons/AppIcon'
import { FilterSelect, Switch } from '../../../components/shared/data'
import { services } from '../../../services'
import type {
	Contract,
	CreateContractInput,
	UpdateContractInput,
} from '../../../services/contracts'

export interface ContractsFormPanelProps {
	contract?: Contract
	onClose?: () => void
	onSuccess?: (contract: Contract) => void
}

type ContractFormState = {
	client: string
	title: string
	status: Contract['status']
	panel_type: Contract['panel_type']
	inverter_type: Contract['inverter_type']
	requested_power_kw: number | ''
	audit_power_kw: number | ''
	audit_conclusion_kw: number | ''
	eligible_subsidy_kw: number | ''
	estimated_subsidy_amount: string
	subsidy_percent: string
	customer_phone: string
	installation_address: string
	delivery_status: string
	delivery_notes: string
	details: string
	items: Array<{ product: string; quantity: number | ''; unit_price: string }>
	file: File | null
	cadastre_file: File | null
	house_image: File | null
}

const inputClassName = [
	'w-full rounded-lg border border-border-soft/60 bg-surface-card px-3.5 py-2.5 text-sm font-medium text-text-primary',
	'placeholder:text-text-muted outline-none transition duration-fast',
	'focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
	'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ')

const labelClassName =
	'text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted'

function isImageUrl(url: string): boolean {
	if (!url) {
		return false
	}

	try {
		const { pathname } = new URL(url)
		const ext = pathname.split('.').pop()?.toLowerCase() ?? ''
		return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(ext)
	} catch {
		return false
	}
}

function getAttachmentFilename(url: string): string {
	if (!url) {
		return '-'
	}

	try {
		const { pathname } = new URL(url)
		const raw = pathname.split('/').filter(Boolean).pop() ?? ''
		return decodeURIComponent(raw) || url
	} catch {
		const fallback = url.split('?')[0] ?? url
		const raw = fallback.split('/').filter(Boolean).pop() ?? ''
		return raw || url
	}
}

interface FilePickerFieldProps {
	id: string
	label: string
	value: File | null
	chooseLabel: string
	emptyLabel: string
	accept?: string
	disabled?: boolean
	onChange: (file: File | null) => void
}

function FilePickerField({
	id,
	label,
	value,
	chooseLabel,
	emptyLabel,
	accept,
	disabled,
	onChange,
}: FilePickerFieldProps) {
	return (
		<div className='grid gap-1.5'>
			<label className={labelClassName} htmlFor={id}>
				{label}
			</label>
			<label
				htmlFor={id}
				className={[
					'flex min-h-[46px] items-center justify-between gap-3 rounded-lg border border-border-soft/60 bg-surface-card px-3.5 py-2.5',
					disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
				].join(' ')}
				onClick={event => {
					if (disabled) {
						event.preventDefault()
					}
				}}
			>
				<span className='min-w-0 truncate text-sm font-medium text-text-secondary'>
					{value?.name || emptyLabel}
				</span>
				<span className='inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-surface-subtle px-3 text-xs font-semibold text-text-primary transition duration-fast hover:bg-surface-muted'>
					{chooseLabel}
				</span>
				<input
					id={id}
					type='file'
					accept={accept}
					className='sr-only'
					onChange={event => onChange(event.target.files?.[0] ?? null)}
					disabled={disabled}
				/>
			</label>
		</div>
	)
}

function ExistingAttachment({
	label,
	url,
	openLabel,
}: {
	label: string
	url: string
	openLabel: string
}) {
	const previewable = isImageUrl(url)

	return (
		<div className='mt-2 rounded-xl bg-surface-subtle/60 p-3 ring-1 ring-border-soft/25'>
			<div className='flex items-start justify-between gap-3'>
				<div className='min-w-0'>
					<p className={labelClassName}>{label}</p>
					<p className='mt-1 truncate text-sm font-semibold text-text-primary'>
						{getAttachmentFilename(url)}
					</p>
				</div>
				<a
					className='inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-surface-card px-3 text-sm font-semibold text-text-primary shadow-sm ring-1 ring-border-soft/35 transition duration-fast hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20'
					href={url}
					target='_blank'
					rel='noreferrer'
				>
					<AppIcon
						name={previewable ? 'search' : 'download'}
						className='h-4 w-4'
						aria-hidden='true'
					/>
					{openLabel}
				</a>
			</div>

			{previewable ? (
				<a
					href={url}
					target='_blank'
					rel='noreferrer'
					className='mt-3 block overflow-hidden rounded-lg ring-1 ring-border-soft/35'
				>
					<img
						src={url}
						alt={label}
						loading='lazy'
						className='h-44 w-full bg-surface-card object-cover'
					/>
				</a>
			) : null}
		</div>
	)
}

function extractDetails(details: Contract['details']): string {
	if (!details) {
		return ''
	}
	if (typeof details === 'string') {
		return details
	}
	try {
		return JSON.stringify(details, null, 2)
	} catch {
		return String(details)
	}
}

function toInitialState(contract?: Contract): ContractFormState {
	return {
		client: contract?.client ?? '',
		title: contract?.title ?? '',
		status: contract?.status ?? 'draft',
		panel_type: contract?.panel_type ?? '',
		inverter_type: contract?.inverter_type ?? '',
		requested_power_kw:
			typeof contract?.requested_power_kw === 'number'
				? contract.requested_power_kw
				: '',
		audit_power_kw:
			typeof contract?.audit_power_kw === 'number'
				? contract.audit_power_kw
				: '',
		audit_conclusion_kw:
			typeof contract?.audit_conclusion_kw === 'number'
				? contract.audit_conclusion_kw
				: '',
		eligible_subsidy_kw:
			typeof contract?.eligible_subsidy_kw === 'number'
				? contract.eligible_subsidy_kw
				: '',
		estimated_subsidy_amount: String(contract?.estimated_subsidy_amount ?? ''),
		subsidy_percent: String(contract?.subsidy_percent ?? ''),
		customer_phone: contract?.customer_phone ?? '',
		installation_address: contract?.installation_address ?? '',
		delivery_status: contract?.delivery_status ?? 'pending',
		delivery_notes: contract?.delivery_notes ?? '',
		details: extractDetails(contract?.details),
		items:
			contract?.items?.length
				? contract.items.map(item => ({
						product: item.product,
						quantity: item.quantity,
						unit_price: String(item.unit_price ?? ''),
					}))
				: [{ product: '', quantity: 1, unit_price: '' }],
		file: null,
		cadastre_file: null,
		house_image: null,
	}
}

export function ContractsFormPanel({
	contract,
	onClose,
	onSuccess,
}: ContractsFormPanelProps) {
	const { t, i18n } = useTranslation()
	const isRu = i18n.language === 'ru'
	const isEditing = Boolean(contract)

	const tx = isRu
		? {
				form: 'Форма договора',
				createTitle: 'Новый договор',
				editTitle: 'Редактирование договора',
				requiredError: 'Заполните обязательные поля: клиент и название.',
				detailsJsonError: 'Поле "Детали" должно быть валидным JSON объектом.',
				saveError: 'Не удалось сохранить договор.',
				saving: 'Сохранение...',
				createSubmit: 'Создать договор',
				editSubmit: 'Сохранить изменения',
				cancel: 'Отмена',
				close: 'Закрыть',
				chooseFile: 'Выбрать файл',
				noFile: 'Файл не выбран',
				currentFile: 'Текущий файл',
				open: 'Открыть',
				addItem: 'Добавить позицию',
				removeItem: 'Удалить',
				labels: {
					client: 'Клиент',
					title: 'Название',
					status: 'Статус',
					panelType: 'Тип панели',
					inverterType: 'Тип инвертора',
					requestedPower: 'Запрошенная мощность (кВт)',
					auditPower: 'Аудит мощность (кВт)',
					auditConclusionPower: 'Мощность по аудиту (кВт)',
					eligibleSubsidyPower: 'Субсидируемая мощность (кВт)',
					estimatedSubsidyAmount: 'Оценочная сумма субсидии',
					subsidyPercent: 'Субсидия (%)',
					customerPhone: 'Телефон клиента',
					address: 'Адрес установки',
					deliveryStatus: 'Статус доставки',
					deliveryNotes: 'Примечание доставки',
					details: 'Детали',
					file: 'Файл договора',
					cadastreFile: 'Кадастр файл',
					houseImage: 'Фото дома',
					items: 'Позиции договора',
					quantity: 'Количество',
					unitPrice: 'Цена',
				},
			}
		: {
				form: 'Shartnoma formasi',
				createTitle: 'Yangi shartnoma',
				editTitle: 'Shartnomani tahrirlash',
				requiredError: 'Majburiy maydonlarni to\'ldiring: mijoz va nom.',
				detailsJsonError:
					'"Tafsilotlar" maydoni yaroqli JSON obyekt bo\'lishi kerak.',
				saveError: 'Shartnomani saqlab bo\'lmadi.',
				saving: 'Saqlanmoqda...',
				createSubmit: 'Shartnoma yaratish',
				editSubmit: "O'zgarishlarni saqlash",
				cancel: 'Bekor qilish',
				close: 'Yopish',
				chooseFile: 'Fayl tanlash',
				noFile: 'Fayl tanlanmagan',
				currentFile: 'Hozirgi fayl',
				open: "Ko'rish",
				addItem: 'Pozitsiya qo\'shish',
				removeItem: 'Olib tashlash',
				labels: {
					client: 'Mijoz',
					title: 'Nomi',
					status: 'Holat',
					panelType: 'Panel turi',
					inverterType: 'Invertor turi',
					requestedPower: 'So\'ralgan quvvat (kW)',
					auditPower: 'Audit quvvati (kW)',
					auditConclusionPower: 'Audit xulosasi quvvati (kW)',
					eligibleSubsidyPower: 'Subsidiya uchun quvvat (kW)',
					estimatedSubsidyAmount: 'Taxminiy subsidiya summasi',
					subsidyPercent: 'Subsidiya (%)',
					customerPhone: 'Mijoz telefoni',
					address: "O'rnatish manzili",
					deliveryStatus: 'Yetkazib berish holati',
					deliveryNotes: 'Yetkazish izohi',
					details: 'Tafsilotlar',
					file: 'Shartnoma fayli',
					cadastreFile: 'Kadastr fayli',
					houseImage: 'Uy rasmi',
					items: 'Shartnoma pozitsiyalari',
					quantity: 'Soni',
					unitPrice: 'Narx',
				},
			}

	const [form, setForm] = useState<ContractFormState>(() => toInitialState(contract))
	const [isNewClient, setIsNewClient] = useState(false)
	const [newClientName, setNewClientName] = useState('')
	const [newClientPhone, setNewClientPhone] = useState('')
	const existingContractFileUrl =
		contract?.file_url || (typeof contract?.file === 'string' ? contract.file : '') || ''
	const existingCadastreFileUrl =
		contract?.cadastre_file_url ||
		(typeof contract?.cadastre_file === 'string' ? contract.cadastre_file : '') ||
		''
	const existingHouseImageUrl =
		contract?.house_image_url ||
		(typeof contract?.house_image === 'string' ? contract.house_image : '') ||
		''
	const [clients, setClients] = useState<Array<{ id: string; full_name: string }>>(
		[],
	)
	const [products, setProducts] = useState<Array<{ id: string; name: string }>>([])
	const [isLoadingReferences, setIsLoadingReferences] = useState(true)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const hasSubsidyPercent = form.subsidy_percent.trim().length > 0
	const canSubmit = isEditing
		? Boolean(form.client && form.title.trim().length > 0 && hasSubsidyPercent)
		: isNewClient
			? Boolean(
					newClientName.trim().length > 0 &&
						newClientPhone.trim().length > 0 &&
						form.title.trim().length > 0 &&
						hasSubsidyPercent,
				)
			: Boolean(form.client && form.title.trim().length > 0 && hasSubsidyPercent)

	useEffect(() => {
		if (isEditing) {
			setIsNewClient(false)
		}
	}, [isEditing])

	useEffect(() => {
		let isActive = true
		void (async () => {
			try {
				const [clientsResponse, productsResponse] = await Promise.all([
					services.clients.listClients({ page: 1, page_size: 150, ordering: 'full_name' }),
					services.products.listProducts({ page: 1, page_size: 150, ordering: 'name' }),
				])
				if (!isActive) {
					return
				}
				setClients(
					clientsResponse.items.map((client: { id: string; full_name: string }) => ({
						id: client.id,
						full_name: client.full_name,
					})),
				)
				setProducts(
					productsResponse.items.map((product: { id: string; name: string }) => ({
						id: product.id,
						name: product.name,
					})),
				)
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

	useEffect(() => {
		if (!form.client || isNewClient) {
			return
		}

		const needsAuditFallback =
			form.audit_conclusion_kw === '' ||
			form.eligible_subsidy_kw === '' ||
			form.estimated_subsidy_amount.trim().length === 0

		if (!needsAuditFallback) {
			return
		}

		let isActive = true
		const selectedClientId = form.client

		void (async () => {
			try {
				const client = await services.clients.getClient(selectedClientId)
				if (!isActive) {
					return
				}

				setForm(current => {
					if (current.client !== selectedClientId) {
						return current
					}

					let didChange = false
					const next = { ...current }

					if (
						next.audit_conclusion_kw === '' &&
						typeof client.audit_conclusion_kw === 'number'
					) {
						next.audit_conclusion_kw = client.audit_conclusion_kw
						didChange = true
					}

					if (
						next.eligible_subsidy_kw === '' &&
						typeof client.eligible_subsidy_kw === 'number'
					) {
						next.eligible_subsidy_kw = client.eligible_subsidy_kw
						didChange = true
					}

					if (
						next.estimated_subsidy_amount.trim().length === 0 &&
						client.estimated_subsidy_amount != null
					) {
						next.estimated_subsidy_amount = String(client.estimated_subsidy_amount)
						didChange = true
					}

					return didChange ? next : current
				})
			} catch {
				// Keep form usable even when client lookup fails.
			}
		})()

		return () => {
			isActive = false
		}
	}, [
		form.client,
		form.audit_conclusion_kw,
		form.eligible_subsidy_kw,
		form.estimated_subsidy_amount,
		isNewClient,
	])

	const statusOptions = useMemo(
		() => [
			{ value: 'draft', label: isRu ? 'Черновик' : 'Qoralama' },
			{ value: 'audit_pending', label: isRu ? 'Audit kutilmoqda' : 'Audit kutilmoqda' },
			{ value: 'audit_paid', label: isRu ? 'Audit to\'langan' : 'Audit to\'langan' },
			{ value: 'moderation', label: isRu ? 'Модерация' : 'Moderatsiya' },
			{ value: 'contract_ready', label: isRu ? 'Договор tayyor' : 'Shartnoma tayyor' },
			{ value: 'payment_pending', label: isRu ? 'To\'lov kutilmoqda' : 'To\'lov kutilmoqda' },
			{ value: 'paid', label: isRu ? 'Оплачен' : 'To\'langan' },
			{ value: 'delivered', label: isRu ? 'Доставлен' : 'Yetkazilgan' },
			{ value: 'sent', label: isRu ? 'Отправлен' : 'Yuborilgan' },
			{ value: 'signed', label: isRu ? 'Подписан' : 'Imzolangan' },
			{ value: 'canceled', label: isRu ? 'Отменен' : 'Bekor qilingan' },
		],
		[isRu],
	)

	const deliveryStatusOptions = useMemo(
		() => [
			{ value: 'pending', label: isRu ? 'Ожидается' : 'Kutilmoqda' },
			{ value: 'in_progress', label: isRu ? 'В процессе' : 'Jarayonda' },
			{ value: 'delivered', label: isRu ? 'Доставлен' : 'Yetkazilgan' },
			{ value: 'canceled', label: isRu ? 'Отменен' : 'Bekor qilingan' },
		],
		[isRu],
	)

	function updateField<Key extends keyof ContractFormState>(
		key: Key,
		value: ContractFormState[Key],
	) {
		setForm(current => ({ ...current, [key]: value }))
	}

	function updateItemField(
		index: number,
		key: 'product' | 'quantity' | 'unit_price',
		value: string | number,
	) {
		setForm(current => ({
			...current,
			items: current.items.map((item, itemIndex) =>
				itemIndex === index ? { ...item, [key]: value } : item,
			),
		}))
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setErrorMessage(null)

		const title = form.title.trim()
		const subsidyPercent = form.subsidy_percent.trim()

		if (!subsidyPercent) {
			setErrorMessage(t('contractsPage.form.subsidyRequiredError'))
			return
		}

		if (!isEditing && isNewClient) {
			if (!newClientName.trim() || !newClientPhone.trim() || !title) {
				setErrorMessage(t('contractsPage.form.newClientRequiredError'))
				return
			}
		} else if (!form.client || !title) {
			setErrorMessage(tx.requiredError)
			return
		}

		const parsedDetails: Record<string, unknown> | null = null

		setIsSubmitting(true)
		try {
			let clientId = form.client
			let resolvedCustomerPhone = form.customer_phone || ''

			if (!isEditing && isNewClient) {
				const createdClientResponse = await services.clients.createClient({
					full_name: newClientName.trim(),
					phone: newClientPhone.trim(),
				} as any)

				// Some endpoints return `{ status: 'success', data: {...} }` while others return the entity directly.
				const createdClient =
					createdClientResponse &&
					typeof createdClientResponse === 'object' &&
					'data' in (createdClientResponse as Record<string, unknown>)
						? (createdClientResponse as { data?: any }).data ?? createdClientResponse
						: createdClientResponse

				clientId =
					createdClient?.id ??
					createdClient?.client?.id ??
					createdClient?.data?.id ??
					''

				if (!clientId || typeof clientId !== 'string') {
					throw new Error('Failed to create client.')
				}
				resolvedCustomerPhone = newClientPhone.trim()
			}

			const payload: CreateContractInput | UpdateContractInput = {
				client: clientId,
				title,
			status: form.status,
			panel_type: form.panel_type,
			inverter_type: form.inverter_type,
			requested_power_kw:
				form.requested_power_kw === '' ? null : Number(form.requested_power_kw),
			audit_power_kw:
				form.audit_power_kw === '' ? null : Number(form.audit_power_kw),
			audit_conclusion_kw:
				form.audit_conclusion_kw === '' ? null : Number(form.audit_conclusion_kw),
			eligible_subsidy_kw:
				form.eligible_subsidy_kw === '' ? null : Number(form.eligible_subsidy_kw),
			estimated_subsidy_amount: form.estimated_subsidy_amount || null,
			subsidy_percent: subsidyPercent,
			customer_phone: resolvedCustomerPhone,
			installation_address: form.installation_address || '',
			delivery_status: form.delivery_status || 'pending',
			delivery_notes: form.delivery_notes || '',

			items: form.items
				.filter(item => item.product && Number(item.quantity) > 0)
				.map(item => ({
					product: item.product,
					quantity: Number(item.quantity),
					unit_price: item.unit_price || '0',
				})),
			file: form.file,
			cadastre_file: form.cadastre_file,
			house_image: form.house_image,
			}

			const saved = isEditing
				? await services.contracts.updateContract(
						contract!.id,
						payload as UpdateContractInput,
					)
				: await services.contracts.createContract(payload as CreateContractInput)
			onSuccess?.(saved)
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : tx.saveError)
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
							{tx.form}
						</p>
						<h2 className='mt-1 font-display text-[1.45rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-text-primary'>
							{isEditing ? tx.editTitle : tx.createTitle}
						</h2>
					</div>

					<div className='flex shrink-0 items-center gap-3'>
						{!isEditing ? (
							<div className='flex items-center gap-2'>
								<span className='text-[12px] font-semibold text-text-secondary'>
									{t('contractsPage.form.newClient')}
								</span>
								<Switch
									checked={isNewClient}
									onChange={nextValue => {
										setIsNewClient(nextValue)
										if (nextValue) {
											updateField('client', '')
										}
									}}
									disabled={isSubmitting}
									ariaLabel={t('contractsPage.form.newClient')}
								/>
							</div>
						) : null}

						<button
							type='button'
							className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-primary shadow-sm transition duration-fast hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-60'
							onClick={onClose}
							disabled={isSubmitting}
							aria-label={tx.close}
						>
							<AppIcon
								name='close'
								className='h-4.5 w-4.5'
								aria-hidden='true'
							/>
						</button>
					</div>
				</div>
			</header>

			<form className='grid gap-3' onSubmit={handleSubmit} noValidate>
				<div className='grid items-start gap-3 sm:grid-cols-2'>
					{!isEditing && isNewClient ? (
						<>
							<div className='grid gap-3 sm:col-span-2 sm:grid-cols-2'>
								<div className='grid gap-1.5'>
									<label className={labelClassName}>
										{t('contractsPage.form.newClientName')}
									</label>
									<input
										className={inputClassName}
										value={newClientName}
										onChange={event => setNewClientName(event.target.value)}
										placeholder={t('contractsPage.form.newClientNamePlaceholder')}
										disabled={isSubmitting}
									/>
								</div>

								<div className='grid gap-1.5'>
									<label className={labelClassName}>
										{t('contractsPage.form.newClientPhone')}
									</label>
									<input
										className={inputClassName}
										value={newClientPhone}
										onChange={event => setNewClientPhone(event.target.value)}
										placeholder={t('contractsPage.form.newClientPhonePlaceholder')}
										disabled={isSubmitting}
									/>
								</div>
							</div>

							<div className='grid gap-1.5 sm:col-span-2'>
								<label className={labelClassName}>{tx.labels.title}</label>
								<input
									className={inputClassName}
									value={form.title}
									onChange={event => updateField('title', event.target.value)}
									disabled={isSubmitting}
								/>
							</div>
						</>
					) : (
						<>
							<div className='grid gap-1.5'>
								<label className={labelClassName}>{tx.labels.client}</label>
								<FilterSelect
									value={form.client}
									options={[
										{ value: '', label: t('shared.filterSelect.select'), disabled: true },
										...clients.map(client => ({
											value: client.id,
											label: client.full_name,
										})),
									]}
									onChange={value => updateField('client', value)}
									disabled={isSubmitting || isLoadingReferences}
								/>
							</div>

							<div className='grid gap-1.5'>
								<label className={labelClassName}>{tx.labels.title}</label>
								<input
									className={inputClassName}
									value={form.title}
									onChange={event => updateField('title', event.target.value)}
									disabled={isSubmitting}
								/>
							</div>
						</>
					)}
					<div className='grid gap-1.5'>
						<label className={labelClassName}>{tx.labels.status}</label>
						<FilterSelect
							value={form.status}
							options={statusOptions}
							onChange={value => updateField('status', value as Contract['status'])}
							disabled={isSubmitting}
						/>
					</div>
					<div className='grid gap-1.5'>
						<label className={labelClassName}>{tx.labels.panelType}</label>
						<FilterSelect
							value={form.panel_type}
							options={[
								{
									value: '',
									label: isRu ? 'Не указано' : 'Ko\'rsatilmagan',
								},
								{ value: 'jinko_ja', label: 'Jinko / JA Solar' },
								{ value: 'longi_hi_mo_x10', label: 'Longi HI MO X10' },
							]}
							onChange={value => updateField('panel_type', value as Contract['panel_type'])}
							disabled={isSubmitting}
						/>
					</div>
					<div className='grid gap-1.5'>
						<label className={labelClassName}>{tx.labels.inverterType}</label>
						<FilterSelect
							value={form.inverter_type}
							options={[
								{
									value: '',
									label: isRu ? 'Не указано' : 'Ko\'rsatilmagan',
								},
								{ value: 'deye', label: 'DEYE' },
								{ value: 'solax', label: 'SOLAX' },
							]}
							onChange={value =>
								updateField('inverter_type', value as Contract['inverter_type'])
							}
							disabled={isSubmitting}
						/>
					</div>
					<div className='grid gap-1.5'>
						<label className={labelClassName}>{tx.labels.requestedPower}</label>
						<FilterSelect
							value={form.requested_power_kw === '' ? '' : String(form.requested_power_kw)}
							options={[
								{ value: '', label: t('shared.filterSelect.select'), disabled: true },
								{ value: '10', label: '10kW' },
								{ value: '20', label: '20kW' },
								{ value: '30', label: '30kW' },
								{ value: '40', label: '40kW' },
								{ value: '50', label: '50kW' },
							]}
							onChange={value =>
								updateField(
									'requested_power_kw',
									value === '' ? '' : Number(value),
								)
							}
							disabled={isSubmitting}
						/>
					</div>
					<div className='grid gap-1.5'>
						<label className={labelClassName}>{tx.labels.auditPower}</label>
						<input
							type='number'
							min={0}
							className={inputClassName}
							value={form.audit_power_kw}
							onChange={event =>
								updateField(
									'audit_power_kw',
									event.target.value === '' ? '' : Number(event.target.value),
								)
							}
							disabled={isSubmitting}
						/>
					</div>
					<div className='grid gap-1.5'>
						<label className={labelClassName}>{tx.labels.auditConclusionPower}</label>
						<input
							type='number'
							min={0}
							className={inputClassName}
							value={form.audit_conclusion_kw}
							onChange={event =>
								updateField(
									'audit_conclusion_kw',
									event.target.value === '' ? '' : Number(event.target.value),
								)
							}
							disabled={isSubmitting}
						/>
					</div>
					<div className='grid gap-1.5'>
						<label className={labelClassName}>{tx.labels.eligibleSubsidyPower}</label>
						<input
							type='number'
							min={0}
							className={inputClassName}
							value={form.eligible_subsidy_kw}
							onChange={event =>
								updateField(
									'eligible_subsidy_kw',
									event.target.value === '' ? '' : Number(event.target.value),
								)
							}
							disabled={isSubmitting}
						/>
					</div>
					<div className='grid gap-1.5'>
						<label className={labelClassName}>{tx.labels.estimatedSubsidyAmount}</label>
						<input
							type='text'
							className={inputClassName}
							value={form.estimated_subsidy_amount}
							onChange={event =>
								updateField('estimated_subsidy_amount', event.target.value)
							}
							disabled={isSubmitting}
						/>
					</div>
					<div className='grid gap-1.5'>
						<label className={labelClassName}>{tx.labels.subsidyPercent}</label>
						<input
							type='number'
							min={0}
							step='0.01'
							className={inputClassName}
							value={form.subsidy_percent}
							onChange={event => updateField('subsidy_percent', event.target.value)}
							disabled={isSubmitting}
						/>
					</div>
					{!isEditing && isNewClient ? null : (
						<div className='grid gap-1.5'>
							<label className={labelClassName}>{tx.labels.customerPhone}</label>
							<input
								className={inputClassName}
								value={form.customer_phone}
								onChange={event =>
									updateField('customer_phone', event.target.value)
								}
								disabled={isSubmitting}
							/>
						</div>
					)}
					<div className='grid gap-1.5 sm:col-span-2'>
						<label className={labelClassName}>{tx.labels.address}</label>
						<input
							className={inputClassName}
							value={form.installation_address}
							onChange={event =>
								updateField('installation_address', event.target.value)
							}
							disabled={isSubmitting}
						/>
					</div>
					<div className='grid gap-1.5'>
						<label className={labelClassName}>{tx.labels.deliveryStatus}</label>
						<FilterSelect
							value={form.delivery_status}
							options={deliveryStatusOptions}
							onChange={value => updateField('delivery_status', value)}
							disabled={isSubmitting}
						/>
					</div>
					<div className='grid gap-1.5'>
						<label className={labelClassName}>{tx.labels.deliveryNotes}</label>
						<input
							className={inputClassName}
							value={form.delivery_notes}
							onChange={event => updateField('delivery_notes', event.target.value)}
							disabled={isSubmitting}
						/>
					</div>

					<div className='sm:col-span-2'>
						<FilePickerField
							id='contract-file'
							label={tx.labels.file}
							value={form.file}
							chooseLabel={tx.chooseFile}
							emptyLabel={tx.noFile}
							disabled={isSubmitting}
							onChange={file => updateField('file', file)}
						/>
						{isEditing && existingContractFileUrl ? (
							<ExistingAttachment
								label={`${tx.currentFile}: ${tx.labels.file}`}
								url={existingContractFileUrl}
								openLabel={tx.open}
							/>
						) : null}
					</div>
					<div className='sm:col-span-2'>
						<FilePickerField
							id='contract-cadastre-file'
							label={tx.labels.cadastreFile}
							value={form.cadastre_file}
							chooseLabel={tx.chooseFile}
							emptyLabel={tx.noFile}
							disabled={isSubmitting}
							onChange={file => updateField('cadastre_file', file)}
						/>
						{isEditing && existingCadastreFileUrl ? (
							<ExistingAttachment
								label={`${tx.currentFile}: ${tx.labels.cadastreFile}`}
								url={existingCadastreFileUrl}
								openLabel={tx.open}
							/>
						) : null}
					</div>
					<div className='sm:col-span-2'>
						<FilePickerField
							id='contract-house-image'
							label={tx.labels.houseImage}
							value={form.house_image}
							chooseLabel={tx.chooseFile}
							emptyLabel={tx.noFile}
							accept='image/*'
							disabled={isSubmitting}
							onChange={file => updateField('house_image', file)}
						/>
						{isEditing && existingHouseImageUrl ? (
							<ExistingAttachment
								label={`${tx.currentFile}: ${tx.labels.houseImage}`}
								url={existingHouseImageUrl}
								openLabel={tx.open}
							/>
						) : null}
					</div>
				</div>

				<div className='rounded-xl bg-surface-card p-3 ring-1 ring-border-soft/45'>
					<div className='mb-2 flex items-center justify-between gap-2'>
						<p className={labelClassName}>{tx.labels.items}</p>
						<button
							type='button'
							className='inline-flex min-h-8 items-center justify-center rounded-lg bg-surface-subtle px-3 text-xs font-semibold text-text-secondary transition duration-fast hover:bg-surface-muted'
							onClick={() =>
								setForm(current => ({
									...current,
									items: [
										...current.items,
										{ product: '', quantity: 1, unit_price: '' },
									],
								}))
							}
							disabled={isSubmitting}
						>
							{tx.addItem}
						</button>
					</div>
					<div className='grid gap-2'>
						{form.items.map((item, index) => (
							<div
								key={`item-${index}`}
								className='grid min-w-0 gap-2 rounded-lg bg-surface-subtle/60 p-2 sm:grid-cols-[minmax(0,1.8fr)_96px_130px_auto]'
							>
								<div className='grid min-w-0 gap-1'>
									<FilterSelect
										value={item.product}
										options={products.map(product => ({
											value: product.id,
											label: product.name,
										}))}
										onChange={value => updateItemField(index, 'product', value)}
										disabled={isSubmitting || isLoadingReferences}
									/>
								</div>
								<input
									type='number'
									min={1}
									className={inputClassName}
									placeholder={tx.labels.quantity}
									value={item.quantity}
									onChange={event =>
										updateItemField(
											index,
											'quantity',
											event.target.value === '' ? '' : Number(event.target.value),
										)
									}
									disabled={isSubmitting}
								/>
								<input
									type='number'
									min={0}
									step='0.01'
									className={inputClassName}
									placeholder={tx.labels.unitPrice}
									value={item.unit_price}
									onChange={event =>
										updateItemField(index, 'unit_price', event.target.value)
									}
									disabled={isSubmitting}
								/>
								<button
									type='button'
									className='inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-lg bg-danger/10 px-2.5 text-xs font-semibold text-danger transition duration-fast hover:bg-danger/20 disabled:opacity-60'
									onClick={() =>
										setForm(current => ({
											...current,
											items:
												current.items.length > 1
													? current.items.filter((_, i) => i !== index)
													: current.items,
										}))
									}
									disabled={isSubmitting || form.items.length <= 1}
								>
									{tx.removeItem}
								</button>
							</div>
						))}
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
						{tx.cancel}
					</button>
					<button
						type='submit'
						className='ml-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition duration-fast hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:cursor-not-allowed disabled:opacity-60'
						disabled={isSubmitting || !canSubmit}
					>
						{isSubmitting ? tx.saving : isEditing ? tx.editSubmit : tx.createSubmit}
					</button>
				</div>
			</form>
		</div>
	)
}
