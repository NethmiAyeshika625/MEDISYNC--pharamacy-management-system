import { useEffect, useMemo, useState } from 'react';
import { Check, PackageX } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { request } from '../../lib/api';
import { useSocketFeed } from '../useSocketFeed';
import PrescriptionCard from '../../components/PrescriptionCard';

const decisionActions = [
  { status: 'approved', label: 'Approve', icon: Check, className: 'bg-emerald-500 hover:bg-emerald-600' },
  { status: 'rejected', label: 'Reject', icon: PackageX, className: 'bg-rose-500 hover:bg-rose-600' }
];

export default function PharmacistPrescriptions() {
  const { user, socket } = useAuth();
  const pharmacyId = user?.pharmacyId || user?.pharmacy?._id || '';
  const [pharmacy, setPharmacy] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [message, setMessage] = useState('');

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
  }

  useEffect(() => {
    loadData().catch((error) => setMessage(error.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId]);

  useSocketFeed(socket, 'pharmacy', pharmacyId, () => {
    loadData().catch(() => {});
  });

  const inventoryCount = useMemo(() => pharmacy?.medicines?.length || 0, [pharmacy]);
  async function saveDecision(prescriptionId, status) {
    try {
      await request(`/api/prescriptions/${prescriptionId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status
        })
      });
      await loadData();
      setMessage(`Prescription ${status}.`);
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

            <div className="mt-4 flex flex-wrap gap-3">
              {decisionActions.map((action) => {
                const isActive = prescription.status === action.status;

                return (
                  <button
                    key={action.status}
                    type="button"
                    onClick={() => saveDecision(prescription._id, action.status)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition ${action.className} ${isActive ? 'ring-4 ring-offset-2 ring-slate-200' : ''}`}
                  >
                    <action.icon size={14} />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </PrescriptionCard>
        ))}
        {!prescriptions.length ? <div className="medisync-empty">No prescriptions received yet.</div> : null}
      </section>

      {message ? <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">{message}</div> : null}
    </div>
  );
}
