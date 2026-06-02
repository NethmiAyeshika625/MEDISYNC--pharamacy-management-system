import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, FileUp, MapPinned, UserRoundCog } from 'lucide-react';
import { createCheckoutSession, request } from '../lib/api';
import { useAuth } from '../context/useAuth';
import { useSocketFeed } from './useSocketFeed';
import StatCard from '../components/StatCard';
import PharmacyCard from '../components/PharmacyCard';
import PrescriptionCard from '../components/PrescriptionCard';
import UploadModal from '../components/UploadModal';

const panelClass = 'medisync-panel';
const cardClass = 'medisync-card';
const fieldClass = 'medisync-input';
const selectClass = 'medisync-select';
const textareaClass = 'medisync-textarea min-h-28';
const compactTextareaClass = 'medisync-textarea min-h-24';
const primaryButtonClass = 'medisync-button-primary w-full';
const accentButtonClass = 'medisync-button-accent w-full';
const emptyClass = 'medisync-empty';

const dashboardCards = [
  {
    title: 'Track orders',
    text: 'See pending, approved, rejected, preparing, and ready states in one place.',
    icon: ClipboardList
  },
  {
    title: 'Manage profile',
    text: 'Keep your patient details current so the pharmacy can reach you quickly.',
    icon: UserRoundCog
  }
];

export default function PatientDashboard() {
  const { user, socket, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [pharmacies, setPharmacies] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('');
  const [form, setForm] = useState({ description: '', imageUrl: '', patientNote: '' });
  const [orderForm, setOrderForm] = useState({ fulfillmentMode: 'pickup', paymentMethod: 'card', deliveryAddress: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState('');
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', avatarUrl: '' });
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  async function loadPharmacies() {
    const data = await request(`/api/pharmacies?search=${encodeURIComponent(search)}&city=${encodeURIComponent(city)}`);
    setPharmacies(data);
    if (!selectedPharmacyId && data[0]?._id) {
      setSelectedPharmacyId(data[0]._id);
    }
  }

  async function loadPrescriptions() {
    const data = await request('/api/prescriptions/me');
    setPrescriptions(data);
  }

  useEffect(() => {
    loadPharmacies().catch((error) => setMessage(error.message));
    loadPrescriptions().catch((error) => setMessage(error.message));
  }, []);

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      phone: user?.phone || '',
      avatarUrl: user?.avatarUrl || ''
    });
  }, [user]);

  useSocketFeed(socket, 'patient', user?.id, () => {
    loadPrescriptions().catch(() => {});
  });

  async function handleSearch(event) {
    event.preventDefault();
    try {
      await loadPharmacies();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function focusSearch() {
    if (searchRef.current) searchRef.current.focus();
  }

  function openSelectedPharmacyQuick() {
    if (!selectedPharmacyId) {
      setMessage('Please select a pharmacy from the search results first.');
      return;
    }
    navigate(`/pharmacies/${selectedPharmacyId}`);
  }

  function gotoOrders() {
    navigate('/orders');
  }

  function focusProfile() {
    if (profileRef.current) profileRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function handleUpload(event) {
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
          pharmacyId: selectedPharmacyId,
          description: form.description,
          imageUrl,
          patientNote: form.patientNote
        })
      });
      setForm({ description: '', imageUrl: '', patientNote: '' });
      setFile(null);
      setPreview('');
      setMessage('Prescription uploaded. The selected pharmacy will receive it instantly.');
      await loadPrescriptions();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function createOrderAndPay(prescription) {
    try {
      const order = await request('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          prescriptionId: prescription._id,
          fulfillmentMode: orderForm.fulfillmentMode,
          paymentMethod: orderForm.paymentMethod,
          deliveryAddress: orderForm.fulfillmentMode === 'delivery' ? orderForm.deliveryAddress : ''
        })
      });

      const session = await createCheckoutSession(order._id);
      window.location.href = session.url;
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    try {
      await updateProfile(profileForm);
      setMessage('Profile updated successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  const selectedPharmacy = useMemo(() => pharmacies.find((item) => item._id === selectedPharmacyId), [pharmacies, selectedPharmacyId]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-2">
        <StatCard label="Prescriptions" value={prescriptions.length} caption="Your private prescription history" />
        <StatCard label="Nearby results" value={pharmacies.length} tone="accent" caption="Filtered by name and city" />
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="medisync-card flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">Orders</p>
            <h3 className="mt-2 text-lg font-bold text-slate-950">My orders</h3>
            <p className="mt-2 text-sm text-slate-600">See and track your active and past orders.</p>
          </div>
          <div className="mt-4">
            <button type="button" onClick={gotoOrders} className="medisync-button-primary">View orders</button>
          </div>
        </div>

        <div className="medisync-card flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">Profile</p>
            <h3 className="mt-2 text-lg font-bold text-slate-950">Manage profile</h3>
            <p className="mt-2 text-sm text-slate-600">Jump to your profile editor to keep details up to date.</p>
          </div>
          <div className="mt-4">
            <button type="button" onClick={focusProfile} className="medisync-button-soft">Edit profile</button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className={cardClass}>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Icon size={18} /></span>
              <h2 className="mt-4 text-lg font-bold text-slate-950">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.text}</p>
            </div>
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className={panelClass}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="medisync-kicker w-fit text-slate-500">Search pharmacies</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">Find by name or location</h2>
            </div>
          </div>
          <form className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleSearch}>
            <input ref={searchRef} className={fieldClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pharmacy name" />
            <input className={fieldClass} value={city} onChange={(event) => setCity(event.target.value)} placeholder="City or location" />
            <button className="medisync-button-primary rounded-2xl px-5 py-3">Search</button>
          </form>
          <div className="mt-6 grid gap-4">
            {pharmacies.map((pharmacy) => (
              <PharmacyCard
                key={pharmacy._id}
                pharmacy={pharmacy}
                onSelect={(item) => {
                  setSelectedPharmacyId(item._id);
                  navigate(`/pharmacies/${item._id}`);
                }}
              />
            ))}
            {!pharmacies.length ? <p className={emptyClass}>No pharmacies found yet.</p> : null}
          </div>
        </section>

        <section className={`space-y-4 ${panelClass}`}>
          <div>
            <p className="medisync-kicker w-fit text-slate-500">Upload prescription</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Upload after choosing a pharmacy</h2>
            <p className="mt-2 text-sm text-slate-600">Select a pharmacy from the results on the left and open its details page to upload prescriptions. This keeps the flow clear and ensures you upload to the correct pharmacy.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <select className={selectClass} value={selectedPharmacyId} onChange={(event) => setSelectedPharmacyId(event.target.value)}>
              <option value="">-- choose a nearby pharmacy --</option>
              {pharmacies.map((pharmacy) => (
                <option key={pharmacy._id} value={pharmacy._id}>{pharmacy.name}</option>
              ))}
            </select>
            <button type="button" disabled={!selectedPharmacyId} onClick={() => navigate(`/pharmacies/${selectedPharmacyId}`)} className={primaryButtonClass}>
              Open pharmacy
            </button>
          </div>
        </section>

        <section className={`space-y-4 ${panelClass}`}>
          <div>
            <p className="medisync-kicker w-fit text-slate-500">Manage profile</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Edit your patient details</h2>
          </div>
          <form className="space-y-3" onSubmit={saveProfile}>
            <input className={fieldClass} value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} placeholder="Full name" />
            <input className={fieldClass} value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} placeholder="Phone number" />
            <input className={fieldClass} value={profileForm.avatarUrl} onChange={(event) => setProfileForm({ ...profileForm, avatarUrl: event.target.value })} placeholder="Avatar image URL" />
            <button className={primaryButtonClass}>Save profile</button>
          </form>
        </section>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {prescriptions.map((prescription) => (
          <PrescriptionCard key={prescription._id} prescription={prescription}>
            <p className="text-sm text-slate-600">{prescription.patientNote || 'No patient note provided.'}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">{prescription.deliveryMode}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Payment: {prescription.paymentMethod}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Total: {prescription.total}</span>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Status: {prescription.status}</p>
              {(prescription.status === 'approved' || prescription.status === 'ready') ? (
                <div className="mt-3 space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <select className="medisync-select rounded-xl px-3 py-2 text-sm" value={orderForm.fulfillmentMode} onChange={(event) => setOrderForm({ ...orderForm, fulfillmentMode: event.target.value })}>
                      <option value="pickup">Pickup</option>
                      <option value="delivery" disabled={!prescription?.pharmacy?.deliveryEnabled}>Delivery</option>
                    </select>
                    <select className="medisync-select rounded-xl px-3 py-2 text-sm" value={orderForm.paymentMethod} onChange={(event) => setOrderForm({ ...orderForm, paymentMethod: event.target.value })}>
                      <option value="card">Card</option>
                      <option value="cash">Cash</option>
                      <option value="wallet">Wallet</option>
                    </select>
                  </div>
                  {orderForm.fulfillmentMode === 'delivery' ? (
                    <input className="medisync-input rounded-xl px-3 py-2 text-sm" placeholder="Delivery address" value={orderForm.deliveryAddress} onChange={(event) => setOrderForm({ ...orderForm, deliveryAddress: event.target.value })} />
                  ) : null}
                  <button type="button" onClick={() => createOrderAndPay(prescription)} className="medisync-button-accent rounded-xl px-4 py-2 text-sm">
                    Create order and pay
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-600">You can place the order after the pharmacist approves this prescription.</p>
              )}
            </div>
          </PrescriptionCard>
        ))}
      </section>
      <UploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        pharmacyId={selectedPharmacyId}
        onUploaded={async () => {
          setMessage('Prescription uploaded.');
          await loadPrescriptions();
        }}
      />
    </div>
  );
}
