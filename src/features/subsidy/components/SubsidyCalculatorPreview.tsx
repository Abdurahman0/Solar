import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { FilterSelect } from '../../../components/shared/data'
import { PageCard } from '../../../components/shared/page'
import { services } from '../../../services'
import type { SelectOption } from '../../../types/domain'
import type { SubsidyCalculation } from '../../../types/subsidy'
import { formatAmount, formatPercent, formatPower } from '../utils/subsidy-format'

export interface SubsidyCalculatorPreviewProps {
	locale: string
	/** Bumped after a save so the preview refetches with the new settings. */
	refreshToken: number
	guidePowers: number[]
}

const labelClassName =
	'text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted'

const valueClassName =
	'text-sm font-semibold text-text-primary [overflow-wrap:anywhere]'

const inputClassName = [
	'w-full rounded-lg border border-border-soft/60 bg-surface-card px-3.5 py-2.5 text-sm font-semibold text-text-primary',
	'outline-none transition duration-fast focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
	'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ')

const PANEL_OPTIONS: SelectOption[] = [
	{ value: 'jinko_ja', label: 'Jinko / JA Solar' },
	{ value: 'longi_hi_mo_x10', label: 'Longi HI MO X10' },
]

const INVERTER_OPTIONS: SelectOption[] = [
	{ value: 'deye', label: 'DEYE' },
	{ value: 'solax', label: 'SOLAX' },
]

function SubsidyCalculatorPreview({
	locale,
	refreshToken,
	guidePowers,
}: SubsidyCalculatorPreviewProps) {
	const { t } = useTranslation()
	const [panelType, setPanelType] = useState('jinko_ja')
	const [inverterType, setInverterType] = useState('deye')
	const [requestedPower, setRequestedPower] = useState(
		String(guidePowers[0] ?? 10),
	)
	const [auditPower, setAuditPower] = useState('')
	const [result, setResult] = useState<SubsidyCalculation | null>(null)
	const [isCalculating, setIsCalculating] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	const powerOptions = useMemo<SelectOption[]>(() => {
		const powers = guidePowers.length ? guidePowers : [3, 5, 8, 10, 15, 20, 30]
		return powers.map(power => ({
			value: String(power),
			label: `${power} kW`,
		}))
	}, [guidePowers])

	async function handleCalculate(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()

		const requested = Number(requestedPower)
		if (!Number.isFinite(requested) || requested <= 0) {
			setErrorMessage(t('subsidy.calculator.powerError'))
			return
		}

		setIsCalculating(true)
		setErrorMessage(null)

		try {
			const audit = Number(auditPower)
			const calculation = await services.subsidy.calculate({
				panel_type: panelType,
				inverter_type: inverterType,
				requested_power_kw: requested,
				audit_power_kw:
					auditPower.trim().length && Number.isFinite(audit) && audit > 0
						? audit
						: undefined,
			})

			setResult(calculation)
		} catch {
			setResult(null)
			setErrorMessage(t('subsidy.calculator.error'))
		} finally {
			setIsCalculating(false)
		}
	}

	// A save invalidates any previously rendered numbers.
	useEffect(() => {
		setResult(null)
	}, [refreshToken])

	return (
		<PageCard>
			<div className='grid gap-1'>
				<p className={labelClassName}>{t('subsidy.calculator.title')}</p>
				<p className='m-0 max-w-[62ch] text-sm leading-6 text-text-secondary'>
					{t('subsidy.calculator.description')}
				</p>
			</div>

			<form className='mt-4 grid gap-3 sm:grid-cols-2' onSubmit={handleCalculate}>
				<label className='grid gap-1.5'>
					<span className={labelClassName}>
						{t('subsidy.calculator.panelType')}
					</span>
					<FilterSelect
						value={panelType}
						options={PANEL_OPTIONS}
						onChange={setPanelType}
						disabled={isCalculating}
					/>
				</label>

				<label className='grid gap-1.5'>
					<span className={labelClassName}>
						{t('subsidy.calculator.inverterType')}
					</span>
					<FilterSelect
						value={inverterType}
						options={INVERTER_OPTIONS}
						onChange={setInverterType}
						disabled={isCalculating}
					/>
				</label>

				<label className='grid gap-1.5'>
					<span className={labelClassName}>
						{t('subsidy.calculator.requestedPower')}
					</span>
					<FilterSelect
						value={requestedPower}
						options={powerOptions}
						onChange={setRequestedPower}
						disabled={isCalculating}
					/>
				</label>

				<label className='grid gap-1.5'>
					<span className={labelClassName}>
						{t('subsidy.calculator.auditPower')}
					</span>
					<input
						className={inputClassName}
						inputMode='numeric'
						placeholder={t('subsidy.calculator.auditPowerPlaceholder')}
						value={auditPower}
						onChange={event =>
							setAuditPower(event.target.value.replace(/\D/g, ''))
						}
						disabled={isCalculating}
					/>
					<span className='text-[12px] leading-5 text-text-muted'>
						{t('subsidy.calculator.auditPowerHint')}
					</span>
				</label>

				<div className='sm:col-span-2'>
					<button
						type='submit'
						className='inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition duration-fast hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:cursor-not-allowed disabled:opacity-60'
						disabled={isCalculating}
					>
						{isCalculating
							? t('subsidy.calculator.calculating')
							: t('subsidy.calculator.calculate')}
					</button>
				</div>
			</form>

			<div className='mt-4'>
				{errorMessage ? (
					<p className='m-0 rounded-lg bg-danger-bg px-3 py-2 text-sm font-semibold text-danger'>
						{errorMessage}
					</p>
				) : result ? (
					<div className='grid gap-2.5'>
						{!result.subsidy_enabled ? (
							<p className='m-0 rounded-lg bg-surface-subtle/80 px-3 py-2 text-sm font-semibold text-text-secondary'>
								{t('subsidy.calculator.disabledNotice')}
							</p>
						) : null}
						<div className='grid gap-2.5 sm:grid-cols-2'>
							<div className='rounded-lg bg-surface-subtle/80 p-3'>
								<p className={labelClassName}>
									{t('subsidy.calculator.basePrice')}
								</p>
								<p className={`mt-1 ${valueClassName}`}>
									{formatAmount(result.base_price, locale)}
								</p>
							</div>
							<div className='rounded-lg bg-success-bg/60 p-3 ring-1 ring-success/25'>
								<p className={labelClassName}>
									{t('subsidy.calculator.subsidyAmount')}
								</p>
								<p className={`mt-1 ${valueClassName}`}>
									{formatAmount(result.subsidy_amount, locale)}
								</p>
							</div>
							<div className='rounded-lg bg-primary/10 p-3 ring-1 ring-primary/20'>
								<p className={labelClassName}>
									{t('subsidy.calculator.customerAmount')}
								</p>
								<p className={`mt-1 ${valueClassName}`}>
									{formatAmount(result.customer_amount, locale)}
								</p>
							</div>
							<div className='rounded-lg bg-surface-subtle/80 p-3'>
								<p className={labelClassName}>
									{t('subsidy.calculator.referencePower')}
								</p>
								<p className={`mt-1 ${valueClassName}`}>
									{formatPower(result.subsidy_reference_power_kw, locale)}
								</p>
							</div>
							<div className='rounded-lg bg-surface-subtle/80 p-3'>
								<p className={labelClassName}>
									{t('subsidy.calculator.percent')}
								</p>
								<p className={`mt-1 ${valueClassName}`}>
									{formatPercent(result.subsidy_percent, locale)}
								</p>
							</div>
							<div className='rounded-lg bg-surface-subtle/80 p-3'>
								<p className={labelClassName}>
									{t('subsidy.calculator.maxSubsidy')}
								</p>
								<p className={`mt-1 ${valueClassName}`}>
									{formatAmount(result.max_subsidy_amount, locale)}
								</p>
							</div>
						</div>
					</div>
				) : (
					<p className='m-0 rounded-lg bg-surface-subtle/70 px-3 py-2 text-sm text-text-secondary'>
						{t('subsidy.calculator.empty')}
					</p>
				)}
			</div>
		</PageCard>
	)
}

export default SubsidyCalculatorPreview
