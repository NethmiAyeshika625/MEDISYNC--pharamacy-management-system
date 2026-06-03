import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { request } from '../../lib/api';
import { useSocketFeed } from '../useSocketFeed';
import PrescriptionCard from '../../components/PrescriptionCard';

export default function PatientPrescriptions() {
  const { user, socket } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [message, setMessage] = useState('');

  async function loadPrescriptions() {
    const data = await request('/api/prescriptions/me');
    setPrescriptions(data);
  }

  useEffect(() => {
    loadPrescriptions().catch((error) => setMessage(error.message));
  }, []);

  useSocketFeed(socket, 'patient', user?.id, () => {
    loadPrescriptions().catch(() => {});
  });

  return (
    <div className="space-y-6">

      {message && (
        <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">
          {message}
        </div>
      )}

      <section className="grid gap-4">

        {prescriptions.map((prescription) => (
          <PrescriptionCard key={prescription._id} prescription={prescription}>

            <div className="space-y-2 text-sm text-slate-600">
              <p>
                Pharmacy:{" "}
                <span className="font-semibold text-slate-950">
                  {prescription.pharmacy?.name}
                </span>
              </p>

              <p>
                Status:{" "}
                <span className="font-semibold">
                  {prescription.status}
                </span>
              </p>

              <p>
                Patient note:{" "}
                {prescription.patientNote || 'No patient note provided.'}
              </p>

              {prescription.pharmacistNote && (
                <p>
                  Pharmacist note: {prescription.pharmacistNote}
                </p>
              )}
            </div>

          </PrescriptionCard>
        ))}

        {!prescriptions.length && (
          <div className="medisync-empty">
            No prescriptions found yet.
          </div>
        )}

      </section>
    </div>
  );
}