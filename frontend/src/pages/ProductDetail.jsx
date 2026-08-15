import { API_URL } from '../config';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShieldCheck, MapPin, MessageSquare, Calendar as CalendarIcon, Info, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { addDays, eachDayOfInterval, format, differenceInDays } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import ChatModal from '../components/ChatModal';

export default function ProductDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Booking state
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  // Modals state
  const [showChat, setShowChat] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  const fetchProductData = () => {
    fetch(`${API_URL}/api/items/${id}`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch item', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProductData();

    // Fetch availability
    fetch(`${API_URL}/api/items/${id}/availability`)
      .then(res => res.json())
      .then(dates => {
        const disabled = dates.flatMap(b => {
          return eachDayOfInterval({ start: new Date(b.start_date), end: new Date(b.end_date) });
        });
        setBookedDates(disabled);
      })
      .catch(err => console.error('Failed to fetch availability', err));
  }, [id]);

  useEffect(() => {
    if (startDate && endDate) {
      const days = differenceInDays(endDate, startDate) + 1; // inclusive
      fetch(`${API_URL}/api/bookings/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: parseInt(id), durationDays: days })
      })
        .then(res => res.json())
        .then(data => setPricing(data))
        .catch(err => console.error(err));
    } else {
      setPricing(null);
    }
  }, [startDate, endDate, id]);

  const handleBooking = () => {
    if (!startDate || !endDate || !user || !pricing) return;
    setIsBooking(true);
    
    fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            itemId: parseInt(id),
            startDate,
            endDate,
            durationDays: pricing.durationDays,
            totalCost: pricing.totalCost,
            depositFee: pricing.depositFee,
            rentCost: pricing.rentCost,
            customerId: user.id,
            customerName: user.name
        })
    })
      .then(res => res.json())
      .then(data => {
          setIsBooking(false);
          if (data.booking && data.booking.id) {
              navigate(`/checkout/${data.booking.id}`);
          } else {
              alert('Gagal membuat pesanan.');
          }
      })
      .catch(err => {
          console.error(err);
          setIsBooking(false);
          alert('Error: ' + err.message);
      });
  };

  const submitReview = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            item_id: id,
            user: user.name,
            rating: reviewForm.rating,
            comment: reviewForm.comment
        })
    }).then(() => {
        setShowReviewModal(false);
        setReviewForm({ rating: 5, comment: '' });
        fetchProductData(); // refresh product & reviews
    }).catch(console.error);
  };

  if (loading) return <div className="container" style={{ marginTop: '40px' }}>Memuat detail barang...</div>;
  if (!data || !data.item) return <div className="container" style={{ marginTop: '40px' }}>Barang tidak ditemukan.</div>;

  const { item, reviews } = data;

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <div className="detail-container">
        {/* Left Column - Image */}
        <div>
          <img src={item.image_url} alt={item.name} className="detail-img" />
        </div>

        {/* Right Column - Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
          <div>
            <h1 style={{ marginTop: 0, marginBottom: '12px' }}>{item.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
              <div className="flex-center" style={{ color: '#fbbf24' }}>
                <Star size={18} fill="currentColor" /> 
                <span style={{ fontSize: '1rem', fontWeight: 600 }}>{item.rating}</span>
                <span>({item.reviews_count} ulasan)</span>
              </div>
              <div className="flex-center">
                <MapPin size={18} /> {item.location}
              </div>
            </div>
            
            <div className="detail-price">
              Rp {Number(item.price_per_day).toLocaleString('id-ID')} <span className="text-sm" style={{color: 'var(--text-muted)'}}>/ hari</span>
            </div>

            <p style={{ lineHeight: 1.6, color: 'var(--text-main)', opacity: 0.9 }}>
                {item.description}
            </p>

            <div className="glass-panel vendor-card">
              <div className="vendor-info">
                <h4>{item.vendor_name || item.vendor?.name}</h4>
                <div className="flex-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  <ShieldCheck size={16} color="var(--accent)" /> Vendor Terverifikasi
                </div>
              </div>
              {(!user || user.role === 'customer') && (
                <button className="btn btn-primary" onClick={() => setShowChat(true)} style={{ background: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--text-main)' }}>
                  Chat Vendor
                </button>
              )}
            </div>

            {/* Booking System */}
            <div className="glass-panel" style={{ padding: '24px', marginTop: '24px', border: '1px solid var(--accent)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <CalendarIcon size={20} color="var(--accent)" /> Pilih Tanggal Sewa
              </h3>
              
              <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => {
                    setStartDate(update[0]);
                    setEndDate(update[1]);
                  }}
                  minDate={new Date()}
                  excludeDates={bookedDates}
                  placeholderText="Mulai - Selesai"
                  className="date-picker-input"
                  inline
                />

                {pricing && (
                  <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-muted)' }}>
                      <span>Rp {Number(item.price_per_day).toLocaleString('id-ID')} x {pricing.durationDays} hari</span>
                      <span>Rp {Number(pricing.rentCost).toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--text-muted)' }}>
                      <span>Deposit Keamanan (Dikembalikan)</span>
                      <span>Rp {Number(pricing.depositFee).toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-color)' }}>
                      <span>Total</span>
                      <span style={{ color: 'var(--accent)' }}>Rp {Number(pricing.totalCost).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}

                {bookingSuccess && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent)', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                    Pemesanan Berhasil! Menunggu Konfirmasi Vendor.
                  </div>
                )}

                {!bookingSuccess && (
                  <>
                    {user && user.role === 'customer' && (
                      <button 
                        className="btn btn-primary" 
                        onClick={handleBooking}
                        disabled={!startDate || !endDate || isBooking}
                        style={{ padding: '16px', fontSize: '1.1rem', opacity: (!startDate || !endDate || isBooking) ? 0.5 : 1 }}
                      >
                        {isBooking ? 'Memproses...' : (startDate && endDate ? 'Lanjutkan ke Pembayaran' : 'Pilih Tanggal Dulu')}
                      </button>
                    )}
                    
                    {user && user.role === 'vendor' && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '12px' }}>
                        Mode Vendor: Anda tidak dapat menyewa barang.
                      </div>
                    )}
                    
                    {user && user.role === 'admin' && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '12px' }}>
                        Mode Admin: Anda tidak dapat menyewa barang.
                      </div>
                    )}

                    {!user && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '12px' }}>
                        Silakan login untuk melakukan pemesanan.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="reviews-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Ulasan Penyewa ({reviews?.length || 0})</h3>
            {user && user.role === 'customer' && (
                <button className="btn btn-primary" onClick={() => setShowReviewModal(true)} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                    Tulis Ulasan
                </button>
            )}
        </div>
        
        <div style={{ marginTop: '24px' }}>
          {reviews && reviews.length > 0 ? (
            reviews.map(review => (
              <div key={review.id} className="glass-panel review-item">
                <div className="review-header">
                  <div className="review-user">{review.user}</div>
                  <div className="flex-center" style={{ color: '#fbbf24' }}>
                    <Star size={14} fill="currentColor" /> {review.rating}
                  </div>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))
          ) : (
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              Belum ada ulasan untuk barang ini.
            </div>
          )}
        </div>
      </div>
      
      {showChat && (
        <ChatModal 
          vendorId={item.vendor_id || 1} 
          vendorName={item.vendor_name || item.vendor?.name} 
          user={user}
          onClose={() => setShowChat(false)} 
        />
      )}

      {/* Write Review Modal */}
      {showReviewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--modal-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '500px', position: 'relative' }}>
            <button onClick={() => setShowReviewModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Tulis Ulasan Anda</h2>
            <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Rating Bintang</label>
                <select className="chat-input" value={reviewForm.rating} onChange={e => setReviewForm({...reviewForm, rating: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)' }} required>
                    <option value="5">5 Bintang - Luar Biasa</option>
                    <option value="4">4 Bintang - Sangat Bagus</option>
                    <option value="3">3 Bintang - Cukup</option>
                    <option value="2">2 Bintang - Kurang Memuaskan</option>
                    <option value="1">1 Bintang - Sangat Buruk</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Komentar Ulasan</label>
                <textarea className="chat-input" rows="4" value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} style={{ width: '100%', padding: '12px' }} required placeholder="Bagaimana pengalaman Anda menyewa barang ini?"></textarea>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn" onClick={() => setShowReviewModal(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Kirim Ulasan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

