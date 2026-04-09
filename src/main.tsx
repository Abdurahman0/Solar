import React from 'react'
import ReactDOM from 'react-dom/client'
import { initializeServices } from './services/registry'
import './i18n'
import './styles/tailwind.css'

// Initialize services at app startup
const apiBaseUrl =
	import.meta.env.VITE_API_BASE_URL ||
	import.meta.env.VITE_API_URL ||
	'http://localhost:8000'
initializeServices(apiBaseUrl)

try {
	const storedTheme = window.localStorage.getItem('solar-theme')

	if (storedTheme === 'dark' || storedTheme === 'light') {
		document.documentElement.dataset.theme = storedTheme
	}
} catch {
	// Ignore storage access issues and fall back to the default theme.
}

const root = ReactDOM.createRoot(document.getElementById('root')!)

void import('./App').then(({ default: App }) => {
	root.render(
		<React.StrictMode>
			<App />
		</React.StrictMode>,
	)
})
