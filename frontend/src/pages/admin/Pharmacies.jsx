import { useEffect, useState } from 'react';
import { request } from '../../lib/api';

export default function AdminPharmacies() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPharmacy, setEditingPharmacy] = useState(null);
  const [editingMedicine, setEditingMedicine] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await request('/api/admin/pharmacies');
      setPharmacies(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function beginEditPharmacy(p) {
    setEditingPharmacy({ ...p });
    setEditingMedicine(null);
  }

  function cancelEdit() {
    setEditingPharmacy(null);
    setEditingMedicine(null);
  }

  async function savePharmacy() {
    try {
      const { _id, name, address, city, phone, description, deliveryEnabled, deliveryFee, openingHours } = editingPharmacy;
      await request(`/api/admin/pharmacies/${_id}`, { method: 'PATCH', body: JSON.stringify({ name, address, city, phone, description, deliveryEnabled, deliveryFee, openingHours }) });
      await load();
      cancelEdit();
    } catch (err) {
      setError(err.message);
    }
  }

  function beginEditMedicine(pharmacy, med) {
    setEditingPharmacy({ ...pharmacy });
    setEditingMedicine({ ...med, pharmacyId: pharmacy._id });
  }

  async function saveMedicine() {
    try {
      const m = { ...editingMedicine };
      const { pharmacyId, _id, name, brand, price, stockCount, expiryDate, available, lowStockThreshold, nearExpiryThresholdDays, imageUrl } = m;
      await request(`/api/admin/pharmacies/${pharmacyId}/stock/${_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, brand, price, stockCount, expiryDate, available, lowStockThreshold, nearExpiryThresholdDays, imageUrl })
      });
      await load();
      cancelEdit();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removePharmacy(id) {
    if (!confirm('Delete this pharmacy?')) return;
    try {
      await request(`/api/admin/pharmacies/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeMedicine(pharmacyId, medId) {
    if (!confirm('Delete this medicine?')) return;
    try {
      await request(`/api/admin/pharmacies/${pharmacyId}/stock/${medId}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="medisync-panel">Loading pharmacies...</div>;

  return (
    <div className="space-y-4">
      {error ? <div className="medisync-panel text-rose-700">{error}</div> : null}
      <div className="medisync-panel">
        <h3 className="text-xl font-semibold">Pharmacies</h3>
        <div className="mt-3 space-y-3">
          {pharmacies.map((p) => (
            <div key={p._id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{p.name} <span className="text-sm text-slate-500">{p.city}</span></div>
                  <div className="text-sm text-slate-600">{p.address}</div>
                </div>
                <div className="flex gap-2">
                  <button className="medisync-button-soft" onClick={() => beginEditPharmacy(p)}>Edit</button>
                  <button className="medisync-button-soft" onClick={() => removePharmacy(p._id)}>Delete</button>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-sm font-semibold">Medicines</p>
                <div className="mt-2 space-y-2">
                  {(p.medicines || []).map((m) => (
                    <div key={m._id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{m.name} <span className="text-sm text-slate-500">{m.brand}</span></div>
                        <div className="text-sm text-slate-500">Stock: {m.stockCount} · {m.available ? 'Available' : 'Not available'}</div>
                      </div>
                      <div className="flex gap-2">
                        <button className="medisync-button-soft" onClick={() => beginEditMedicine(p, m)}>Edit</button>
                        <button className="medisync-button-soft" onClick={() => removeMedicine(p._id, m._id)}>Disable</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingPharmacy ? (
        <div className="medisync-panel">
          <h3 className="text-lg font-semibold">Edit Pharmacy</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-semibold">Name
              <input className="medisync-input mt-2" value={editingPharmacy.name || ''} onChange={(e) => setEditingPharmacy({ ...editingPharmacy, name: e.target.value })} />
            </label>
            <label className="block text-sm font-semibold">City
              <input className="medisync-input mt-2" value={editingPharmacy.city || ''} onChange={(e) => setEditingPharmacy({ ...editingPharmacy, city: e.target.value })} />
            </label>
            <label className="block text-sm font-semibold">Address
              <input className="medisync-input mt-2" value={editingPharmacy.address || ''} onChange={(e) => setEditingPharmacy({ ...editingPharmacy, address: e.target.value })} />
            </label>
            <label className="block text-sm font-semibold">Phone
              <input className="medisync-input mt-2" value={editingPharmacy.phone || ''} onChange={(e) => setEditingPharmacy({ ...editingPharmacy, phone: e.target.value })} />
            </label>
            <label className="block text-sm font-semibold md:col-span-2">Description
              <input className="medisync-input mt-2" value={editingPharmacy.description || ''} onChange={(e) => setEditingPharmacy({ ...editingPharmacy, description: e.target.value })} />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="medisync-button-primary" onClick={savePharmacy}>Save</button>
            <button className="medisync-button-soft" onClick={cancelEdit}>Cancel</button>
          </div>
        </div>
      ) : null}

      {editingMedicine ? (
        <div className="medisync-panel">
          <h3 className="text-lg font-semibold">Edit Medicine</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-semibold">Name
              <input className="medisync-input mt-2" value={editingMedicine.name || ''} onChange={(e) => setEditingMedicine({ ...editingMedicine, name: e.target.value })} />
            </label>
            <label className="block text-sm font-semibold">Brand
              <input className="medisync-input mt-2" value={editingMedicine.brand || ''} onChange={(e) => setEditingMedicine({ ...editingMedicine, brand: e.target.value })} />
            </label>
            <label className="block text-sm font-semibold">Price
              <input type="number" step="0.01" className="medisync-input mt-2" value={editingMedicine.price || 0} onChange={(e) => setEditingMedicine({ ...editingMedicine, price: e.target.value })} />
            </label>
            <label className="block text-sm font-semibold">Stock count
              <input type="number" className="medisync-input mt-2" value={editingMedicine.stockCount || 0} onChange={(e) => setEditingMedicine({ ...editingMedicine, stockCount: e.target.value })} />
            </label>
            <label className="block text-sm font-semibold">Expiry date
              <input type="date" className="medisync-input mt-2" value={editingMedicine.expiryDate ? String(editingMedicine.expiryDate).slice(0,10) : ''} onChange={(e) => setEditingMedicine({ ...editingMedicine, expiryDate: e.target.value })} />
            </label>
            <label className="block text-sm font-semibold">Low stock threshold
              <input type="number" className="medisync-input mt-2" value={editingMedicine.lowStockThreshold || ''} onChange={(e) => setEditingMedicine({ ...editingMedicine, lowStockThreshold: e.target.value })} />
            </label>
            <label className="block text-sm font-semibold">Near expiry days
              <input type="number" className="medisync-input mt-2" value={editingMedicine.nearExpiryThresholdDays || ''} onChange={(e) => setEditingMedicine({ ...editingMedicine, nearExpiryThresholdDays: e.target.value })} />
            </label>
            
          </div>
          <div className="mt-4 flex gap-2">
            <button className="medisync-button-primary" onClick={saveMedicine}>Save medicine</button>
            <button className="medisync-button-soft" onClick={cancelEdit}>Cancel</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
