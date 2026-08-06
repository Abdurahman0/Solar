import type { Client } from '../../services/contracts'

/**
 * A client is considered a WebApp client when it carries a Telegram WebApp
 * user id in its metadata (or has WebApp checkout items). These records keep
 * source_platform === 'telegram', so metadata is the only reliable
 * discriminator between a regular Telegram lead and a WebApp buyer.
 *
 * Used to keep WebApp buyers on their own page and out of the main client
 * queue.
 */
export function isWebappClient(client: Client): boolean {
	const metadata = client.metadata
	if (!metadata || typeof metadata !== 'object') {
		return false
	}

	const record = metadata as Record<string, unknown>
	if (record.webapp_user_id) {
		return true
	}

	const checkout = record.webapp_checkout_items
	return Array.isArray(checkout) && checkout.length > 0
}
