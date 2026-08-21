export interface ParsedApiError {
	/** Field name -> first message, for inline errors under the inputs. */
	fieldErrors: Record<string, string>
	/** Non-field message, shown as a toast/banner. */
	message: string | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null
	}

	return value as Record<string, unknown>
}

function readMessage(value: unknown): string | null {
	if (typeof value === 'string' && value.trim().length) {
		return value.trim()
	}

	if (Array.isArray(value)) {
		for (const item of value) {
			const message = readMessage(item)
			if (message) {
				return message
			}
		}
	}

	return null
}

const GENERAL_ERROR_KEYS = ['detail', 'message', 'error', 'non_field_errors']

export function parseApiError(
	error: unknown,
	fallback: string,
): ParsedApiError {
	const response = asRecord(asRecord(error)?.response)
	const data = asRecord(response?.data)

	if (!data) {
		return { fieldErrors: {}, message: fallback }
	}

	const fieldErrors: Record<string, string> = {}
	let message: string | null = null

	const errorSource = asRecord(data.errors) ?? data

	Object.entries(errorSource).forEach(([key, value]) => {
		if (key === 'status') {
			return
		}

		const parsed = readMessage(value)
		if (!parsed) {
			return
		}

		if (GENERAL_ERROR_KEYS.includes(key)) {
			message = message ?? parsed
			return
		}

		fieldErrors[key] = parsed
	})

	if (!message && !Object.keys(fieldErrors).length) {
		message = fallback
	}

	return { fieldErrors, message }
}
