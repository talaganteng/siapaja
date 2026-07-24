import { API_URL } from '../config';
import { useState } from 'react';
import { Camera, User, Lock, Save, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Profile({ user, onUpdateUser }) {
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(user?.profile_pic ? `${API_URL}${user.profile_pic}` : null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleFileChange = (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setProfilePic(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setProfilePic(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formData = new FormData();
    if (name && name !== user.name) formData.append('name', name);
    if (password) formData.append('password', password);
    if (profilePic) formData.append('profile_pic', profilePic);

    fetch(`${API_URL}/api/users/${user.id}/profile`, {
      method: 'PUT',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      setLoading(false);
      if (data.user) {
        onUpdateUser(data.user);
        setMessage('Profil berhasil diperbarui!');
        setPassword('');
      } else {
        setMessage(data.message || 'Gagal memperbarui profil');
      }
    })
    .catch(err => {
      setLoading(false);
      setMessage('Terjadi kesalahan koneksi');
    });
  };

  return (
    <div className="container" style={{ paddingBottom: '80px', marginTop: '24px' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: 'var(--text-muted)' }}>
        <ArrowLeft size={16} /> Kembali
      </Link>
      
      <div className="glass-panel" style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '32px', color: 'var(--primary-color)' }}>Profil Saya</h2>

        {message && (
          <div style={{ padding: '12px', background: message.includes('berhasil') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.includes('berhasil') ? '#16a34a' : '#ef4444', borderRadius: '8px', marginBottom: '24px', textAlign: 'center' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', background: 'var(--bg-color)', border: '2px dashed var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}
            >
              {preview ? (
                <img src={preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={48} color="var(--text-muted)" />
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', padding: '6px', textAlign: 'center', cursor: 'pointer' }}>
                <Camera size={16} color="#fff" style={{ margin: '0 auto' }} />
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
              </div>
            </div>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Drag & Drop foto, atau klik ikon kamera</span>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Nama Lengkap</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Ubah Password (Kosongkan jika tidak ingin mengubah)</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                placeholder="Password baru"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '14px', marginTop: '16px' }}>
            <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </div>
  );
}
