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
        <Link to="/" className="nav-brand" onClick={handleMenuClick} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg viewBox="0 0 300 300" style={{ height: '48px', width: 'auto', borderRadius: '8px', overflow: 'hidden', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} xmlns="http://www.w3.org/2000/svg">
              {/* Yellow Background */}
              <rect width="300" height="300" fill="#F9D949" />
              {/* White border/offset behind the triangle */}
              <polygon points="-10,310 270,310 270,-10" fill="#ffffff" />
              {/* Main dark blue triangle */}
              <polygon points="0,300 260,300 260,0" fill="#0A192F" />
              {/* Medium blue oval behind 'aja!' */}
              <ellipse cx="170" cy="210" rx="70" ry="45" fill="#2563EB" />
              {/* Yellow ellipse at the top tip */}
              <ellipse cx="260" cy="0" rx="45" ry="30" transform="rotate(-30 260 0)" fill="#F9D949" stroke="#ffffff" strokeWidth="8" />
              {/* Text: Siap */}
              <text x="170" y="145" fontFamily="Outfit, sans-serif" fontSize="72" fontWeight="800" fill="#ffffff" textAnchor="middle" letterSpacing="-0.03em">
                Siap
              </text>
              {/* Text: aja! */}
              <text x="170" y="235" fontFamily="Outfit, sans-serif" fontSize="72" fontWeight="800" fill="#ffffff" textAnchor="middle" letterSpacing="-0.03em">
                aja!
              </text>
            </svg>
            <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary-color)', letterSpacing: '-0.04em' }}>SiapAja!</span>
        </Link>
        
        <button className="mobile-only mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }} className={isMobileMenuOpen ? 'mobile-menu' : 'desktop-only'}>
          <Link to="/" style={{ color: 'var(--text-main)', fontWeight: '500' }} onClick={handleMenuClick}>Katalog</Link>
          
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {user.role === 'customer' && (
                <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: '500' }} onClick={handleMenuClick}>
                  <Clock size={18} /> Riwayat
                </Link>
              )}
              {(user.role === 'admin' || user.role === 'vendor') && (
                <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: '600' }} onClick={handleMenuClick}>
                  <User size={18} /> Dasbor
                </Link>
              )}
              
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowNotif(!showNotif)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <Bell size={20} />
                  {hasUnread && (
                    <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%', border: '2px solid white' }}></span>
                  )}
                </button>

                {showNotif && (
                  <div className="notif-dropdown" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', position: 'absolute', top: '100%', right: 0, marginTop: '12px' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontWeight: '700' }}>
                      Notifikasi
                    </div>
                    <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada notifikasi</div>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif.id} className={`notif-item ${!notif.is_read ? 'unread' : ''}`} onClick={() => markAsRead(notif.id)} style={{ cursor: 'pointer' }}>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>{notif.title}</div>
                            <div style={{ color: 'var(--text-muted)' }}>{notif.message}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }}></div>

              <Link to="/profile" title={user.name} onClick={handleMenuClick} style={{ display: 'block' }}>
                {user.profile_pic ? (
                  <img src={`${API_URL}${user.profile_pic}`} alt="Profile" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid transparent', transition: 'border-color 0.2s' }} />
                ) : (
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F3F4F6', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                    <User size={18} />
                  </div>
                )}
              </Link>

              <button onClick={() => { handleMenuClick(); onLogout(); }} title="Logout" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary" onClick={handleMenuClick}>
              Login / Register
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
