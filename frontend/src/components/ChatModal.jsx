import { API_URL } from '../config';
import { useState, useEffect, useRef } from 'react';
import { X, Send, User } from 'lucide-react';

export default function ChatModal({ vendorId, vendorName, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const endOfMessagesRef = useRef(null);

  // If no user is logged in, use a temp ID or prompt login
  const customerId = user ? user.id : 'guest';
  const customerName = user ? user.name : 'Guest';
  const roomId = `${vendorId}_${customerId}`;

  const fetchMessages = () => {
    fetch(`${API_URL}/api/chat/${roomId}`)
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (user && user.role !== 'customer') return; // Only customers should chat vendors this way
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000); // Polling for real chat
    return () => clearInterval(interval);
  }, [roomId, user]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (!user || user.role !== 'customer') {
        alert('Hanya customer yang dapat mengirim pesan ke vendor.');
        return;
    }

    const newMsg = { sender: 'user', text: inputText, timestamp: new Date().toISOString() };
    setMessages([...messages, newMsg]);
    setInputText('');

    fetch(`${API_URL}/api/chat/${roomId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          text: newMsg.text, 
          sender: 'user',
          customerId: user.id,
          customerName: user.name,
          vendorId: vendorId,
          profilePic: user.profile_pic
      })
    }).catch(err => console.error(err));
  };

  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal glass-panel">
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="chat-avatar"><User size={20} /></div>
            <div>
              <div style={{ fontWeight: '600' }}>{vendorName || `Vendor #${vendorId}`}</div>
              <div className="text-sm" style={{ color: 'var(--accent)' }}>Online</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="chat-body">
          {loading ? (
            <div className="text-center" style={{ color: 'var(--text-muted)' }}>Memuat pesan...</div>
          ) : messages.length === 0 ? (
            <div className="text-center" style={{ color: 'var(--text-muted)', marginTop: '20px' }}>Belum ada pesan. Mulai sapa vendor!</div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble-wrapper ${msg.sender === 'user' ? 'user' : 'vendor'}`} style={{ display: 'flex', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px', marginBottom: '16px' }}>
                {msg.profilePic ? (
                  <img src={`${API_URL}${msg.profilePic}`} alt="avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <User size={14} color="var(--text-muted)" />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div className="chat-bubble" style={{ margin: 0 }}>
                    {msg.text}
                  </div>
                  <div className="chat-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={endOfMessagesRef} />
        </div>

        <form className="chat-footer" onSubmit={handleSend}>
          <input 
            type="text" 
            className="chat-input" 
            placeholder="Ketik pesan..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="btn btn-primary chat-send-btn" disabled={!inputText.trim()}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
