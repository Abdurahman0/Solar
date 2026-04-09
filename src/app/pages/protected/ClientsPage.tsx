import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import AppIcon from '../../../components/shared/icons/AppIcon';
import { EmptyState, PageHeader, PageLayout, PageSection } from '../../../components/shared/page';
import ClientDeleteDialog from '../../../features/clients/components/ClientDeleteDialog';
import { ClientsDetailPanel } from '../../../features/clients/components/ClientsDetailPanel';
import { ClientsFormPanel } from '../../../features/clients/components/ClientsFormPanel';
import { ClientsListView } from '../../../features/clients/components/ClientsListView';
import { services } from '../../../services';
import { useAuth } from '../../../auth';
import type { Client } from '../../../services/contracts';

function ClientsPage() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const isRu = i18n.language === 'ru';
  const { hasPermission } = useAuth();
  const canManageClients = hasPermission('can_manage_clients');

  const tx = isRu
    ? {
        eyebrow: 'Клиентская воронка',
        title: 'Клиенты',
        subtitle: 'Ведите клиентов, отслеживайте статусы и работайте с карточками в едином пространстве.',
        newClient: 'Новый клиент',
        visible: 'видно',
        detailOpen: 'Профиль открыт',
        errorTitle: 'Клиенты недоступны',
        errorDescription: 'Не удалось загрузить список клиентов.',
      }
    : {
        eyebrow: 'Mijoz voronkasi',
        title: 'Mijozlar',
        subtitle: 'Mijozlarni boshqaring, holatlarni kuzating va kartochkalar bilan yagona oynada ishlang.',
        newClient: 'Yangi mijoz',
        visible: "ko'rinmoqda",
        detailOpen: 'Profil ochiq',
        errorTitle: 'Mijozlar mavjud emas',
        errorDescription: 'Mijozlar ro`yxatini yuklab bo`lmadi.',
      };

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [stats, setStats] = useState({ visible: 0, total: 0, loading: true });
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setSelectedClientId(null);
    setIsFormOpen(false);
    setEditingClient(null);
    setClientToDelete(null);
    setIsDeleting(false);
  }, [location.pathname]);

  function openCreateForm() {
    setEditingClient(null);
    setIsFormOpen(true);
  }

  function openEditForm(client: Client) {
    setEditingClient(client);
    setIsFormOpen(true);
  }

  function handleClientSaved(client: Client) {
    setIsFormOpen(false);
    setEditingClient(null);
    setSelectedClientId(client.id);
    setListRefreshKey((current) => current + 1);
  }

  function handleDeleteFromList(client: Client) {
    setClientToDelete(client);
  }

  async function handleConfirmDelete() {
    if (!clientToDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await services.clients.deleteClient(clientToDelete.id);
      if (selectedClientId === clientToDelete.id) {
        setSelectedClientId(null);
      }
      setClientToDelete(null);
      setListRefreshKey((current) => current + 1);
    } catch {
      setHasError(true);
    } finally {
      setIsDeleting(false);
    }
  }

  const header = (
    <PageHeader
      eyebrow={tx.eyebrow}
      title={tx.title}
      subtitle={tx.subtitle}
      actions={
        <div className="flex w-full flex-wrap items-center gap-2 min-[768px]:w-auto">
          {canManageClients ? (
            <button
              type="button"
              className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition duration-fast hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              onClick={openCreateForm}
            >
              <AppIcon name="plus" className="h-4 w-4" aria-hidden="true" />
              {tx.newClient}
            </button>
          ) : null}
          <span className="inline-flex min-h-8 items-center gap-2 rounded-pill bg-success-bg px-3 text-[12px] font-semibold text-success">
            <AppIcon name="clients" className="h-3.5 w-3.5" aria-hidden="true" />
            {stats.visible} {tx.visible}
          </span>
          {selectedClientId ? (
            <span className="inline-flex min-h-8 items-center gap-2 rounded-pill bg-primary/12 px-3 text-[12px] font-semibold text-text-accent">
              <AppIcon name="user" className="h-3.5 w-3.5" aria-hidden="true" />
              {tx.detailOpen}
            </span>
          ) : null}
        </div>
      }
    />
  );

  if (hasError) {
    return (
      <PageLayout header={header}>
        <EmptyState title={tx.errorTitle} description={tx.errorDescription} />
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout header={header}>
        <PageSection>
          <ClientsListView
            key={listRefreshKey}
            onRowClick={(client) => setSelectedClientId(client.id)}
            onEditClient={openEditForm}
            onDeleteClient={handleDeleteFromList}
            selectedClientId={selectedClientId}
            canManageClients={canManageClients}
            onStatsChange={(next) => {
              setStats(next);
              if (!next.loading) {
                setHasError(false);
              }
            }}
          />
        </PageSection>
      </PageLayout>

      {selectedClientId ? (
        <div
          className="fixed inset-0 z-[140] flex justify-end bg-background-overlay/72 backdrop-blur-[3px]"
          role="presentation"
          onClick={() => setSelectedClientId(null)}
        >
          <div
            className="h-full w-full max-w-[520px] overflow-y-auto bg-background-subtle p-4 shadow-xl ring-1 ring-border-soft/50 min-[641px]:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <ClientsDetailPanel
              clientId={selectedClientId}
              onClose={() => setSelectedClientId(null)}
              onEdit={(client: Client) => {
                setSelectedClientId(null);
                openEditForm(client);
              }}
              onRequestDelete={(client: Client) => {
                setSelectedClientId(null);
                setClientToDelete(client);
              }}
            />
          </div>
        </div>
      ) : null}

      {isFormOpen ? (
        <div
          className="fixed inset-0 z-[150] flex justify-end bg-background-overlay/72 backdrop-blur-[3px]"
          role="presentation"
          onClick={() => setIsFormOpen(false)}
        >
          <div
            className="h-full w-full max-w-[560px] overflow-y-auto bg-background-subtle p-4 shadow-xl ring-1 ring-border-soft/50 min-[641px]:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <ClientsFormPanel
              client={editingClient ?? undefined}
              onClose={() => {
                setIsFormOpen(false);
                setEditingClient(null);
              }}
              onSuccess={handleClientSaved}
            />
          </div>
        </div>
      ) : null}

      {clientToDelete ? (
        <ClientDeleteDialog
          client={clientToDelete}
          isDeleting={isDeleting}
          onCancel={() => {
            if (!isDeleting) {
              setClientToDelete(null);
            }
          }}
          onConfirm={() => {
            void handleConfirmDelete();
          }}
        />
      ) : null}
    </>
  );
}

export default ClientsPage;
