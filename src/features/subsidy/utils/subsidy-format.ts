import { DEFAULT_CURRENCY_LABEL, formatCurrencyAmount } from '../../../constants'

/** Grouped digits for money inputs: `20600000` -> `20 600 000`. */
export function formatAmountInput(value: string): string {
	const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
	if (!digits.length) {
		return ''
	}

	return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/** Raw digits the backend expects: `20 600 000` -> `20600000`. */
export function parseAmountInput(value: string): string {
	return value.replace(/\D/g, '')
}

export function formatAmount(value: number, locale: string): string {
	return formatCurrencyAmount(value, locale)
}

export function formatPercent(value: number, locale: string): string {
	return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)}%`
}

export function formatPower(value: number, locale: string): string {
	return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)} kW`
}

export { DEFAULT_CURRENCY_LABEL }
