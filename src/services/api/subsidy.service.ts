/**
 * Subsidy settings service.
 *
 * Admin settings live behind `/api/common/subsidy-settings/`; the calculator is
 * the public endpoint every client (admin preview, webapp, AI) has to call so
 * that no subsidy formula is duplicated on the frontend.
 */

import { apiClient } from '../../lib/api-client'
import type {
	SubsidyCalculation,
	SubsidyCalculationInput,
	SubsidySettings,
	SubsidySettingsPatchInput,
} from '../../types/subsidy'

const SETTINGS_ENDPOINT = '/api/common/subsidy-settings/'
const CALCULATOR_ENDPOINT = '/api/common/public/subsidy-calculator/'

function toRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null
	}

	return value as Record<string, unknown>
}

function unwrapData(payload: unknown): Record<string, unknown> | null {
	const record = toRecord(payload)
	if (!record) {
		return null
	}

	return toRecord(record.data) ?? record
}

function readNumber(value: unknown, fallback: number): number {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value
	}

	if (typeof value === 'string') {
		const parsed = Number(value.trim())
		if (Number.isFinite(parsed)) {
			return parsed
		}
	}

	return fallback
}

function readBoolean(value: unknown, fallback: boolean): boolean {
	if (typeof value === 'boolean') {
		return value
	}

	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase()
		if (normalized === 'true') {
			return true
		}
		if (normalized === 'false') {
			return false
		}
	}

	return fallback
}

function readPowers(value: unknown): number[] {
	if (!Array.isArray(value)) {
		return []
	}

	return value
		.map(item => readNumber(item, Number.NaN))
		.filter(item => Number.isFinite(item) && item > 0)
		.sort((first, second) => first - second)
}

function readString(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim().length ? value : undefined
}

function mapSettings(payload: unknown): SubsidySettings {
	const dto = unwrapData(payload) ?? {}

	return {
		is_active: readBoolean(dto.is_active, false),
		subsidy_percent: readNumber(dto.subsidy_percent, 0),
		max_subsidy_amount: readNumber(dto.max_subsidy_amount, 0),
		max_power_kw: readNumber(dto.max_power_kw, 0),
		guide_powers: readPowers(dto.guide_powers),
		updated_at: readString(dto.updated_at),
		updated_by: readString(dto.updated_by),
	}
}

function mapCalculation(payload: unknown): SubsidyCalculation {
	const dto = unwrapData(payload) ?? {}
	const basePrice = readNumber(dto.base_price, 0)

	return {
		base_price: basePrice,
		subsidy_amount: readNumber(dto.subsidy_amount, 0),
		customer_amount: readNumber(dto.customer_amount, basePrice),
		subsidy_reference_power_kw: readNumber(dto.subsidy_reference_power_kw, 0),
		subsidy_percent: readNumber(dto.subsidy_percent, 0),
		max_subsidy_amount: readNumber(dto.max_subsidy_amount, 0),
		subsidy_enabled: readBoolean(dto.subsidy_enabled, true),
	}
}

/**
 * Decimal fields are sent as strings so DRF's DecimalField keeps the exact
 * value the admin typed instead of a float round-trip.
 */
function toDecimalString(value: number | string): string {
	if (typeof value === 'string') {
		return value.trim()
	}

	return String(value)
}

function buildSettingsPayload(
	input: SubsidySettingsPatchInput,
): Record<string, unknown> {
	const payload: Record<string, unknown> = {}

	if (input.is_active !== undefined) {
		payload.is_active = input.is_active
	}
	if (input.subsidy_percent !== undefined) {
		payload.subsidy_percent = toDecimalString(input.subsidy_percent)
	}
	if (input.max_subsidy_amount !== undefined) {
		payload.max_subsidy_amount = toDecimalString(input.max_subsidy_amount)
	}
	if (input.max_power_kw !== undefined) {
		payload.max_power_kw = Math.trunc(input.max_power_kw)
	}
	if (input.guide_powers !== undefined) {
		payload.guide_powers = input.guide_powers.map(power => Math.trunc(power))
	}

	return payload
}

export async function getSubsidySettings(): Promise<SubsidySettings> {
	const { data } = await apiClient.get<unknown>(SETTINGS_ENDPOINT)
	return mapSettings(data)
}

export async function patchSubsidySettings(
	input: SubsidySettingsPatchInput,
): Promise<SubsidySettings> {
	const { data } = await apiClient.patch<unknown>(
		SETTINGS_ENDPOINT,
		buildSettingsPayload(input),
	)
	return mapSettings(data)
}

export async function calculateSubsidy(
	input: SubsidyCalculationInput,
): Promise<SubsidyCalculation> {
	const payload: Record<string, unknown> = {
		panel_type: input.panel_type,
		inverter_type: input.inverter_type,
		requested_power_kw: Math.trunc(input.requested_power_kw),
	}

	if (input.audit_power_kw !== undefined && input.audit_power_kw !== null) {
		payload.audit_power_kw = Math.trunc(input.audit_power_kw)
	}

	const { data } = await apiClient.post<unknown>(CALCULATOR_ENDPOINT, payload)
	return mapCalculation(data)
}

export const apiSubsidyService = {
	getSettings: getSubsidySettings,
	patchSettings: patchSubsidySettings,
	calculate: calculateSubsidy,
}
