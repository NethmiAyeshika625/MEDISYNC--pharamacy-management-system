import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Phone, Star, ShieldCheck } from 'lucide-react';
import { request } from '../lib/api';

const panelClass = 'medisync-panel';
const fieldClass = 'medisync-input';
const selectClass = 'medisync-select';
const textAreaClass = 'medisync-textarea';
const primaryButtonClass = 'medisync-button-primary w-full';
const accentButtonClass = 'medisync-button-accent w-full';
const emptyClass = 'medisync-empty';

export default function PharmacyDetail() {
  const { id } = useParams();
  const [pharmacy, setPharmacy] = useState(null);
  const [form, setForm] = useState({ text: '', rating: 5, comment: '', description: '', imageUrl: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState('');
  const [showStockAvailability, setShowStockAvailability] = useState(false);

  useEffect(() => {
    request(`/api/pharmacies/${id}`)
      .then((pharmacyData) => {
        setPharmacy(pharmacyData);
      })
      .catch((error) => setMessage(error.message));
  }, [id]);

  async function sendMessage(event) {
    event.preventDefault();
    try {
      await request(`/api/pharmacies/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: form.text })
      });
      setForm({ ...form, text: '' });
      setMessage('Message sent to the pharmacy team.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function uploadPrescription(event) {
    event.preventDefault();
    try {
      let imageUrl = form.imageUrl;
      if (file) {
        const uploadRes = await (await import('../lib/api')).uploadFile(file);
        imageUrl = uploadRes.downloadUrl;
      }

      await request('/api/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          pharmacyId: id,
          description: form.description,
          imageUrl,
          patientNote: 'Uploaded from pharmacy detail page'
        })
      });
      setForm({ ...form, description: '', imageUrl: '' });
      setFile(null);
      setPreview('');
      setMessage('Prescription uploaded for this pharmacy.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!pharmacy) {
    return <div className={panelClass}>Loading pharmacy details...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className={panelClass}>
          <p className="medisync-kicker w-fit text-slate-500">Public profile</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">{pharmacy.name}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{pharmacy.description}</p>
          <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
            <p><span className="font-semibold text-slate-950">Location:</span> {pharmacy.locationLabel}, {pharmacy.city}</p>
            <p><span className="font-semibold text-slate-950">Hours:</span> {pharmacy.openingHours}</p>
            <p className="flex items-center gap-2"><Phone size={14} /> {pharmacy.phone}</p>
            <p className="flex items-center gap-2"><ShieldCheck size={14} /> {pharmacy.deliveryEnabled ? `Delivery fee ${pharmacy.deliveryFee}` : 'Pickup only'}</p>
          </div>
        </div>

        <div className={panelClass}>
          <p className="medisync-kicker w-fit text-slate-500">Pharmacist details</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-950">{pharmacy.pharmacist?.name}</h3>
          <p className="mt-2 text-sm text-slate-600">Role: licensed pharmacist</p>
        </div>
      </section>

      <section className={panelClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="medisync-kicker w-fit text-slate-500">Stock availability</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-950">Public medicine preview</h3>
            <p className="mt-2 text-sm text-slate-600">Patients can see only the medicine name, brand, and live availability. Counts and expiry stay private for pharmacists.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowStockAvailability((current) => !current)}
            className="medisync-button-accent w-full sm:w-auto"
          >
            {showStockAvailability ? 'Hide stock availability' : 'Show stock availability'}
          </button>
        </div>

        {showStockAvailability ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(pharmacy.medicinePreview || pharmacy.medicines || []).map((medicine, index) => (
              <div key={`stock-${index}-${medicine.name}-${medicine.brand}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Medicine availability</p>
                <h4 className="mt-2 text-lg font-bold text-slate-950">{medicine.name}</h4>
                <p className="text-sm text-slate-600">{medicine.brand}</p>
                <div className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${medicine.available ? 'bg-teal-50 text-teal-800' : 'bg-rose-50 text-rose-800'}`}>
                  {medicine.available ? 'In stock' : 'Out of stock'}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={sendMessage} className={panelClass}>
          <h3 className="text-xl font-bold text-slate-950">Message pharmacist</h3>
          <textarea className={`mt-4 ${textAreaClass} min-h-28`} placeholder="Ask about availability or order status" value={form.text} onChange={(event) => setForm({ ...form, text: event.target.value })} />
          <button className="medisync-button-primary mt-4 w-full">Send message</button>
        </form>

        <form onSubmit={uploadPrescription} className={panelClass}>
          <h3 className="text-xl font-bold text-slate-950">Upload prescription</h3>
          <textarea className="mt-4 medisync-textarea min-h-28" placeholder="Prescription description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div>
            <input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              if (f) setPreview(URL.createObjectURL(f));
            }} />
            {preview ? <img src={preview} alt="preview" className="mt-3 max-h-40 w-full rounded-2xl object-cover" /> : null}
          </div>
          <button className="medisync-button-primary mt-4 w-full">Upload to pharmacy</button>
        </form>
      </section>

      {message ? <p className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">{message}</p> : null}
    </div>
  );
}
