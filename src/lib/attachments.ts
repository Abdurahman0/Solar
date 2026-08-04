export type AttachmentKind =
	| 'image'
	| 'pdf'
	| 'doc'
	| 'sheet'
	| 'archive'
	| 'other'

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'heic', 'heif']
const DOC_EXTENSIONS = ['doc', 'docx', 'rtf', 'odt', 'txt']
const SHEET_EXTENSIONS = ['xls', 'xlsx', 'csv', 'ods']
const ARCHIVE_EXTENSIONS = ['zip', 'rar', '7z', 'tar', 'gz']

function getPathname(url: string): string {
	try {
		return new URL(url).pathname
	} catch {
		return (url.split('?')[0] ?? url).split('#')[0] ?? url
	}
}

export function getAttachmentFilename(url: string): string {
	if (!url) {
		return '-'
	}

	const raw = getPathname(url).split('/').filter(Boolean).pop() ?? ''

	try {
		return decodeURIComponent(raw) || url
	} catch {
		return raw || url
	}
}

export function getFileExtension(nameOrUrl: string): string {
	if (!nameOrUrl) {
		return ''
	}

	const name = getAttachmentFilename(nameOrUrl)
	if (!name.includes('.')) {
		return ''
	}

	return name.split('.').pop()?.toLowerCase() ?? ''
}

export function getAttachmentKind(nameOrUrl: string, mimeType?: string): AttachmentKind {
	const mime = mimeType?.toLowerCase() ?? ''
	if (mime.startsWith('image/')) {
		return 'image'
	}
	if (mime === 'application/pdf') {
		return 'pdf'
	}

	const ext = getFileExtension(nameOrUrl)
	if (IMAGE_EXTENSIONS.includes(ext)) {
		return 'image'
	}
	if (ext === 'pdf') {
		return 'pdf'
	}
	if (DOC_EXTENSIONS.includes(ext)) {
		return 'doc'
	}
	if (SHEET_EXTENSIONS.includes(ext)) {
		return 'sheet'
	}
	if (ARCHIVE_EXTENSIONS.includes(ext)) {
		return 'archive'
	}

	return 'other'
}

export function isImageAttachment(nameOrUrl: string, mimeType?: string): boolean {
	return getAttachmentKind(nameOrUrl, mimeType) === 'image'
}

export function getAttachmentTypeLabel(nameOrUrl: string, mimeType?: string): string {
	const ext = getFileExtension(nameOrUrl)
	if (ext) {
		return ext.toUpperCase()
	}

	const mime = mimeType?.split('/').pop()?.toUpperCase() ?? ''
	if (mime) {
		return mime
	}

	return getAttachmentKind(nameOrUrl, mimeType) === 'image' ? 'IMAGE' : 'FILE'
}

export function getAttachmentIconName(
	nameOrUrl: string,
	mimeType?: string
): 'image' | 'file' | 'archive' | 'table' {
	switch (getAttachmentKind(nameOrUrl, mimeType)) {
		case 'image':
			return 'image'
		case 'sheet':
			return 'table'
		case 'archive':
			return 'archive'
		default:
			return 'file'
	}
}

export function formatFileSize(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes < 0) {
		return ''
	}
	if (bytes < 1024) {
		return `${bytes} B`
	}
	if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(1)} KB`
	}
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
