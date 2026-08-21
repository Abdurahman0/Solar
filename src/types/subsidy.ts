/**
 * Subsidy settings + public calculator contracts.
 *
 * Backend keeps every subsidy rule (percent, limits, formula). The frontend
 * only reads/writes the admin settings and renders whatever the calculator
 * returns - no local formula.
 */

export interface SubsidySettings {
	is_active: boolean
	subsidy_percent: number
	max_subsidy_amount: number
	max_power_kw: number
	guide_powers: number[]
	updated_at?: string
	updated_by?: string
}

export interface SubsidySettingsPatchInput {
	is_active?: boolean
	subsidy_percent?: number | string
	max_subsidy_amount?: number | string
	max_power_kw?: number
	guide_powers?: number[]
}

export interface SubsidyCalculationInput {
	panel_type: string
	inverter_type: string
	requested_power_kw: number
	audit_power_kw?: number | null
}

export interface SubsidyCalculation {
	base_price: number
	subsidy_amount: number
	customer_amount: number
	subsidy_reference_power_kw: number
	subsidy_percent: number
	max_subsidy_amount: number
	subsidy_enabled: boolean
}
