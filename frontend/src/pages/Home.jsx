import { API_URL } from '../config';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, ArrowRight } from 'lucide-react';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/items`)
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

  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Extract unique locations from items
  const uniqueLocations = [...new Set(items.map(item => item.location))].filter(Boolean);

  const filteredItems = items.filter(item => {
    const itemName = item.name || '';
    const itemDesc = item.description || '';
    const itemLoc = item.location || '';
    
    const matchesSearch = itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          itemDesc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = locationFilter ? itemLoc === locationFilter : true;
    return matchesSearch && matchesLocation;
  });

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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>Rekomendasi Kami</h2>
              <p className="text-muted">Barang pilihan dengan rating tertinggi minggu ini.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Cari barang..." 
                className="chat-input" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '12px 16px', width: '250px', background: 'var(--card-bg)' }}
              />
              <select 
                className="chat-input"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                style={{ padding: '12px 16px', background: 'var(--card-bg)' }}
              >
                <option value="">Semua Lokasi</option>
                {uniqueLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid">
              <div className="skeleton skeleton-card"></div>
              <div className="skeleton skeleton-card"></div>
              <div className="skeleton skeleton-card"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 20px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
              <h3 style={{ marginBottom: '8px' }}>Barang Tidak Ditemukan</h3>
              <p style={{ color: 'var(--text-muted)' }}>Coba sesuaikan kata kunci pencarian atau lokasi Anda.</p>
            </div>
          ) : (
            <div className="grid">
              {filteredItems.map(item => (
                <Link to={`/item/${item.id}`} key={item.id}>
                  <div className="product-card">
                    <div className="product-img-wrapper">
                      <img src={item.image_url} alt={item.name} className="product-img" />
                    </div>
                    <div className="product-info">
                      <h3 className="product-title">{item.name}</h3>
                      <div className="product-price">
                        Rp {Number(item.price_per_day).toLocaleString('id-ID')} 
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

