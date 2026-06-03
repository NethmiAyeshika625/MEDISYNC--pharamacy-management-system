import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { request } from '../../lib/api';

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

export default function PharmacistFeedback() {
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    request('/api/pharmacies/me/reviews')
      .then(setReviews)
      .catch((error) => setMessage(error.message));
  }, []);

  return (
    <div className="space-y-6">
      <section className="medisync-panel">
        <p className="medisync-kicker w-fit text-slate-500">Pharmacy feedback</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Patient complaints and ratings</h2>
        <p className="mt-2 text-sm text-slate-600">Only feedback submitted for your pharmacy is visible here.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {reviews.map((review) => (
          <article key={review._id} className="medisync-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">{review.patient?.name || 'Patient'}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
              <StarRow rating={review.rating} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{review.comment}</p>
          </article>
        ))}
        {!reviews.length ? <div className="medisync-empty">No pharmacy feedback received yet.</div> : null}
      </section>

      {message ? <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">{message}</div> : null}
    </div>
  );
}
