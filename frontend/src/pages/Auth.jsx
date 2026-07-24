import { API_URL } from '../config';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud } from 'lucide-react';

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [profilePic, setProfilePic] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  const navigate = useNavigate();

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setProfilePic(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePic(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    const url = isLogin ? `${API_URL}/api/auth/login` : `${API_URL}/api/auth/register`;
    let body;
    let headers = {};
    if (isLogin) {
      body = JSON.stringify({ email, password });
      headers = { 'Content-Type': 'application/json' };
    } else {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('role', role);
      if (profilePic) formData.append('profile_pic', profilePic);
      body = formData;
    }

    fetch(url, {
      method: 'POST',
      headers,
      body
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error occurred');
      return data;
    })
    .then(data => {
      onLogin(data.user);
      if (data.user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    })
    .catch(err => {
      setError(err.message);
    });
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>
          {isLogin ? 'Masuk ke SiapAja!' : 'Daftar SiapAja!'}
        </h2>
        
        {error && <div style={{ color: '#ef4444', marginBottom: '16px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Nama Lengkap</label>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="chat-input" 
                style={{ width: '100%', padding: '12px 16px', boxSizing: 'border-box' }}
              />
            </div>
          )}
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Email</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="chat-input" 
              style={{ width: '100%', padding: '12px 16px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="chat-input" 
              style={{ width: '100%', padding: '12px 16px', boxSizing: 'border-box' }}
            />
          </div>

          {!isLogin && (
            <>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Daftar Sebagai</label>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="radio" name="role" value="customer" checked={role === 'customer'} onChange={() => setRole('customer')} /> Customer
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="radio" name="role" value="vendor" checked={role === 'vendor'} onChange={() => setRole('vendor')} /> Vendor
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="radio" name="role" value="admin" checked={role === 'admin'} onChange={() => setRole('admin')} /> Admin
                </label>
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Foto Profil (Opsional) - Drag & Drop</label>
              <div 
                  onDragOver={(e) => e.preventDefault()} 
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current.click()}
                  style={{ 
                      border: '2px dashed var(--border-color)', 
                      borderRadius: '12px', 
                      padding: '32px', 
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'var(--bg-color)'
                  }}
              >
                  {profilePic ? (
                      <span style={{ color: 'var(--primary-color)' }}>File terpilih: {profilePic.name}</span>
                  ) : (
                      <>
                        <UploadCloud size={32} style={{ margin: '0 auto 12px', opacity: 0.7, color: 'var(--primary-color)' }} />
                        <span style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>Drag file foto ke sini atau klik untuk mencari</span>
                      </>
                  )}
                  <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      onChange={handleFileSelect} 
                      style={{ display: 'none' }} 
                  />
              </div>
            </div>
          </>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }}>
            {isLogin ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)' }}>
          {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }} 
            style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isLogin ? 'Daftar Sekarang' : 'Masuk'}
          </button>
        </p>
      </div>
    </div>
  );
}
