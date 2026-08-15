import { API_URL } from '../config';
import { useState, useEffect } from 'react';
import { Package, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CustomerHistory({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/bookings/customer/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setHistory(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user.id]);

  return (
    <div className="container" style={{ paddingBottom: '80px', marginTop: '24px' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: 'var(--text-muted)' }}>
        <ArrowLeft size={16} /> Kembali ke Katalog
      </Link>
      
      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Package size={24} color="var(--primary-color)" />
          <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Riwayat Sewa Saya</h2>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Memuat riwayat...</p>
        ) : history.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-color)', borderRadius: '12px', color: 'var(--text-muted)' }}>
            Belum ada riwayat penyewaan.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px', fontWeight: '600' }}>ID Pesanan</th>
                  <th style={{ padding: '16px', fontWeight: '600' }}>Barang</th>
                  <th style={{ padding: '16px', fontWeight: '600' }}>Tanggal Sewa</th>
                  <th style={{ padding: '16px', fontWeight: '600' }}>Total Harga</th>
                  <th style={{ padding: '16px', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontWeight: '500' }}>#ORD-{order.id.toString().padStart(4, '0')}</td>
                    <td style={{ padding: '16px', fontWeight: '600' }}>{order.itemName}</td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                      {new Date(order.startDate).toLocaleDateString()} - {new Date(order.endDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px', fontWeight: '600' }}>
                      Rp {Number(order.totalCost).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span className={`status-badge ${order.status.toLowerCase()}`}>
                        {order.status === 'PENDING_PAYMENT' ? 'Menunggu Pembayaran' : 
                         order.status === 'ACTIVE' ? 'Aktif' : 
                         order.status === 'COMPLETED' ? 'Selesai' : order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

