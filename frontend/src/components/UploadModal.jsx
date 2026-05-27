import { useState } from 'react';

export default function UploadModal({ open, onClose, pharmacyId, onUploaded }) {
  const [form, setForm] = useState({ description: '', patientNote: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      let imageUrl = '';
      if (file) {
        const api = await import('../lib/api');
        const uploadRes = await api.uploadFile(file);
        imageUrl = uploadRes.downloadUrl;
      }

      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyId,
          description: form.description,
          imageUrl,
          patientNote: form.patientNote
        })
      });

      if (!res.ok) throw new Error(await res.text());
      setMessage('Uploaded successfully.');
      setForm({ description: '', patientNote: '' });
      setFile(null);
      setPreview('');
      onUploaded && onUploaded();
      onClose && onClose();
    } catch (err) {
      setMessage(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg">
        <h3 className="text-xl font-bold text-slate-900">Upload prescription</h3>
        <p className="mt-1 text-sm text-slate-600">Uploading to the selected pharmacy will send the image privately to their team.</p>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <textarea className="medisync-textarea" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div>
            <input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              if (f) setPreview(URL.createObjectURL(f));
            }} />
            {preview ? <img src={preview} alt="preview" className="mt-3 max-h-40 w-full rounded-2xl object-cover" /> : null}
          </div>
          <textarea className="medisync-textarea" placeholder="Optional note" value={form.patientNote} onChange={(e) => setForm({ ...form, patientNote: e.target.value })} />
          {message ? <p className="text-sm text-rose-600">{message}</p> : null}
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={loading} className="medisync-button-accent">{loading ? 'Uploading...' : 'Upload'}</button>
            <button type="button" onClick={onClose} className="medisync-button-soft">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
