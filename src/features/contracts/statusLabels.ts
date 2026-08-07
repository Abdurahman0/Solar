import type { Contract } from '../../services/contracts'

export type ContractStatus = Contract['status']

/**
 * Visual tone for a contract/order status badge. Shared by the contracts
 * screens and the client/webapp order cards so a status always looks the same.
 */
export function getContractStatusTone(
	status: string,
): 'info' | 'warning' | 'accent' | 'success' | 'danger' {
	if (status === 'paid' || status === 'completed') {
		return 'success'
	}
	if (status === 'canceled') {
		return 'danger'
	}
	if (status === 'audit_paid' || status === 'contract_ready' || status === 'in_lot') {
		return 'accent'
	}
	if (status === 'draft') {
		return 'info'
	}
	return 'warning'
}

/**
 * Localized (uz/ru) label for a contract/order status. Unknown statuses fall
 * back to the raw value so new backend statuses still render safely.
 */
export function getContractStatusLabel(status: string, isRu: boolean): string {
	if (isRu) {
		const map: Record<string, string> = {
			draft: 'Черновик',
			audit_pending: 'Аудит ожидается',
			audit_paid: 'Аудит оплачен',
			moderation: 'Модерация',
			contract_ready: 'Договор готов',
			payment_pending: 'Ожидает оплату',
			paid: 'Оплачен',
			in_lot: 'Выставлен в лот',
			completed: 'Завершен',
			canceled: 'Отменен',
		}
		return map[status] ?? status
	}

	const map: Record<string, string> = {
		draft: 'Qoralama',
		audit_pending: 'Audit kutilmoqda',
		audit_paid: "Audit to'langan",
		moderation: 'Moderatsiya',
		contract_ready: 'Shartnoma tayyor',
		payment_pending: "To'lov kutilmoqda",
		paid: "To'langan",
		in_lot: "Lotga qo'yilgan",
		completed: 'Yakunlandi',
		canceled: 'Bekor qilingan',
	}
	return map[status] ?? status
}
