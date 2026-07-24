import { API_URL } from '../config';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';

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

  return (
    <div className="container">
      <h1 className="page-title">Sewa Barang Jadi Mudah</h1>


      {loading ? (
        <p>Memuat katalog...</p>
      ) : (
        <div className="grid">
          {items.map(item => (
            <Link to={`/item/${item.id}`} key={item.id}>
              <div className="glass-panel product-card">
                <div className="product-img-wrapper">
                  <img src={item.image_url} alt={item.name} className="product-img" />
                </div>
                <div className="product-info">
                  <h3 className="product-title">{item.name}</h3>
                  <div className="product-price">Rp {item.price_per_day.toLocaleString('id-ID')} <span className="text-sm" style={{color: 'var(--text-muted)'}}>/ hari</span></div>
                  
                  <div className="product-meta">
                    <div className="flex-center" style={{ color: '#fbbf24' }}>
                      <Star size={16} fill="currentColor" /> 
                      <span>{item.rating} ({item.reviews_count})</span>
                    </div>
                    <div className="flex-center">
                      <MapPin size={16} />
                      <span>{item.location}</span>
                    </div>
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    Vendor: {item.vendor_name || item.vendor?.name}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
