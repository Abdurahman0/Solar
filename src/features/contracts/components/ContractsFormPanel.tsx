import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import AppIcon from '../../../components/shared/icons/AppIcon'
import { FilterSelect } from '../../../components/shared/data'
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
	subsidy_percent: string
	customer_phone: string
	installation_address: string
	delivery_status: string
	delivery_notes: string
	details: string
	items: Array<{ product: string; quantity: number; unit_price: string }>
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
			<div className='flex min-h-[46px] items-center justify-between gap-3 rounded-lg border border-border-soft/60 bg-surface-card px-3.5 py-2.5'>
				<span className='min-w-0 truncate text-sm font-medium text-text-secondary'>
					{value?.name || emptyLabel}
				</span>
				<label
					htmlFor={id}
					className='inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-surface-subtle px-3 text-xs font-semibold text-text-primary transition duration-fast hover:bg-surface-muted'
				>
					{chooseLabel}
				</label>
				<input
					id={id}
					type='file'
					accept={accept}
					className='sr-only'
					onChange={event => onChange(event.target.files?.[0] ?? null)}
					disabled={disabled}
				/>
			</div>
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
	return Object.values(details)
		.map(value => (typeof value === 'string' ? value.trim() : String(value)))
		.filter(Boolean)
		.join(', ')
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
	const { i18n } = useTranslation()
	const isRu = i18n.language === 'ru'
	const isEditing = Boolean(contract)

	const tx = isRu
		? {
				form: 'Форма договора',
				createTitle: 'Новый договор',
				editTitle: 'Редактирование договора',
				requiredError: 'Заполните обязательные поля: клиент и название.',
				saveError: 'Не удалось сохранить договор.',
				saving: 'Сохранение...',
				createSubmit: 'Создать договор',
				editSubmit: 'Сохранить изменения',
				cancel: 'Отмена',
				close: 'Закрыть',
				chooseFile: 'Выбрать файл',
				noFile: 'Файл не выбран',
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
				requiredError: 'Majburiy maydonlarni to`ldiring: mijoz va nom.',
				saveError: 'Shartnomani saqlab bo`lmadi.',
				saving: 'Saqlanmoqda...',
				createSubmit: 'Shartnoma yaratish',
				editSubmit: "O`zgarishlarni saqlash",
				cancel: 'Bekor qilish',
				close: 'Yopish',
				chooseFile: 'Fayl tanlash',
				noFile: 'Fayl tanlanmagan',
				addItem: 'Pozitsiya qo`shish',
				removeItem: 'Olib tashlash',
				labels: {
					client: 'Mijoz',
					title: 'Nomi',
					status: 'Holat',
					panelType: 'Panel turi',
					inverterType: 'Invertor turi',
					requestedPower: 'So`ralgan quvvat (kW)',
					auditPower: 'Audit quvvati (kW)',
					subsidyPercent: 'Subsidiya (%)',
					customerPhone: 'Mijoz telefoni',
					address: "O`rnatish manzili",
					deliveryStatus: 'Yetkazish holati',
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
	const [clients, setClients] = useState<Array<{ id: string; full_name: string }>>(
		[],
	)
	const [products, setProducts] = useState<Array<{ id: string; name: string }>>([])
	const [isLoadingReferences, setIsLoadingReferences] = useState(true)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

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

	const statusOptions = useMemo(
		() => [
			{ value: 'draft', label: isRu ? 'Черновик' : 'Qoralama' },
			{ value: 'audit_pending', label: isRu ? 'Audit kutilmoqda' : 'Audit kutilmoqda' },
			{ value: 'audit_paid', label: isRu ? 'Audit to`langan' : 'Audit to`langan' },
			{ value: 'moderation', label: isRu ? 'Модерация' : 'Moderatsiya' },
			{ value: 'contract_ready', label: isRu ? 'Договор tayyor' : 'Shartnoma tayyor' },
			{ value: 'payment_pending', label: isRu ? 'To`lov kutilmoqda' : 'To`lov kutilmoqda' },
			{ value: 'paid', label: isRu ? 'Оплачен' : 'To`langan' },
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
		if (!form.client || !form.title.trim()) {
			setErrorMessage(tx.requiredError)
			return
		}

		const payload: CreateContractInput | UpdateContractInput = {
			client: form.client,
			title: form.title.trim(),
			status: form.status,
			panel_type: form.panel_type,
			inverter_type: form.inverter_type,
			requested_power_kw:
				form.requested_power_kw === '' ? null : Number(form.requested_power_kw),
			audit_power_kw:
				form.audit_power_kw === '' ? null : Number(form.audit_power_kw),
			subsidy_percent: form.subsidy_percent || null,
			customer_phone: form.customer_phone || '',
			installation_address: form.installation_address || '',
			delivery_status: form.delivery_status || 'pending',
			delivery_notes: form.delivery_notes || '',
			details: form.details || '',
			items: form.items
				.filter(item => item.product && item.quantity > 0)
				.map(item => ({
					product: item.product,
					quantity: Number(item.quantity),
					unit_price: item.unit_price || '0',
				})),
			file: form.file,
			cadastre_file: form.cadastre_file,
			house_image: form.house_image,
		}

		setIsSubmitting(true)
		try {
			const saved = isEditing
				? await services.contracts.updateContract(
						contract!.id,
						payload as UpdateContractInput,
					)
				: await services.contracts.createContract(payload as CreateContractInput)
			onSuccess?.(saved)
		} catch {
			setErrorMessage(tx.saveError)
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
					<button
						type='button'
						className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-primary shadow-sm transition duration-fast hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-60'
						onClick={onClose}
						disabled={isSubmitting}
						aria-label={tx.close}
					>
						<AppIcon name='close' className='h-4.5 w-4.5' aria-hidden='true' />
					</button>
				</div>
			</header>

			<form className='grid gap-3' onSubmit={handleSubmit} noValidate>
				<div className='grid gap-3 sm:grid-cols-2'>
					<div className='grid gap-1.5'>
						<label className={labelClassName}>{tx.labels.client}</label>
						<FilterSelect
							value={form.client}
							options={clients.map(client => ({
								value: client.id,
								label: client.full_name,
							}))}
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
									label: isRu ? 'Не указано' : 'Ko`rsatilmagan',
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
									label: isRu ? 'Не указано' : 'Ko`rsatilmagan',
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
						<input
							type='number'
							min={0}
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
						<label className={labelClassName}>{tx.labels.subsidyPercent}</label>
						<input
							className={inputClassName}
							value={form.subsidy_percent}
							onChange={event => updateField('subsidy_percent', event.target.value)}
							disabled={isSubmitting}
						/>
					</div>
					<div className='grid gap-1.5'>
						<label className={labelClassName}>{tx.labels.customerPhone}</label>
						<input
							className={inputClassName}
							value={form.customer_phone}
							onChange={event => updateField('customer_phone', event.target.value)}
							disabled={isSubmitting}
						/>
					</div>
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
					<div className='grid gap-1.5 sm:col-span-2'>
						<label className={labelClassName}>{tx.labels.details}</label>
						<textarea
							className={`${inputClassName} min-h-[92px] resize-y`}
							value={form.details}
							onChange={event => updateField('details', event.target.value)}
							disabled={isSubmitting}
						/>
					</div>
					<FilePickerField
						id='contract-file'
						label={tx.labels.file}
						value={form.file}
						chooseLabel={tx.chooseFile}
						emptyLabel={tx.noFile}
						disabled={isSubmitting}
						onChange={file => updateField('file', file)}
					/>
					<FilePickerField
						id='contract-cadastre-file'
						label={tx.labels.cadastreFile}
						value={form.cadastre_file}
						chooseLabel={tx.chooseFile}
						emptyLabel={tx.noFile}
						disabled={isSubmitting}
						onChange={file => updateField('cadastre_file', file)}
					/>
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
								className='grid gap-2 rounded-lg bg-surface-subtle/60 p-2 sm:grid-cols-[1fr_110px_140px_auto]'
							>
								<FilterSelect
									value={item.product}
									options={products.map(product => ({
										value: product.id,
										label: product.name,
									}))}
									onChange={value => updateItemField(index, 'product', value)}
									disabled={isSubmitting || isLoadingReferences}
								/>
								<input
									type='number'
									min={1}
									className={inputClassName}
									placeholder={tx.labels.quantity}
									value={item.quantity}
									onChange={event =>
										updateItemField(index, 'quantity', Number(event.target.value))
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
									className='inline-flex min-h-10 items-center justify-center rounded-lg bg-danger/10 px-3 text-sm font-semibold text-danger transition duration-fast hover:bg-danger/20 disabled:opacity-60'
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
						disabled={isSubmitting}
					>
						{isSubmitting ? tx.saving : isEditing ? tx.editSubmit : tx.createSubmit}
					</button>
				</div>
			</form>
		</div>
	)
}
