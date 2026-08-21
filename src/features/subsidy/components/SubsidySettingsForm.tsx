import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Switch } from '../../../components/shared/data'
import ConfirmDialog from '../../../components/shared/dialogs/ConfirmDialog'
import { PageCard } from '../../../components/shared/page'
import type {
	SubsidySettings,
	SubsidySettingsPatchInput,
} from '../../../types/subsidy'
import {
	DEFAULT_CURRENCY_LABEL,
	formatAmountInput,
	parseAmountInput,
} from '../utils/subsidy-format'

export interface SubsidySettingsFormProps {
	settings: SubsidySettings
	canManage: boolean
	isSaving: boolean
	fieldErrors: Record<string, string>
	onSubmit: (input: SubsidySettingsPatchInput) => void
}

interface FormState {
	is_active: boolean
	subsidy_percent: string
	max_subsidy_amount: string
	max_power_kw: string
	guide_powers: string
}

const labelClassName =
	'text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted'

const inputClassName = [
	'w-full rounded-lg border border-border-soft/60 bg-surface-card px-3.5 py-2.5 text-sm font-semibold text-text-primary',
	'placeholder:font-medium placeholder:text-text-muted outline-none transition duration-fast',
	'focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
	'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ')

const suffixClassName =
	'pointer-events-none absolute inset-y-0 right-3 flex items-center text-[12px] font-semibold text-text-muted'

function toFormState(settings: SubsidySettings): FormState {
	return {
		is_active: settings.is_active,
		subsidy_percent: String(settings.subsidy_percent ?? 0),
		max_subsidy_amount: formatAmountInput(
			String(Math.trunc(settings.max_subsidy_amount ?? 0)),
		),
		max_power_kw: String(settings.max_power_kw ?? 0),
		guide_powers: settings.guide_powers.join(', '),
	}
}

function parseGuidePowers(value: string): number[] {
	const parsed = value
		.split(/[\s,]+/)
		.map(item => Number(item.trim()))
		.filter(item => Number.isFinite(item) && item > 0)
		.map(item => Math.trunc(item))

	return Array.from(new Set(parsed)).sort((first, second) => first - second)
}

function SubsidySettingsForm({
	settings,
	canManage,
	isSaving,
	fieldErrors,
	onSubmit,
}: SubsidySettingsFormProps) {
	const { t } = useTranslation()
	const [form, setForm] = useState<FormState>(() => toFormState(settings))
	const [localError, setLocalError] = useState<string | null>(null)
	const [isConfirmOpen, setIsConfirmOpen] = useState(false)

	useEffect(() => {
		setForm(toFormState(settings))
	}, [settings])

	const guidePowers = useMemo(
		() => parseGuidePowers(form.guide_powers),
		[form.guide_powers],
	)

	function updateField<Key extends keyof FormState>(
		key: Key,
		value: FormState[Key],
	) {
		setForm(current => ({ ...current, [key]: value }))
		setLocalError(null)
	}

	function validate(): SubsidySettingsPatchInput | null {
		const percent = Number(form.subsidy_percent.replace(',', '.'))
		if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
			setLocalError(t('subsidy.form.percentError'))
			return null
		}

		const rawAmount = parseAmountInput(form.max_subsidy_amount)
		if (!rawAmount.length) {
			setLocalError(t('subsidy.form.amountError'))
			return null
		}

		const maxPower = Number(form.max_power_kw)
		if (!Number.isFinite(maxPower) || maxPower < 0) {
			setLocalError(t('subsidy.form.powerError'))
			return null
		}

		if (!guidePowers.length) {
			setLocalError(t('subsidy.form.guidePowersError'))
			return null
		}

		return {
			is_active: form.is_active,
			subsidy_percent: percent,
			max_subsidy_amount: rawAmount,
			max_power_kw: Math.trunc(maxPower),
			guide_powers: guidePowers,
		}
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()

		if (!canManage || isSaving) {
			return
		}

		if (!validate()) {
			return
		}

		setIsConfirmOpen(true)
	}

	function handleConfirm() {
		const payload = validate()
		if (!payload) {
			setIsConfirmOpen(false)
			return
		}

		setIsConfirmOpen(false)
		onSubmit(payload)
	}

	const isDisabled = !canManage || isSaving

	return (
		<PageCard>
			<form className='grid gap-4' onSubmit={handleSubmit}>
				<div className='flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-subtle/70 p-3.5 ring-1 ring-border-soft/25'>
					<div className='min-w-0'>
						<p className={labelClassName}>{t('subsidy.form.enabled')}</p>
						<p className='mt-1 max-w-[52ch] text-sm leading-6 text-text-secondary'>
							{t('subsidy.form.enabledHint')}
						</p>
					</div>
					<Switch
						checked={form.is_active}
						onChange={value => updateField('is_active', value)}
						disabled={isDisabled}
						ariaLabel={t('subsidy.form.enabled')}
					/>
				</div>

				<div className='grid gap-3 sm:grid-cols-2'>
					<div className='grid gap-1.5'>
						<label className={labelClassName} htmlFor='subsidy-percent'>
							{t('subsidy.form.percent')}
						</label>
						<div className='relative'>
							<input
								id='subsidy-percent'
								className={inputClassName}
								inputMode='decimal'
								value={form.subsidy_percent}
								onChange={event =>
									updateField('subsidy_percent', event.target.value)
								}
								disabled={isDisabled}
							/>
							<span className={suffixClassName}>%</span>
						</div>
						{fieldErrors.subsidy_percent ? (
							<p className='m-0 text-[12px] font-semibold text-danger'>
								{fieldErrors.subsidy_percent}
							</p>
						) : null}
					</div>

					<div className='grid gap-1.5'>
						<label className={labelClassName} htmlFor='subsidy-max-amount'>
							{t('subsidy.form.maxAmount')}
						</label>
						<div className='relative'>
							<input
								id='subsidy-max-amount'
								className={inputClassName}
								inputMode='numeric'
								value={form.max_subsidy_amount}
								onChange={event =>
									updateField(
										'max_subsidy_amount',
										formatAmountInput(event.target.value),
									)
								}
								disabled={isDisabled}
							/>
							<span className={suffixClassName}>{DEFAULT_CURRENCY_LABEL}</span>
						</div>
						{fieldErrors.max_subsidy_amount ? (
							<p className='m-0 text-[12px] font-semibold text-danger'>
								{fieldErrors.max_subsidy_amount}
							</p>
						) : null}
					</div>

					<div className='grid gap-1.5'>
						<label className={labelClassName} htmlFor='subsidy-max-power'>
							{t('subsidy.form.maxPower')}
						</label>
						<div className='relative'>
							<input
								id='subsidy-max-power'
								className={inputClassName}
								inputMode='numeric'
								value={form.max_power_kw}
								onChange={event =>
									updateField(
										'max_power_kw',
										event.target.value.replace(/\D/g, ''),
									)
								}
								disabled={isDisabled}
							/>
							<span className={suffixClassName}>kW</span>
						</div>
						{fieldErrors.max_power_kw ? (
							<p className='m-0 text-[12px] font-semibold text-danger'>
								{fieldErrors.max_power_kw}
							</p>
						) : null}
					</div>

					<div className='grid gap-1.5'>
						<label className={labelClassName} htmlFor='subsidy-guide-powers'>
							{t('subsidy.form.guidePowers')}
						</label>
						<input
							id='subsidy-guide-powers'
							className={inputClassName}
							value={form.guide_powers}
							placeholder='3, 5, 8, 10'
							onChange={event =>
								updateField('guide_powers', event.target.value)
							}
							disabled={isDisabled}
						/>
						<p className='m-0 text-[12px] leading-5 text-text-muted'>
							{t('subsidy.form.guidePowersHint')}
						</p>
						{fieldErrors.guide_powers ? (
							<p className='m-0 text-[12px] font-semibold text-danger'>
								{fieldErrors.guide_powers}
							</p>
						) : null}
					</div>
				</div>

				{guidePowers.length ? (
					<div className='flex flex-wrap gap-1.5'>
						{guidePowers.map(power => (
							<span
								key={power}
								className='inline-flex min-h-7 items-center rounded-pill bg-primary/12 px-2.5 text-[12px] font-semibold text-text-accent'
							>
								{power} kW
							</span>
						))}
					</div>
				) : null}

				{localError ? (
					<p className='m-0 rounded-lg bg-danger-bg px-3 py-2 text-sm font-semibold text-danger'>
						{localError}
					</p>
				) : null}

				<div className='flex flex-wrap items-center justify-end gap-2'>
					<button
						type='button'
						className='inline-flex min-h-10 items-center justify-center rounded-lg bg-surface-subtle px-4 text-sm font-semibold text-text-primary transition duration-fast hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60'
						onClick={() => {
							setForm(toFormState(settings))
							setLocalError(null)
						}}
						disabled={isDisabled}
					>
						{t('subsidy.form.reset')}
					</button>
					<button
						type='submit'
						className='inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition duration-fast hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:cursor-not-allowed disabled:opacity-60'
						disabled={isDisabled}
					>
						{isSaving ? t('subsidy.form.saving') : t('subsidy.form.save')}
					</button>
				</div>

				{!canManage ? (
					<p className='m-0 text-[12px] font-medium text-text-muted'>
						{t('subsidy.readOnlyHint')}
					</p>
				) : null}
			</form>

			{isConfirmOpen ? (
				<ConfirmDialog
					eyebrow={t('subsidy.confirm.eyebrow')}
					title={t('subsidy.confirm.title')}
					description={t('subsidy.confirm.description')}
					confirmLabel={t('subsidy.confirm.confirm')}
					cancelLabel={t('subsidy.confirm.cancel')}
					confirmTone='primary'
					isBusy={isSaving}
					ariaLabel={t('subsidy.confirm.title')}
					onCancel={() => setIsConfirmOpen(false)}
					onConfirm={handleConfirm}
				/>
			) : null}
		</PageCard>
	)
}

export default SubsidySettingsForm
