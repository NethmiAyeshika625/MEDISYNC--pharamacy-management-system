import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { request } from '../../lib/api';
import { useSocketFeed } from '../useSocketFeed';

export default function PharmacistMessages() {
  const { user, socket } = useAuth();
  const pharmacyId = user?.pharmacyId || '';
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [message, setMessage] = useState('');

  async function loadMessages() {
    if (!pharmacyId) return;
    const data = await request(`/api/pharmacies/${pharmacyId}/messages`);
    setMessages(data);
  }

  useEffect(() => {
    loadMessages().catch((error) => setMessage(error.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId]);

  useSocketFeed(socket, 'pharmacy', pharmacyId, () => {
    loadMessages().catch(() => {});
  });

  const conversations = useMemo(() => {
    const grouped = new Map();
    messages.forEach((entry) => {
      const patientId = entry.patient?._id || entry.patient;
      if (!patientId) return;
      const key = String(patientId);
      if (!grouped.has(key)) {
        grouped.set(key, {
          patientId: key,
          patientName: entry.patient?.name || 'Patient',
          messages: []
        });
      }
      grouped.get(key).messages.push(entry);
    });
    return Array.from(grouped.values()).sort((a, b) => {
      const aTime = a.messages[a.messages.length - 1]?.createdAt || 0;
      const bTime = b.messages[b.messages.length - 1]?.createdAt || 0;
      return new Date(bTime) - new Date(aTime);
    });
  }, [messages]);

  useEffect(() => {
    if (!selectedPatientId && conversations.length) {
      setSelectedPatientId(conversations[0].patientId);
    }
  }, [conversations, selectedPatientId]);

  const activeConversation = conversations.find((entry) => entry.patientId === selectedPatientId);

  async function sendReply(event) {
    event.preventDefault();
    if (!replyText.trim() || !selectedPatientId) return;

    try {
      await request(`/api/pharmacies/${pharmacyId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: replyText, patientId: selectedPatientId })
      });
      setReplyText('');
      await loadMessages();
      setMessage('Reply sent.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="space-y-6">
    

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="medisync-panel">
          <h3 className="text-lg font-bold text-slate-950">Conversations</h3>
          <div className="mt-4 space-y-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.patientId}
                type="button"
                onClick={() => setSelectedPatientId(conversation.patientId)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selectedPatientId === conversation.patientId ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
              >
                <p className="font-semibold">{conversation.patientName}</p>
                <p className={`mt-1 text-xs ${selectedPatientId === conversation.patientId ? 'text-slate-300' : 'text-slate-500'}`}>
                  {conversation.messages.length} message{conversation.messages.length === 1 ? '' : 's'}
                </p>
              </button>
            ))}
            {!conversations.length ? <div className="medisync-empty">No patient messages yet.</div> : null}
          </div>
        </div>

        <div className="medisync-panel">
          <h3 className="text-lg font-bold text-slate-950">
            {activeConversation ? activeConversation.patientName : 'Select a conversation'}
          </h3>

          <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {(activeConversation?.messages || []).map((entry) => (
              <div
                key={entry._id}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${entry.senderRole === 'pharmacist' ? 'ml-auto bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
              >
                <p>{entry.text}</p>
                <p className={`mt-2 text-[11px] ${entry.senderRole === 'pharmacist' ? 'text-slate-300' : 'text-slate-400'}`}>
                  {new Date(entry.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
            {!activeConversation?.messages?.length ? <div className="medisync-empty">No messages in this thread.</div> : null}
          </div>

          {activeConversation ? (
            <form onSubmit={sendReply} className="mt-4 space-y-3">
              <textarea
                className="medisync-textarea min-h-24 w-full"
                placeholder="Reply to the patient"
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
              />
              <button type="submit" className="medisync-button-primary w-full" disabled={!replyText.trim()}>
                Send reply
              </button>
            </form>
          ) : null}
        </div>
      </section>

      {message ? <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">{message}</div> : null}
    </div>
  );
}
