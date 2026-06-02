import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Package, PlusCircle, RefreshCw, Save, Search } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { request } from '../../lib/api';
import { useSocketFeed } from '../useSocketFeed';

const emptyForm = {
  name: '',
  brand: '',
  price: '',
  imageUrl: '',
  stockCount: '',
  expiryDate: '',
  lowStockThreshold: '',
  nearExpiryThresholdDays: '',
  available: true
};

function formatDate(value) {
  if (!value) return 'No expiry date set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
}

export default function PharmacistStock() {
  const { user, socket } = useAuth();
  const [stockData, setStockData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadStock() {
    if (!user?.pharmacyId) {
      setMessage('No pharmacy is linked to this pharmacist account yet.');
      return;
    }

    const data = await request('/api/pharmacies/me/stock');
    setStockData(data);
  }

  useEffect(() => {
    loadStock().catch((error) => setMessage(error.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.pharmacyId]);

  useSocketFeed(socket, 'pharmacy', user?.pharmacyId, () => {
    loadStock().catch(() => {});
  });

  const medicines = stockData?.medicines || [];
  const selectedMedicine = useMemo(() => medicines.find((item) => (item.medicineKey || item._id || `${item.name}::${item.brand}`) === editingId), [medicines, editingId]);

  useEffect(() => {
    if (selectedMedicine) {
      setForm({
        name: selectedMedicine.name || '',
        brand: selectedMedicine.brand || '',
        price: String(selectedMedicine.price ?? ''),
        imageUrl: selectedMedicine.imageUrl || '',
        stockCount: String(selectedMedicine.stockCount ?? ''),
        expiryDate: selectedMedicine.expiryDate ? String(selectedMedicine.expiryDate).slice(0, 10) : '',
        lowStockThreshold: selectedMedicine.lowStockThreshold === null || selectedMedicine.lowStockThreshold === undefined ? '' : String(selectedMedicine.lowStockThreshold),
        nearExpiryThresholdDays: selectedMedicine.nearExpiryThresholdDays === null || selectedMedicine.nearExpiryThresholdDays === undefined ? '' : String(selectedMedicine.nearExpiryThresholdDays),
        available: Boolean(selectedMedicine.available)
      });
    } else if (!editingId) {
      setForm(emptyForm);
    }
  }, [selectedMedicine]);

  function validateForm() {
    if (!form.name.trim() || !form.brand.trim()) {
      return 'Medicine name and brand are required.';
    }

    if (form.price === '' || !Number.isFinite(Number(form.price)) || Number(form.price) < 0) {
      return 'Price must be a valid number.';
    }

    if (form.stockCount === '' || !Number.isInteger(Number(form.stockCount)) || Number(form.stockCount) < 0) {
      return 'Stock count must be a whole number greater than or equal to 0.';
    }

    if (form.lowStockThreshold === '' || !Number.isInteger(Number(form.lowStockThreshold)) || Number(form.lowStockThreshold) < 0) {
      return 'Low stock threshold must be a whole number greater than or equal to 0.';
    }

    if (form.nearExpiryThresholdDays === '' || !Number.isInteger(Number(form.nearExpiryThresholdDays)) || Number(form.nearExpiryThresholdDays) < 1) {
      return 'Near-expiry threshold must be at least 1 day.';
    }

    if (form.expiryDate && Number.isNaN(new Date(form.expiryDate).getTime())) {
      return 'Expiry date must be valid.';
    }

    return '';
  }

  async function saveStock(event) {
    event.preventDefault();
    const validationMessage = validateForm();
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const payload = {
        medicineId: editingId,
        name: form.name,
        brand: form.brand,
        price: Number(form.price),
        imageUrl: form.imageUrl.trim(),
        stockCount: Number(form.stockCount),
        expiryDate: form.expiryDate || undefined,
        lowStockThreshold: Number(form.lowStockThreshold),
        nearExpiryThresholdDays: Number(form.nearExpiryThresholdDays),
        available: form.available
      };

      const response = await request('/api/pharmacies/me/stock', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setStockData(response);
      setEditingId('');
      setForm(emptyForm);
      setMessage(editingId ? 'Stock item updated.' : 'Stock item added or restocked.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="medisync-panel">
          <p className="medisync-kicker w-fit text-slate-500">Inventory</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-950">{stockData?.stockSummary?.totalMedicines || 0}</h3>
          <p className="mt-1 text-sm text-slate-600">Medicine types</p>
        </div>
        <div className="medisync-panel">
          <p className="medisync-kicker w-fit text-slate-500">Units</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-950">{stockData?.stockSummary?.totalUnits || 0}</h3>
          <p className="mt-1 text-sm text-slate-600">Total items in stock</p>
        </div>
        <div className="medisync-panel">
          <p className="medisync-kicker w-fit text-slate-500">Low stock</p>
          <h3 className="mt-2 text-3xl font-bold text-amber-700">{stockData?.stockSummary?.lowStock || 0}</h3>
          <p className="mt-1 text-sm text-slate-600">Need restock soon</p>
        </div>
        <div className="medisync-panel">
          <p className="medisync-kicker w-fit text-slate-500">Near expiry</p>
          <h3 className="mt-2 text-3xl font-bold text-rose-700">{stockData?.stockSummary?.nearExpiry || 0}</h3>
          <p className="mt-1 text-sm text-slate-600">Needs attention</p>
        </div>
      </section>

      {stockData?.alerts?.length ? (
        <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-[0_20px_50px_rgba(245,158,11,0.12)]">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} />
            Stock alerts
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {stockData.alerts.map((alert) => (
              <li key={alert}>• {alert}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={saveStock} className="medisync-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="medisync-kicker w-fit text-slate-500">Stock editor</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-950">{editingId ? 'Update existing medicine' : 'Add or restock medicine'}</h3>
            </div>
            <button type="button" onClick={() => { setEditingId(''); setForm(emptyForm); }} className="medisync-button-soft inline-flex items-center gap-2">
              <PlusCircle size={15} />
              New item
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              <span className="block mb-2">Medicine name <span className="text-rose-600">*</span></span>
              <input className="medisync-input w-full" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Paracetamol" required aria-required="true" autoComplete="off" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Brand
              <input className="medisync-input mt-2" value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} placeholder="Acme" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Price
              <input className="medisync-input mt-2" type="number" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="4.00" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Stock count
              <input className="medisync-input mt-2" type="number" value={form.stockCount} onChange={(event) => setForm({ ...form, stockCount: event.target.value })} placeholder="100" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Expiry date
              <input className="medisync-input mt-2" type="date" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Low stock threshold
              <input className="medisync-input mt-2" type="number" value={form.lowStockThreshold} onChange={(event) => setForm({ ...form, lowStockThreshold: event.target.value })} placeholder="10" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Near-expiry threshold (days)
              <input className="medisync-input mt-2" type="number" value={form.nearExpiryThresholdDays} onChange={(event) => setForm({ ...form, nearExpiryThresholdDays: event.target.value })} placeholder="30" />
            </label>
            <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
              Image URL <span className="font-normal text-slate-500">optional</span>
              <input className="medisync-input mt-2" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="Use an existing DB image or leave blank" />
            </label>
          </div>

          <label className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={form.available} onChange={(event) => setForm({ ...form, available: event.target.checked })} />
            Mark available for sale
          </label>

          <button disabled={loading} className="medisync-button-primary mt-5 w-full inline-flex items-center justify-center gap-2 disabled:opacity-60">
            <Save size={15} />
            {loading ? 'Saving...' : editingId ? 'Update stock' : 'Save stock item'}
          </button>
        </form>

        <div className="medisync-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="medisync-kicker w-fit text-slate-500">Live inventory</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-950">Current medicine stock</h3>
            </div>
            <button type="button" onClick={() => loadStock().catch((error) => setMessage(error.message))} className="medisync-button-soft inline-flex items-center gap-2">
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {medicines.map((medicine) => (
              <article key={medicine._id || `${medicine.name}-${medicine.brand}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-bold text-slate-950">{medicine.name}</h4>
                    <p className="text-sm text-slate-600">{medicine.brand}</p>
                    <p className="mt-1 text-xs text-slate-500">Expiry: {formatDate(medicine.expiryDate)}</p>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold ${medicine.status === 'expired' ? 'bg-rose-50 text-rose-800' : medicine.status === 'near-expiry' ? 'bg-amber-50 text-amber-800' : medicine.status === 'low-stock' ? 'bg-orange-50 text-orange-800' : medicine.available ? 'bg-teal-50 text-teal-800' : 'bg-slate-100 text-slate-700'}`}>
                    {medicine.status}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                  <span>Stock: <strong className="text-slate-950">{medicine.stockCount}</strong></span>
                  <span>Threshold: <strong className="text-slate-950">{medicine.lowStockThreshold}</strong></span>
                  <span>Available: <strong className="text-slate-950">{medicine.available ? 'Yes' : 'No'}</strong></span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setEditingId(medicine.medicineKey || medicine._id || `${medicine.name}::${medicine.brand}`)} className="medisync-button-soft inline-flex items-center gap-2">
                    <Search size={14} />
                    Edit
                  </button>
                </div>
              </article>
            ))}
            {!medicines.length ? <div className="medisync-empty">No stock items found yet.</div> : null}
          </div>
        </div>
      </section>

      {message ? <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">{message}</div> : null}
    </div>
  );
}
