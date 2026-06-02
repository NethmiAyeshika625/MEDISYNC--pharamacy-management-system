import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { request } from '../../lib/api';
import { useSocketFeed } from '../useSocketFeed';
import PrescriptionCard from '../../components/PrescriptionCard';
import { useNavigate } from 'react-router-dom';

export default function PatientPrescriptions() {
  const { user, socket } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [message, setMessage] = useState('');
  const [active, setActive] = useState(null);
  const [fulfillmentMode, setFulfillmentMode] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const navigate = useNavigate();

  async function loadPrescriptions() {
    const data = await request('/api/prescriptions/me');
    setPrescriptions(data);
  }

  useEffect(() => {
    loadPrescriptions().catch((error) => setMessage(error.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useSocketFeed(socket, 'patient', user?.id, () => {
    loadPrescriptions().catch(() => {});
  });

  async function createOrder() {
    if (!active) return;
    try {
      const body = {
        prescriptionId: active._id,
        fulfillmentMode,
        paymentMethod,
        deliveryAddress: fulfillmentMode === 'delivery' ? deliveryAddress : undefined
      };

      const order = await request('/api/orders', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      setActive(null);

      if (paymentMethod === 'card') {
        const { url } = await request('/api/payments/create-session', {
          method: 'POST',
          body: JSON.stringify({ orderId: order._id })
        });

        if (url) {
          window.location.href = url;
          return;
        }
      }

      navigate('/orders');
    } catch (err) {
      setMessage(err.message || 'Unable to create order');
    }
  }

  return (
    <>
      <div className="space-y-6">
      {message ? <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">{message}</div> : null}

      <section className="grid gap-4">
        {prescriptions.map((prescription) => (
          <PrescriptionCard key={prescription._id} prescription={prescription}>
            <div className="space-y-2 text-sm text-slate-600">
              <p>Pharmacy: <span className="font-semibold text-slate-950">{prescription.pharmacy?.name}</span></p>
              <p>Patient note: {prescription.patientNote || 'No patient note provided.'}</p>
            </div>
            {['approved', 'ready'].includes(prescription.status) ? (
              <div className="mt-4">
                <button
                  type="button"
                  className="medisync-button-primary"
                  onClick={() => {
                    setActive(prescription);
                    setFulfillmentMode(prescription.pharmacy?.deliveryEnabled ? 'delivery' : 'pickup');
                    setPaymentMethod('card');
                    setDeliveryAddress('');
                  }}
                >
                  Create order
                </button>
              </div>
            ) : null}
          </PrescriptionCard>
        ))}
        {!prescriptions.length ? <div className="medisync-empty">No prescriptions found yet.</div> : null}
      </section>
      </div>
      {active ? (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
        <div className="max-w-md rounded-2xl bg-white p-6">
          <h3 className="text-lg font-bold text-slate-900">Create order</h3>
          <p className="mt-2 text-sm text-slate-600">Pharmacy: <span className="font-semibold text-slate-900">{active.pharmacy?.name}</span></p>

          <label className="mt-4 block text-sm font-semibold text-slate-700">Fulfillment</label>
          <div className="mt-2 flex gap-2">
            <button type="button" className={`rounded-full px-4 py-2 ${fulfillmentMode==='pickup'?'bg-slate-900 text-white':'bg-slate-100'}`} onClick={()=>setFulfillmentMode('pickup')}>Pickup</button>
            <button type="button" disabled={!active.pharmacy?.deliveryEnabled} className={`rounded-full px-4 py-2 ${fulfillmentMode==='delivery'?'bg-slate-900 text-white':'bg-slate-100'} ${!active.pharmacy?.deliveryEnabled?'opacity-50':''}`} onClick={()=>setFulfillmentMode('delivery')}>Delivery</button>
          </div>

          {fulfillmentMode === 'delivery' ? (
            <label className="mt-4 block text-sm font-semibold text-slate-700">Delivery address
              <input className="medisync-input mt-2 w-full" value={deliveryAddress} onChange={(e)=>setDeliveryAddress(e.target.value)} placeholder="Street, city, postcode" />
            </label>
          ) : null}

          <label className="mt-4 block text-sm font-semibold text-slate-700">Payment method</label>
          <div className="mt-2 flex gap-2">
            <button type="button" className={`rounded-full px-4 py-2 ${paymentMethod==='card'?'bg-slate-900 text-white':'bg-slate-100'}`} onClick={()=>setPaymentMethod('card')}>Card</button>
            <button type="button" className={`rounded-full px-4 py-2 ${paymentMethod==='cash'?'bg-slate-900 text-white':'bg-slate-100'}`} onClick={()=>setPaymentMethod('cash')}>Cash</button>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button type="button" className="medisync-button-primary" onClick={createOrder}>Create & pay</button>
            <button type="button" className="medisync-button-secondary" onClick={()=>setActive(null)}>Cancel</button>
          </div>
        </div>
      </div>
      ) : null}
    </>
  );
}
