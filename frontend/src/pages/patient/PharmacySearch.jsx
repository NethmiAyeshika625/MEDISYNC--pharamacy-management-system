import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { request } from '../../lib/api';
import PharmacyCard from '../../components/PharmacyCard';

export default function PatientPharmacySearch() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [pharmacies, setPharmacies] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadPharmacies(nextSearch = search, nextCity = city) {
    setLoading(true);
    try {
      const data = await request(`/api/pharmacies?search=${encodeURIComponent(nextSearch)}&city=${encodeURIComponent(nextCity)}`);
      setPharmacies(data);
      setMessage(data.length ? '' : 'No pharmacies matched this search. Try a shorter name or a different city.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPharmacies().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    await loadPharmacies(search, city);
  }

  return (
    <div className="space-y-6">
      <section className="medisync-panel">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="medisync-kicker w-fit text-slate-500">Database search</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Find a pharmacy by name or city</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              This query hits the live pharmacy collection, so the results always come from the database.
            </p>
          </div>
          <div className="rounded-2xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800">
            {pharmacies.length} result{pharmacies.length === 1 ? '' : 's'}
          </div>
        </div>

        <form className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleSearch}>
          <input className="medisync-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by pharmacy name" />
          <input className="medisync-input" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Search by city" />
          <button className="medisync-button-primary rounded-2xl px-5 py-3 inline-flex items-center justify-center gap-2" disabled={loading}>
            <Search size={15} />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </section>

      {message ? <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">{message}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pharmacies.map((pharmacy) => (
          <PharmacyCard
            key={pharmacy._id}
            pharmacy={pharmacy}
            onSelect={() => navigate(`/pharmacies/${pharmacy._id}`)}
          />
        ))}
      </section>
    </div>
  );
}
