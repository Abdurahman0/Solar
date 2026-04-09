import { useState } from 'react'
import { ClientsDetailPanel } from '../../../features/clients/components/ClientsDetailPanel'
import { ClientsFormPanel } from '../../../features/clients/components/ClientsFormPanel'
import { ClientsListView } from '../../../features/clients/components/ClientsListView'
import type { Client } from '../../../services/contracts'

function ClientsPage() {
	const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
	const [editingClient, setEditingClient] = useState<Client | null>(null)
	const [isFormOpen, setIsFormOpen] = useState(false)
	const [listRefreshKey, setListRefreshKey] = useState(0)

	function openCreateForm() {
		setEditingClient(null)
		setIsFormOpen(true)
	}

	function openEditForm(client: Client) {
		setEditingClient(client)
		setIsFormOpen(true)
	}

	function handleClientSaved(client: Client) {
		setIsFormOpen(false)
		setEditingClient(null)
		setSelectedClientId(client.id)
		setListRefreshKey(current => current + 1)
	}

	return (
		<>
			<div className='p-6'>
				<ClientsListView
					key={listRefreshKey}
					onCreateNew={openCreateForm}
					onRowClick={client => setSelectedClientId(client.id)}
				/>
			</div>

			{selectedClientId ? (
				<div
					className='fixed inset-0 z-[140] flex justify-end bg-background-overlay/70 p-3'
					role='presentation'
					onClick={() => setSelectedClientId(null)}
				>
					<div
						className='h-full w-full max-w-[780px] overflow-y-auto rounded-xl bg-surface-card ring-1 ring-border-soft/45'
						onClick={event => event.stopPropagation()}
					>
						<ClientsDetailPanel
							clientId={selectedClientId}
							onClose={() => setSelectedClientId(null)}
							onEdit={(client: Client) => {
								setSelectedClientId(null)
								openEditForm(client)
							}}
							onDelete={() => {
								setSelectedClientId(null)
								setListRefreshKey(current => current + 1)
							}}
						/>
					</div>
				</div>
			) : null}

			{isFormOpen ? (
				<div
					className='fixed inset-0 z-[150] grid place-items-center bg-background-overlay/70 p-3'
					role='presentation'
					onClick={() => setIsFormOpen(false)}
				>
					<div
						className='w-full max-w-[860px] overflow-hidden rounded-xl bg-surface-card ring-1 ring-border-soft/45'
						onClick={event => event.stopPropagation()}
					>
						<ClientsFormPanel
							client={editingClient ?? undefined}
							onClose={() => {
								setIsFormOpen(false)
								setEditingClient(null)
							}}
							onSuccess={handleClientSaved}
						/>
					</div>
				</div>
			) : null}
		</>
	)
}

export default ClientsPage
