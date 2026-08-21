import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../auth'
import { StatusBadge } from '../../../components/shared/data'
import AppIcon from '../../../components/shared/icons/AppIcon'
import {
	EmptyState,
	LoadingState,
	PageCard,
	PageHeader,
	PageLayout,
	PageSection,
} from '../../../components/shared/page'
import SubsidyCalculatorPreview from '../../../features/subsidy/components/SubsidyCalculatorPreview'
import SubsidySettingsForm from '../../../features/subsidy/components/SubsidySettingsForm'
import { parseApiError } from '../../../features/subsidy/utils/subsidy-errors'
import {
	formatAmount,
	formatPercent,
	formatPower,
} from '../../../features/subsidy/utils/subsidy-format'
import { formatLocalizedDate } from '../../../i18n/date-format'
import { services } from '../../../services'
import type {
	SubsidySettings,
	SubsidySettingsPatchInput,
} from '../../../types/subsidy'

const labelClassName =
	'text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted'

const valueClassName =
	'text-sm font-semibold text-text-primary [overflow-wrap:anywhere]'

function SubsidySettingsPage() {
	const { t, i18n } = useTranslation()
	const { hasRole, hasPermission } = useAuth()
	const locale = i18n.language === 'ru' ? 'ru-RU' : 'uz-UZ'
	const canManage =
		hasRole('developer') ||
		hasRole('admin') ||
		hasPermission('can_manage_integrations')

	const [settings, setSettings] = useState<SubsidySettings | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [hasError, setHasError] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
	const [saveMessage, setSaveMessage] = useState<string | null>(null)
	const [saveError, setSaveError] = useState<string | null>(null)
	const [calculatorToken, setCalculatorToken] = useState(0)

	const loadSettings = useCallback(async () => {
		setIsLoading(true)
		setHasError(false)

		try {
			const result = await services.subsidy.getSettings()
			setSettings(result)
		} catch {
			setSettings(null)
			setHasError(true)
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		void loadSettings()
	}, [loadSettings])

	async function handleSubmit(input: SubsidySettingsPatchInput) {
		setIsSaving(true)
		setFieldErrors({})
		setSaveError(null)
		setSaveMessage(null)

		try {
			await services.subsidy.patchSettings(input)
			// Re-fetch so the page always renders backend truth, never local input.
			await loadSettings()
			setSaveMessage(t('subsidy.form.saved'))
			setCalculatorToken(current => current + 1)
		} catch (error) {
			const parsed = parseApiError(error, t('subsidy.form.saveError'))
			setFieldErrors(parsed.fieldErrors)
			setSaveError(parsed.message)
		} finally {
			setIsSaving(false)
		}
	}

	const header = (
		<PageHeader
			eyebrow={t('subsidy.eyebrow')}
			title={t('subsidy.title')}
			subtitle={t('subsidy.subtitle')}
			actions={
				settings ? (
					<div className='flex w-full flex-wrap items-center gap-2 min-[768px]:w-auto'>
						<StatusBadge
							status={settings.is_active ? 'active' : 'inactive'}
							tone={settings.is_active ? 'success' : 'neutral'}
							label={
								settings.is_active
									? t('subsidy.statusActive')
									: t('subsidy.statusInactive')
							}
						/>
						{settings.updated_at ? (
							<span className='inline-flex min-h-8 items-center gap-2 rounded-pill bg-surface-subtle px-3 text-[12px] font-semibold text-text-secondary'>
								<AppIcon name='calendar' className='h-3.5 w-3.5' aria-hidden='true' />
								{formatLocalizedDate(settings.updated_at, i18n.language, {
									locale,
									withYear: true,
									withTime: true,
									shortMonth: true,
									fallback: t('common.na'),
								})}
							</span>
						) : null}
					</div>
				) : null
			}
		/>
	)

	if (isLoading && !settings) {
		return (
			<PageLayout header={header}>
				<PageSection>
					<PageCard>
						<LoadingState
							title={t('subsidy.loadingTitle')}
							description={t('subsidy.loadingDescription')}
						/>
					</PageCard>
				</PageSection>
			</PageLayout>
		)
	}

	if (hasError || !settings) {
		return (
			<PageLayout header={header}>
				<PageSection>
					<PageCard>
						<EmptyState
							title={t('subsidy.errorTitle')}
							description={t('subsidy.errorDescription')}
						/>
					</PageCard>
				</PageSection>
			</PageLayout>
		)
	}

	return (
		<PageLayout header={header}>
			<PageSection>
				<div className='grid gap-3 sm:grid-cols-3'>
					<PageCard muted>
						<p className={labelClassName}>{t('subsidy.summary.percent')}</p>
						<p className={`mt-1 ${valueClassName}`}>
							{formatPercent(settings.subsidy_percent, locale)}
						</p>
					</PageCard>
					<PageCard muted>
						<p className={labelClassName}>{t('subsidy.summary.maxAmount')}</p>
						<p className={`mt-1 ${valueClassName}`}>
							{formatAmount(settings.max_subsidy_amount, locale)}
						</p>
					</PageCard>
					<PageCard muted>
						<p className={labelClassName}>{t('subsidy.summary.maxPower')}</p>
						<p className={`mt-1 ${valueClassName}`}>
							{formatPower(settings.max_power_kw, locale)}
						</p>
					</PageCard>
				</div>
			</PageSection>

			<PageSection
				title={t('subsidy.sections.settingsTitle')}
				description={t('subsidy.sections.settingsDescription')}
			>
				{saveMessage ? (
					<p className='m-0 rounded-lg bg-success-bg px-3 py-2 text-sm font-semibold text-success'>
						{saveMessage}
					</p>
				) : null}
				{saveError ? (
					<p className='m-0 rounded-lg bg-danger-bg px-3 py-2 text-sm font-semibold text-danger'>
						{saveError}
					</p>
				) : null}

				<SubsidySettingsForm
					settings={settings}
					canManage={canManage}
					isSaving={isSaving}
					fieldErrors={fieldErrors}
					onSubmit={input => {
						void handleSubmit(input)
					}}
				/>
			</PageSection>

			<PageSection
				title={t('subsidy.sections.calculatorTitle')}
				description={t('subsidy.sections.calculatorDescription')}
			>
				<SubsidyCalculatorPreview
					locale={locale}
					refreshToken={calculatorToken}
					guidePowers={settings.guide_powers}
				/>
			</PageSection>
		</PageLayout>
	)
}

export default SubsidySettingsPage
