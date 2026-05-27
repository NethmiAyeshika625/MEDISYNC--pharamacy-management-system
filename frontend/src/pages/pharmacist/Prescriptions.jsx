import { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, PackageCheck, PackageX, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { request } from '../../lib/api';
import { useSocketFeed } from '../useSocketFeed';
import PrescriptionCard from '../../components/PrescriptionCard';

const statusActions = [
  { status: 'approved', label: 'Approve', icon: Check },
  { status: 'rejected', label: 'Reject', icon: PackageX },
  { status: 'preparing', label: 'Preparing', icon: Clock3 },
  { status: 'ready', label: 'Ready', icon: PackageCheck }
];

export default function PharmacistPrescriptions() {
  const { user, socket } = useAuth();
  const pharmacyId = user?.pharmacyId || user?.pharmacy?._id || '';
  const [pharmacy, setPharmacy] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [message, setMessage] = useState('');

  function makeDraft(prescription) {
    return {
      status: prescription.status || 'pending',
      pharmacistNote: prescription.pharmacistNote || '',
      itemsJson: JSON.stringify(prescription.items || [], null, 2),
      subtotal: prescription.subtotal ?? '',
      deliveryFee: prescription.deliveryFee ?? '',
      total: prescription.total ?? ''
    };
  }

  function syncDrafts(data) {
    setDrafts(
      Object.fromEntries(
        data.map((prescription) => [prescription._id, drafts[prescription._id] || makeDraft(prescription)])
      )
    );
  }

  async function loadData() {
    if (!pharmacyId) {
      return;
    }

    const [pharmacyData, prescriptionsData] = await Promise.all([
      request(`/api/pharmacies/${pharmacyId}`),
      request(`/api/prescriptions/pharmacy/${pharmacyId}`)
    ]);

    setPharmacy(pharmacyData);
    setPrescriptions(prescriptionsData);
    syncDrafts(prescriptionsData);
  }

  useEffect(() => {
    loadData().catch((error) => setMessage(error.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId]);

  useSocketFeed(socket, 'pharmacy', pharmacyId, () => {
    loadData().catch(() => {});
  });

  const inventoryCount = useMemo(() => pharmacy?.medicines?.length || 0, [pharmacy]);

  function updateDraft(prescriptionId, field, value) {
    setDrafts((current) => ({
      ...current,
      [prescriptionId]: {
        ...(current[prescriptionId] || {}),
        [field]: value
      }
    }));
  }

  async function savePrescription(prescriptionId) {
    const draft = drafts[prescriptionId] || {};
    let items = undefined;

    try {
      if (typeof draft.itemsJson === 'string' && draft.itemsJson.trim()) {
        items = JSON.parse(draft.itemsJson);
      }
    } catch (_error) {
      setMessage('Items must be valid JSON array data.');
      return;
    }

    try {
      await request(`/api/prescriptions/${prescriptionId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: draft.status,
          pharmacistNote: draft.pharmacistNote,
          items,
          subtotal: draft.subtotal === '' ? undefined : Number(draft.subtotal),
          deliveryFee: draft.deliveryFee === '' ? undefined : Number(draft.deliveryFee),
          total: draft.total === '' ? undefined : Number(draft.total)
        })
      });
      await loadData();
      setMessage('Prescription saved.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="space-y-6">
      <section className="medisync-panel">
        <p className="medisync-kicker w-fit text-slate-500">Pharmacy queue</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">{pharmacy?.name || 'No pharmacy assigned'}</h2>
        <p className="mt-2 text-sm text-slate-600">{pharmacy?.description || 'Link this pharmacist account to a pharmacy record.'}</p>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
          <p><span className="font-semibold text-slate-950">Location:</span> {pharmacy ? `${pharmacy.locationLabel}, ${pharmacy.city}` : 'Unknown'}</p>
          <p><span className="font-semibold text-slate-950">Medicines:</span> {inventoryCount}</p>
          <p><span className="font-semibold text-slate-950">Delivery:</span> {pharmacy?.deliveryEnabled ? 'Enabled' : 'Pickup only'}</p>
        </div>
      </section>

      <section className="grid gap-4">
        {prescriptions.map((prescription) => (
          <PrescriptionCard key={prescription._id} prescription={prescription}>
            <div className="space-y-2 text-sm text-slate-600">
              <p>Patient: <span className="font-semibold text-slate-950">{prescription.patient?.name}</span></p>
              <p>Patient note: {prescription.patientNote || 'No patient note provided.'}</p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Status
                <select className="medisync-select mt-2" value={drafts[prescription._id]?.status || prescription.status} onChange={(event) => updateDraft(prescription._id, 'status', event.target.value)}>
                  {statusActions.map((action) => (
                    <option key={action.status} value={action.status}>{action.label}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Pharmacist note
                <input className="medisync-input mt-2" value={drafts[prescription._id]?.pharmacistNote || ''} onChange={(event) => updateDraft(prescription._id, 'pharmacistNote', event.target.value)} placeholder="Add a note for the patient" />
              </label>

              <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                Items JSON
                <textarea className="medisync-textarea mt-2 min-h-32 font-mono text-xs" value={drafts[prescription._id]?.itemsJson || '[]'} onChange={(event) => updateDraft(prescription._id, 'itemsJson', event.target.value)} placeholder='[{"name":"Paracetamol","brand":"Acme","price":4,"imageUrl":"/images/paracetamol.jpg"}]' />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Subtotal
                <input className="medisync-input mt-2" type="number" step="0.01" value={drafts[prescription._id]?.subtotal ?? ''} onChange={(event) => updateDraft(prescription._id, 'subtotal', event.target.value)} />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Delivery fee
                <input className="medisync-input mt-2" type="number" step="0.01" value={drafts[prescription._id]?.deliveryFee ?? ''} onChange={(event) => updateDraft(prescription._id, 'deliveryFee', event.target.value)} />
              </label>

              <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                Total
                <input className="medisync-input mt-2" type="number" step="0.01" value={drafts[prescription._id]?.total ?? ''} onChange={(event) => updateDraft(prescription._id, 'total', event.target.value)} />
              </label>
            </div>

            <button type="button" onClick={() => savePrescription(prescription._id)} className="medisync-button-primary mt-4 inline-flex w-full items-center justify-center gap-2">
              <Save size={14} />
              Save review
            </button>
          </PrescriptionCard>
        ))}
        {!prescriptions.length ? <div className="medisync-empty">No prescriptions received yet.</div> : null}
      </section>

      {message ? <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">{message}</div> : null}
    </div>
  );
}
