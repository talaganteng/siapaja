import { API_URL } from '../config';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, User, Bell, LogOut, Clock, Menu, X } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchNotifications = () => {
    if (!user) return;
    fetch(`${API_URL}/api/notifications/${user.id}`)
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = (id) => {
    fetch(`${API_URL}/api/notifications/read/${id}`, { method: 'POST' })
      .then(() => fetchNotifications())
      .catch(err => console.error(err));
  };

  const hasUnread = notifications.some(n => !n.is_read);

  const handleMenuClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav>
      <div className="container nav-content">
        <Link to="/" className="nav-brand" onClick={handleMenuClick}>
            <span className="brand-part-1">Siap</span>
            <span className="brand-part-2">aja!</span>
        </Link>
        
        <button className="mobile-only mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div style={{ gap: '24px', alignItems: 'center' }} className={isMobileMenuOpen ? 'mobile-menu' : 'desktop-only'}>
          <Link to="/" className="text-sm" style={{ display: 'flex', alignItems: 'center' }} onClick={handleMenuClick}>Katalog</Link>
          
          {user && (
            <div style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => setShowNotif(!showNotif)} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={20} />
                {hasUnread && (
                  <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, background: 'red', borderRadius: '50%' }}></span>
                )}
              </button>

              {showNotif && (
                <div className="glass-panel notif-dropdown" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold' }}>
                    Notifikasi Anda
                  </div>
                  <div>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada notifikasi</div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className={`notif-item ${!notif.is_read ? 'unread' : ''}`} onClick={() => markAsRead(notif.id)} style={{ cursor: 'pointer' }}>
                          <div className="text-sm" style={{ fontWeight: '600' }}>{notif.title}</div>
                          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{notif.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {user ? (
            <>
              {user.role === 'customer' && (
                <Link to="/history" className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={handleMenuClick}>
                  <Clock size={16} /> Riwayat Sewa
                </Link>
              )}
              {(user.role === 'admin' || user.role === 'vendor') && (
                <Link to="/dashboard" className="btn btn-primary" style={{ display: 'flex', gap: '8px' }} onClick={handleMenuClick}>
                  <User size={16} /> Dasbor {user.role === 'admin' ? 'Admin' : 'Vendor'}

                </Link>
              )}
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--text-main)' }} onClick={handleMenuClick}>
                {user.profile_pic ? (
                  <img src={`${API_URL}${user.profile_pic}`} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)', display: 'block' }} />
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <User size={16} color="var(--text-muted)" />
                  </div>
                )}
                <span className="text-sm" style={{ fontWeight: '600', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', lineHeight: 1 }}>{user.name}</span>
              </Link>
              <button onClick={() => { handleMenuClick(); onLogout(); }} className="btn btn-outline" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn btn-primary" style={{ display: 'flex', gap: '8px' }} onClick={handleMenuClick}>
              <User size={16} /> Login / Register
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
