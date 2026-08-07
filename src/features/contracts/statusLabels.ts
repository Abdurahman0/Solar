import type { Contract } from '../../services/contracts'

export type ContractStatus = Contract['status']

/**
 * Contract/order workflow statuses in pipeline order. Shared by status pickers.
 * Note: "Yo'lda" (in transit) is NOT here — it lives on `delivery_status`
 * (in_transit), a separate field. See DELIVERY_STATUSES below.
 */
export const CONTRACT_STATUSES: ContractStatus[] = [
	'draft',
	'audit_pending',
	'audit_paid',
	'moderation',
	'contract_ready',
	'payment_pending',
	'paid',
	'in_lot',
	'completed',
	'canceled',
]

export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered'

/** Delivery progress values (order route). `in_transit` shows as "Yo'lda". */
export const DELIVERY_STATUSES: DeliveryStatus[] = ['pending', 'in_transit', 'delivered']

export function getDeliveryStatusTone(
	status: string,
): 'info' | 'warning' | 'accent' | 'success' | 'danger' {
	if (status === 'delivered') {
		return 'success'
	}
	if (status === 'in_transit') {
		return 'accent'
	}
	return 'warning'
}

/** Localized (uz/ru) label for a delivery status. */
export function getDeliveryStatusLabel(status: string, isRu: boolean): string {
	if (isRu) {
		const map: Record<string, string> = {
			pending: 'Ожидает',
			in_transit: 'В пути',
			delivered: 'Доставлен',
		}
		return map[status] ?? status
	}

	const map: Record<string, string> = {
		pending: 'Kutilmoqda',
		in_transit: "Yo'lda",
		delivered: 'Yetkazildi',
	}
	return map[status] ?? status
}

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
	if (
		status === 'audit_paid' ||
		status === 'contract_ready' ||
		status === 'in_lot' ||
		status === 'on_the_way'
	) {
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
			on_the_way: 'В пути',
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
		on_the_way: "Yo'lda",
		completed: 'Yakunlandi',
		canceled: 'Bekor qilingan',
	}
	return map[status] ?? status
}
