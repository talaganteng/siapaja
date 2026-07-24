import { API_URL } from '../config';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Wallet, Smartphone, CheckCircle, ShieldCheck, QrCode } from 'lucide-react';

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionComplete, setTransactionComplete] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/bookings/${id}`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch booking', err);
        setLoading(false);
      });
  }, [id]);

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate webhook payment success
    fetch(`${API_URL}/api/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: parseInt(id), paymentMethod })
    })
      .then(res => res.json())
      .then(() => {
        setIsProcessing(false);
        setPaymentSuccess(true);
      });
  };

  const handleCompleteRental = (hasDamage) => {
    fetch(`${API_URL}/api/transactions/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: parseInt(id), hasDamage })
    })
      .then(res => res.json())
      .then(resData => {
        setTransactionComplete(resData.transactionDetails);
      });
  };

  if (loading) return <div className="container" style={{ marginTop: '40px' }}>Memuat pesanan...</div>;
  if (!data || !data.booking) return <div className="container" style={{ marginTop: '40px' }}>Pesanan tidak ditemukan.</div>;

  const { booking, item } = data;

  if (transactionComplete) {
    return (
      <div className="container" style={{ marginTop: '40px', maxWidth: '600px' }}>
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
          <CheckCircle size={48} color="var(--accent)" style={{ margin: '0 auto 16px' }} />
          <h2>Rental Selesai</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Barang telah dikembalikan.</p>
          
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', textAlign: 'left', marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '12px', color: 'var(--accent)' }}>Sistem Revenue Splitting (Otomatis)</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Diteruskan ke Dompet Vendor (90%)</span>
              <strong>Rp {transactionComplete.vendorRevenue.toLocaleString('id-ID')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Komisi Platform (10%)</span>
              <strong>Rp {transactionComplete.platformRevenue.toLocaleString('id-ID')}</strong>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', textAlign: 'left' }}>
            <h4 style={{ marginBottom: '12px', color: 'var(--accent)' }}>Sistem Manajemen Deposit</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Deposit Dikembalikan ke Anda</span>
              <strong style={{ color: transactionComplete.refundedDeposit > 0 ? 'var(--accent)' : 'red' }}>
                Rp {transactionComplete.refundedDeposit.toLocaleString('id-ID')}
              </strong>
            </div>
            {transactionComplete.damagePenalty > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'red' }}>
                <span>Potongan Denda / Kerusakan</span>
                <strong>- Rp {transactionComplete.damagePenalty.toLocaleString('id-ID')}</strong>
              </div>
            )}
          </div>
          
          <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={() => navigate('/')}>Kembali ke Beranda</button>
        </div>
      </div>
    );
  }

  if (paymentSuccess || booking.status === 'PAID') {
    return (
      <div className="container" style={{ marginTop: '40px', maxWidth: '600px' }}>
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
          <CheckCircle size={48} color="var(--accent)" style={{ margin: '0 auto 16px' }} />
          <h2>Pembayaran Berhasil!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Pesanan diteruskan ke vendor.</p>
          
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', textAlign: 'left' }}>
            <h4 style={{ marginBottom: '16px' }}>Simulasi Pengembalian Barang (Uji Coba Deposit)</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Untuk keperluan demonstrasi, Anda bisa menekan tombol di bawah ini seolah-olah masa sewa telah habis dan barang dikembalikan.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" onClick={() => handleCompleteRental(false)}>
                Kembalikan (Tanpa Kerusakan)
              </button>
              <button className="btn" style={{ background: 'red', color: 'white' }} onClick={() => handleCompleteRental(true)}>
                Kembalikan (Ada Kerusakan)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      <h1 className="page-title" style={{ marginTop: 0 }}>Checkout Pembayaran</h1>
      
      <div className="detail-container">
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px' }}>Pilih Metode Pembayaran</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label className="payment-method" style={{...methodStyle(false), opacity: 0.6, cursor: 'not-allowed'}}>
              <input type="radio" disabled style={{ display: 'none' }} />
              <div className="flex-center" style={{ justifyContent: 'space-between' }}>
                <div className="flex-center"><CreditCard size={20} style={{ marginRight: '12px' }} /> Debit / Credit Card</div>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Belum Tersedia</span>
              </div>
            </label>
            <label className={`payment-method ${paymentMethod === 'QRIS' ? 'active' : ''}`} style={methodStyle(paymentMethod === 'QRIS')}>
              <input type="radio" name="payment" value="QRIS" onChange={(e) => setPaymentMethod(e.target.value)} style={{ display: 'none' }} />
              <div className="flex-center"><QrCode size={20} style={{ marginRight: '12px' }} /> QRIS (Gopay, OVO, Dana, LinkAja)</div>
            </label>
          </div>

          {paymentMethod === 'QRIS' && (
            <div style={{ marginTop: '24px', textAlign: 'center', padding: '24px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
              <h4 style={{ marginBottom: '16px' }}>Scan QR Code Berikut</h4>
              <div style={{ display: 'inline-flex', padding: '16px', background: 'white', borderRadius: '12px', marginBottom: '16px' }}>
                <QrCode size={150} color="#000" />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Buka aplikasi pembayaran Anda dan scan QR di atas untuk menyelesaikan pesanan.</p>
              
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
                disabled={isProcessing}
                onClick={handlePayment}
              >
                {isProcessing ? 'Memproses...' : 'Selesaikan Pembayaran'}
              </button>
            </div>
          )}



          <div style={{ marginTop: '30px', padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid var(--accent)' }}>
            <div className="flex-center" style={{ color: 'var(--accent)', marginBottom: '8px', fontWeight: 'bold' }}>
              <ShieldCheck size={20} /> Pembayaran Aman
            </div>
            <p className="text-sm">Deposit akan ditahan oleh sistem kami dan dikembalikan sepenuhnya jika barang dikembalikan tanpa kerusakan. Vendor hanya menerima uang setelah masa sewa selesai.</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '20px' }}>Ringkasan Pesanan</h3>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <img src={item.image_url} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
            <div>
              <div style={{ fontWeight: '600' }}>{item.name}</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--text-muted)' }}>
              <span>Total Sewa Barang</span>
              <span>Rp {booking.rent_cost.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--text-muted)' }}>
              <span>Deposit (Jaminan)</span>
              <span>Rp {booking.deposit_fee.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '16px', fontWeight: 'bold', fontSize: '1.2rem' }}>
              <span>Total Tagihan</span>
              <span style={{ color: 'var(--accent)' }}>Rp {booking.total_cost.toLocaleString('id-ID')}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const methodStyle = (isActive) => ({
  display: 'block',
  padding: '16px',
  border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border-color)'}`,
  borderRadius: '8px',
  cursor: 'pointer',
  background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
  transition: 'all 0.2s ease'
});
