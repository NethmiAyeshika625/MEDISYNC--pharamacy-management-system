import { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { request } from '../../lib/api';

const panelClass = 'medisync-panel';
const emptyClass = 'medisync-empty';

function StarRow({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={14}
          className={index < rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}
        />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const active = starValue <= value;

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange(starValue)}
            className={`grid h-11 w-11 place-items-center rounded-2xl border transition ${active ? 'border-amber-300 bg-amber-50 text-amber-500' : 'border-slate-200 bg-white text-slate-300 hover:border-amber-200 hover:text-amber-400'}`}
            aria-label={`${starValue} star${starValue === 1 ? '' : 's'}`}
          >
            <Star size={18} className={active ? 'fill-amber-500' : ''} />
          </button>
        );
      })}
    </div>
  );
}

export default function PatientFeedback() {
  const [reviews, setReviews] = useState([]);
  const [targetPharmacyId, setTargetPharmacyId] = useState('');
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [message, setMessage] = useState('');

  async function loadData() {
    const pharmacyData = await request('/api/pharmacies');

    const firstPharmacyId = pharmacyData[0]?._id || '';
    setTargetPharmacyId(firstPharmacyId);

    if (firstPharmacyId) {
      const reviewData = await request(`/api/pharmacies/${firstPharmacyId}/reviews`);
      setReviews(reviewData);
      return;
    }

    setReviews([]);
  }

  useEffect(() => {
    loadData().catch((error) => setMessage(error.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const averageRating = useMemo(() => {
    if (!reviews.length) {
      return 0;
    }

    return (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  async function submitFeedback(event) {
    event.preventDefault();

    if (!targetPharmacyId) {
      setMessage('No pharmacy loaded yet.');
      return;
    }

    try {
      await request(`/api/pharmacies/${targetPharmacyId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          rating: Number(form.rating),
          comment: form.comment
        })
      });

      setForm((current) => ({ ...current, comment: '' }));
      setMessage('Feedback submitted successfully.');
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        <div className={`${panelClass} flex items-center justify-between gap-4`}> 
          <div>
            <p className="medisync-kicker w-fit text-slate-500">Average rating</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">{reviews.length ? averageRating : '0.0'}</h2>
            <p className="mt-2 text-sm text-slate-600">Across {reviews.length} review{reviews.length === 1 ? '' : 's'}.</p>
          </div>
          <div className="hidden rounded-3xl bg-slate-50 px-4 py-3 text-right sm:block">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Score</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{reviews.length ? averageRating : '0.0'}</p>
          </div>
        </div>

        <section className={panelClass}>
          <p className="medisync-kicker w-fit text-slate-500">Add feedback</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-950">Rate a pharmacy</h3>
          <p className="mt-2 text-sm text-slate-600">Leave a rating and comment for the first pharmacy loaded from the database.</p>

          {message ? <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">{message}</div> : null}

          <form className="mt-5 grid gap-4" onSubmit={submitFeedback}>
            <label className="block text-sm font-semibold text-slate-700">
              Rating
              <div className="mt-2">
                <StarPicker value={Number(form.rating)} onChange={(rating) => setForm({ ...form, rating })} />
                <p className="mt-2 text-xs text-slate-500">Tap a star to rate.</p>
              </div>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Feedback
              <textarea className="medisync-textarea mt-2 min-h-28 w-full" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} placeholder="Write your feedback here" />
            </label>

            <button className="medisync-button-primary w-full" type="submit" disabled={!targetPharmacyId}>
              Submit feedback
            </button>
          </form>
        </section>
      </section>

      <section className={panelClass}>
        

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {reviews.map((review) => (
            <article key={review._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">{review.patient?.name || 'Anonymous patient'}</p>
                  <p className="mt-1 text-xs text-slate-500">{review.pharmacy?.name || 'Pharmacy'}</p>
                </div>
                <div>
                  <StarRow rating={review.rating} />
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{review.comment}</p>
              <p className="mt-3 text-xs text-slate-500">Submitted on {new Date(review.createdAt).toLocaleDateString()}</p>
            </article>
          ))}
          {!reviews.length ? <div className={emptyClass}>No feedback submitted yet.</div> : null}
        </div>
      </section>
    </div>
  );
}