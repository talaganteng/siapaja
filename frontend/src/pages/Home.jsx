import { API_URL } from '../config';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, ArrowRight } from 'lucide-react';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(${API_URL}/api/items)
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch', err);
        setLoading(false);
      });
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section style={{ paddingTop: '100px', paddingBottom: '80px', borderBottom: '1px solid var(--border-color)', backgroundColor: '#FFFFFF' }}>
        <div className="container">
          <div style={{ maxWidth: '800px' }}>
            <div style={{ display: 'inline-block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: '24px' }}>
              The Premium Marketplace
            </div>
            <h1 style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)', fontWeight: '800', lineHeight: '1', letterSpacing: '-0.04em', marginBottom: '24px', color: 'var(--primary-color)' }}>
              Sewa barang premium <br/>tanpa kompromi.
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '40px', maxWidth: '600px', lineHeight: '1.7' }}>
              Platform persewaan tepercaya untuk perangkat Apple, kamera profesional, dan perlengkapan hobi. Langsung dari tangan pertama.
            </p>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <a href="#katalog" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '16px' }}>
                Eksplor Katalog <ArrowRight size={18} style={{ marginLeft: '8px' }} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section id="katalog" style={{ paddingTop: '80px', paddingBottom: '120px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>Rekomendasi Kami</h2>
              <p className="text-muted">Barang pilihan dengan rating tertinggi minggu ini.</p>
            </div>
          </div>

          {loading ? (
            <div className="grid">
              <div className="skeleton skeleton-card"></div>
              <div className="skeleton skeleton-card"></div>
              <div className="skeleton skeleton-card"></div>
            </div>
          ) : (
            <div className="grid">
              {items.map(item => (
                <Link to={/item/} key={item.id}>
                  <div className="product-card">
                    <div className="product-img-wrapper">
                      <img src={item.image_url} alt={item.name} className="product-img" />
                    </div>
                    <div className="product-info">
                      <h3 className="product-title">{item.name}</h3>
                      <div className="product-price">
                        Rp {item.price_per_day.toLocaleString('id-ID')} 
                        <span className="text-sm" style={{ color: 'var(--text-muted)', fontWeight: '500' }}>/ hari</span>
                      </div>
                      
                      <div className="product-meta">
                        <div className="flex-center" style={{ color: 'var(--text-main)', fontWeight: '600' }}>
                          <Star size={16} fill="currentColor" /> 
                          <span>{item.rating} <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>({item.reviews_count})</span></span>
                        </div>
                        <div className="flex-center">
                          <MapPin size={16} />
                          <span>{item.location}</span>
                        </div>
                      </div>
                      
                      <div className="vendor-label">
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{item.vendor_name ? item.vendor_name.charAt(0) : 'V'}</span>
                        </div>
                        By {item.vendor_name || item.vendor?.name}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
