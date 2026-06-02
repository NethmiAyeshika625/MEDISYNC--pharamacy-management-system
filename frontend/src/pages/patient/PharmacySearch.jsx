import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { request } from '../../lib/api';
import { AriaLive } from '../../utils/accessibility.jsx';
import PharmacyCard from '../../components/PharmacyCard';

export default function PatientPharmacySearch() {
  const navigate = useNavigate();
  const searchFormRef = useRef(null);
  const resultsRef = useRef(null);
  const paginationRef = useRef(null);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [useGeolocation, setUseGeolocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState('10');
  const [pharmacies, setPharmacies] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, limit: 10, skip: 0, pages: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchStatus, setSearchStatus] = useState('');

  async function loadPharmacies(nextSearch = search, nextCity = city, page = 1) {
    setLoading(true);
    try {
      const skip = (page - 1) * pagination.limit;
      let url = `/api/pharmacies?search=${encodeURIComponent(nextSearch)}&city=${encodeURIComponent(nextCity)}&limit=10&skip=${skip}`;

      if (useGeolocation && userLocation) {
        url += `&lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${radius}`;
      }

      const response = await request(url);
      setPharmacies(response.data || response);
      if (response.pagination) {
        setPagination(response.pagination);
      }
      const count = (response.data || response)?.length || 0;
      setMessage(count ? '' : 'No pharmacies matched this search. Try a shorter name or a different city.');
      setSearchStatus(`Search complete. Found ${count} pharmacies.`);
      
      // Scroll to results and announce
      if (resultsRef.current) {
        resultsRef.current.focus();
      }
    } catch (error) {
      setMessage(error.message);
      setSearchStatus(`Error: ${error.message}`);
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
    setCurrentPage(1);
    await loadPharmacies(search, city, 1);
  }

  function handleGeolocation() {
    if (!useGeolocation) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            setUseGeolocation(true);
            setSearchStatus('Location enabled. Using your current location for search.');
          },
          (error) => {
            setMessage('Unable to access your location. ' + error.message);
            setSearchStatus('Error: Unable to access location.');
          }
        );
      } else {
        setMessage('Geolocation is not supported by your browser.');
        setSearchStatus('Error: Geolocation not supported.');
      }
    } else {
      setUseGeolocation(false);
      setUserLocation(null);
      setSearchStatus('Location disabled.');
    }
  }

  function handlePageChange(newPage) {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setCurrentPage(newPage);
      loadPharmacies(search, city, newPage);
      // Announce page change
      setSearchStatus(`Navigated to page ${newPage} of ${pagination.pages}`);
      paginationRef.current?.focus();
    }
  }
  return (
    <div className="space-y-6">
      <AriaLive message={searchStatus} />
      
      <section className="medisync-panel">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="medisync-kicker w-fit text-slate-500">Database search</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">Find a pharmacy by name or city</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              This query hits the live pharmacy collection, so the results always come from the database.
            </p>
          </div>
          <div className="rounded-2xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800" aria-live="polite" aria-atomic="true">
            {pharmacies.length} result{pharmacies.length === 1 ? '' : 's'}
          </div>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSearch} ref={searchFormRef}>
          <fieldset>
            <legend className="sr-only">Search pharmacies</legend>
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <input
                className="medisync-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by pharmacy name"
                aria-label="Pharmacy name"
                autoComplete="off"
              />
              <input
                className="medisync-input"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Search by city"
                aria-label="City"
                autoComplete="off"
              />
              <button
                className="medisync-button-primary rounded-2xl px-5 py-3 inline-flex items-center justify-center gap-2"
                disabled={loading}
                aria-busy={loading}
              >
                <Search size={15} aria-hidden="true" />
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-700 mb-2">Location options</legend>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGeolocation}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
                  useGeolocation
                    ? 'bg-teal-600 text-white shadow-glow'
                    : 'border border-slate-200 text-slate-700 hover:bg-white'
                }`}
                aria-pressed={useGeolocation}
              >
                <MapPin size={16} aria-hidden="true" />
                {useGeolocation ? 'Using your location' : 'Use my location'}
              </button>
              {useGeolocation && (
                <div className="flex items-center gap-2">
                  <label htmlFor="radius-input" className="text-sm font-semibold text-slate-700">
                    Radius (km):
                  </label>
                  <input
                    id="radius-input"
                    type="number"
                    min="1"
                    max="50"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="medisync-input w-20"
                    aria-label="Search radius in kilometers"
                  />
                </div>
              )}
            </div>
          </fieldset>
        </form>
      </section>

      {message ? (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-900" role="alert">
          {message}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" ref={resultsRef} tabIndex={-1}>
        {pharmacies.map((pharmacy, index) => (
          <PharmacyCard
            key={pharmacy._id}
            pharmacy={pharmacy}
            onSelect={() => navigate(`/pharmacies/${pharmacy._id}`)}
            distance={pharmacy.distance}
            role="article"
            aria-label={`${pharmacy.name} pharmacy in ${pharmacy.city}`}
          />
        ))}
      </section>

      {pagination.pages > 1 && (
        <section
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-6 py-4"
          ref={paginationRef}
          tabIndex={-1}
          aria-label="Search results pagination"
        >
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold text-slate-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Previous
          </button>
          <p className="text-sm font-semibold text-slate-600" aria-live="polite" aria-atomic="true">
            Page {currentPage} of {pagination.pages}
          </p>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.pages || loading}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold text-slate-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            aria-label="Next page"
          >
            Next
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </section>
      )}
    </div>
  );
}
