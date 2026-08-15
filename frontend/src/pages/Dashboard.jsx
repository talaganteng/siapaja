import { API_URL } from '../config';
import { useState, useEffect, useRef } from 'react';
import { DollarSign, Activity, ShoppingCart, CheckCircle, Package, Edit, Trash2, Eye, EyeOff, Plus, MessageSquare, X, UploadCloud, Star } from 'lucide-react';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, catalog, inbox, reviews

  // Edit/Add Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', image_url: '', image_file: null, price_per_day: '', location: '', description: '' });
  const fileInputRef = useRef(null);

  const fetchCatalog = () => {
    fetch(`${API_URL}/api/items/manage/${user.id}/${user.role}`)
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(console.error);
  };

  const fetchRooms = () => {
    fetch(`${API_URL}/api/chat/rooms/${user.id}`)
      .then(res => res.json())
      .then(data => setChatRooms(data))
      .catch(console.error);
  };

  const fetchReviews = () => {
    fetch(`${API_URL}/api/reviews`)
      .then(res => res.json())
      .then(data => setReviews(data))
      .catch(console.error);
  };

  useEffect(() => {
    const vendorId = user.id;
    
    const fetchDashboardData = () => {
      Promise.all([
        fetch(`${API_URL}/api/dashboard/stats/${vendorId}`).then(res => res.json()),
        fetch(`${API_URL}/api/dashboard/orders/${vendorId}`).then(res => res.json()),
        fetch(`${API_URL}/api/items/manage/${vendorId}/${user.role}`).then(res => res.json()),
        fetch(`${API_URL}/api/chat/rooms/${vendorId}`).then(res => res.json()),
        user.role === 'admin' ? fetch(`${API_URL}/api/reviews`).then(res => res.json()) : Promise.resolve([])
      ])
      .then(([statsData, ordersData, itemsData, roomsData, reviewsData]) => {
        setStats(statsData);
        setOrders(ordersData);
        setItems(itemsData);
        setChatRooms(roomsData);
        setReviews(reviewsData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 3000);
    return () => clearInterval(interval);
  }, [user]);

  // Polling for active chat room
  useEffect(() => {
    let interval;
    if (activeRoom) {
      const fetchMessages = () => {
        fetch(`${API_URL}/api/chat/${activeRoom.roomId}`)
          .then(res => res.json())
          .then(data => setChatMessages(data))
          .catch(console.error);
      };
      fetchMessages();
      interval = setInterval(fetchMessages, 2000);
    }
    return () => clearInterval(interval);
  }, [activeRoom]);

  const handleToggleVisibility = (item) => {
    fetch(`${API_URL}/api/items/${item.id}?userId=${user.id}&role=${user.role}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVisible: !item.isVisible })
    }).then(fetchCatalog);
  };

  const handleDeleteItem = (id) => {
    if (confirm('Yakin ingin menghapus barang ini beserta datanya?')) {
      fetch(`${API_URL}/api/items/${id}?userId=${user.id}&role=${user.role}`, { method: 'DELETE' }).then(fetchCatalog)
        .catch(err => alert("Gagal menghapus: Anda bukan pemilik barang ini."));
    }
  };

  const handleDeleteReview = (id) => {
    if (confirm('Yakin ingin menghapus ulasan ini?')) {
      fetch(`${API_URL}/api/reviews/${id}`, { method: 'DELETE' }).then(fetchReviews);
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditForm({ 
        name: item.name, 
        image_url: item.image_url, 
        image_file: null, 
        price_per_day: item.price_per_day,
        location: item.location || '',
        description: item.description || ''
    });
  };

  const openAddModal = () => {
    setIsAdding(true);
    setEditForm({ 
        name: '', 
        image_url: '', 
        image_file: null, 
        price_per_day: '',
        location: '',
        description: ''
    });
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setEditForm({ ...editForm, image_file: e.dataTransfer.files[0] });
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEditForm({ ...editForm, image_file: e.target.files[0] });
    }
  };

  const submitEdit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', editForm.name);
    formData.append('price_per_day', editForm.price_per_day);
    formData.append('location', editForm.location);
    formData.append('description', editForm.description);
    
    if (editForm.image_file) {
        formData.append('image', editForm.image_file);
    } else {
        formData.append('image_url', editForm.image_url);
    }

    fetch(`${API_URL}/api/items/${editingItem.id}?userId=${user.id}&role=${user.role}`, {
      method: 'PUT',
      body: formData // multer expects form-data
    }).then(async res => {
      if(!res.ok) {
          const err = await res.json();
          alert("Gagal mengedit: " + err.message);
          return;
      }
      setEditingItem(null);
      fetchCatalog();
    }).catch(console.error);
  };

  const submitAdd = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', editForm.name);
    formData.append('price_per_day', editForm.price_per_day);
    formData.append('location', editForm.location);
    formData.append('description', editForm.description);
    formData.append('vendorId', user.id);
    formData.append('vendorName', user.name);
    
    if (editForm.image_file) {
        formData.append('image', editForm.image_file);
    } else {
        formData.append('image_url', editForm.image_url);
    }

    fetch(`${API_URL}/api/items`, {
      method: 'POST',
      body: formData
    }).then(async res => {
      if(!res.ok) {
          const err = await res.json();
          alert("Gagal menambah: " + err.message);
          return;
      }
      setIsAdding(false);
      fetchCatalog();
    }).catch(console.error);
  };

  const sendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    fetch(`${API_URL}/api/chat/${activeRoom.roomId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: replyText,
        sender: 'vendor',
        customerId: activeRoom.customerId,
        customerName: activeRoom.customerName,
        vendorId: user.id
      })
    }).then(() => {
      setReplyText('');
      fetchRooms(); 
    });
  };

  const handleResetSystem = () => {
    if (confirm('PERINGATAN! Ini akan menghapus SEMUA data katalog, pesanan, dan chat di sistem. Lanjutkan?')) {
      fetch(`${API_URL}/api/admin/reset`, { method: 'POST' })
        .then(() => {
          alert('Sistem berhasil direset ke Clean Slate.');
          window.location.reload();
        })
        .catch(console.error);
    }
  };

  if (loading) return <div className="container" style={{ marginTop: '40px' }}>Memuat dasbor...</div>;

  return (
    <div className="container" style={{ marginTop: '40px', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ marginTop: 0 }}>Dasbor {user.role === 'admin' ? 'Admin' : 'Vendor'}</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Ringkasan performa dan manajemen pesanan toko Anda.</p>
        </div>
        {user.role === 'admin' && (
          <button className="btn" onClick={handleResetSystem} style={{ background: '#ef4444', color: 'white', border: 'none' }}>
            <Trash2 size={16} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'text-bottom' }} /> Reset Sistem
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('overview')} style={activeTab !== 'overview' ? {background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)'} : {}}>Overview</button>
        <button className={`btn ${activeTab === 'catalog' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('catalog')} style={activeTab !== 'catalog' ? {background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)'} : {}}>Manajemen Katalog</button>
        <button className={`btn ${activeTab === 'inbox' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('inbox')} style={activeTab !== 'inbox' ? {background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)'} : {}}>Pesan Masuk</button>
        
        {user.role === 'admin' && (
          <button className={`btn ${activeTab === 'reviews' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('reviews')} style={activeTab !== 'reviews' ? {background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)'} : {}}>Manajemen Ulasan (Admin)</button>
        )}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid" style={{ marginBottom: '40px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--accent)' }}>
                  <DollarSign size={28} />
                </div>
                <div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Pendapatan</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Rp {Number(stats.totalRevenue).toLocaleString('id-ID')}</div>
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '12px', color: 'var(--primary-color)' }}>
                  <ShoppingCart size={28} />
                </div>
                <div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Pesanan Aktif</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.activeOrders}</div>
                </div>
              </div>
            </div>
          </div>

          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} color="var(--primary-color)" /> Manajemen Pesanan
          </h3>
          
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                <tr style={{ background: 'var(--bg-color)' }}>
                    <th style={thStyle}>ID Pesanan</th>
                    <th style={thStyle}>Barang</th>
                    <th style={thStyle}>Penyewa</th>
                    <th style={thStyle}>Tanggal Sewa</th>
                    <th style={thStyle}>Total Harga</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada pesanan masuk.</td>
                    </tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={tdStyle}>#ORD-{order.id.toString().padStart(4, '0')}</td>
                        <td style={{ ...tdStyle, fontWeight: '600' }}>{order.itemName}</td>
                        <td style={tdStyle}>{order.renterName}</td>
                        <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>
                          {new Date(order.startDate).toLocaleDateString()} - {new Date(order.endDate).toLocaleDateString()}
                        </td>
                        <td style={tdStyle}>Rp {Number(order.totalCost).toLocaleString('id-ID')}</td>
                        <td style={tdStyle}>
                          <span style={statusStyle(order.status)}>
                            {order.status === 'PAID' && <CheckCircle size={14} />}
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'catalog' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Package size={20} color="var(--primary-color)" /> Katalog Anda
            </h3>
            <button className="btn btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Tambah Barang
            </button>
          </div>
          
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-color)' }}>
                  <th style={thStyle}>Nama Barang</th>
                  <th style={thStyle}>Harga / Hari</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada barang di katalog.</td>
                  </tr>
                ) : (
                  items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ ...tdStyle, fontWeight: '600' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={item.image_url} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                          {item.name}
                        </div>
                      </td>
                      <td style={tdStyle}>Rp {Number(item.price_per_day).toLocaleString('id-ID')}</td>
                      <td style={tdStyle}>
                        {item.isVisible !== false ? (
                          <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Publik</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Disembunyikan</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button onClick={() => handleToggleVisibility(item)} className="icon-btn" title="Toggle Visibilitas">
                            {item.isVisible !== false ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                          <button className="icon-btn" title="Edit" onClick={() => openEditModal(item)}>
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDeleteItem(item.id)} className="icon-btn" title="Hapus" style={{ color: '#ef4444' }}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inbox' && (
        <div className="glass-panel" style={{ display: 'flex', height: '500px', overflow: 'hidden' }}>
          {/* Chat Sidebar */}
          <div style={{ width: '300px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} /> Daftar Pesan
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {chatRooms.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada pesan.</div>
              ) : (
                chatRooms.map(room => (
                  <div 
                    key={room.roomId} 
                    onClick={() => setActiveRoom(room)}
                    style={{ 
                      padding: '16px', 
                      borderBottom: '1px solid var(--border-color)', 
                      cursor: 'pointer',
                      background: activeRoom?.roomId === room.roomId ? 'rgba(255,255,255,0.05)' : 'transparent'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{room.customerName}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {room.lastMessage ? room.lastMessage.text : 'Mulai percakapan...'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-color)' }}>
            {activeRoom ? (
              <>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold' }}>
                  Percakapan dengan {activeRoom.customerName}
                </div>
                <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {chatMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 'auto', marginBottom: 'auto' }}>Belum ada pesan.</div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: msg.sender === 'vendor' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px', alignSelf: msg.sender === 'vendor' ? 'flex-end' : 'flex-start' }}>
                        {msg.sender === 'vendor' ? (
                          user.profile_pic ? (
                            <img src={`${API_URL}${user.profile_pic}`} alt="avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                              <User size={14} color="var(--text-muted)" />
                            </div>
                          )
                        ) : (
                          msg.profilePic ? (
                            <img src={`${API_URL}${msg.profilePic}`} alt="avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                              <User size={14} color="var(--text-muted)" />
                            </div>
                          )
                        )}
                        <div style={{ 
                          background: msg.sender === 'vendor' ? 'var(--primary-color)' : 'var(--card-bg)',
                          border: msg.sender === 'vendor' ? 'none' : '1px solid var(--border-color)',
                          color: msg.sender === 'vendor' ? 'white' : 'var(--text-main)',
                          padding: '12px 16px',
                          borderRadius: '16px',
                          maxWidth: '400px'
                        }}>
                          <div>{msg.text}</div>
                          <div style={{ fontSize: '0.7rem', color: msg.sender === 'vendor' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={sendReply} style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
                  <input 
                    type="text" 
                    value={replyText} 
                    onChange={e => setReplyText(e.target.value)} 
                    placeholder="Tulis balasan..." 
                    className="chat-input"
                    style={{ flex: 1, padding: '12px 16px' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }}>Kirim</button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Pilih pesan di samping untuk mulai membalas.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && user.role === 'admin' && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-color)' }}>
                <th style={thStyle}>Penyewa</th>
                <th style={thStyle}>Rating</th>
                <th style={thStyle}>Komentar</th>
                <th style={thStyle}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada ulasan terdaftar.</td>
                </tr>
              ) : (
                reviews.map(rev => (
                  <tr key={rev.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ ...tdStyle, fontWeight: '600' }}>{rev.user}</td>
                    <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', color: '#fbbf24', gap: '4px' }}>
                            {rev.rating} <Star size={14} fill="currentColor" />
                        </div>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{rev.comment}</td>
                    <td style={tdStyle}>
                      <button onClick={() => handleDeleteReview(rev.id)} className="icon-btn" title="Hapus Ulasan" style={{ color: '#ef4444' }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Edit Modal (Vendor/Admin) */}
      {editingItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '600px', position: 'relative', maxHeight: '90vh', overflowY: 'auto', background: 'var(--card-bg)' }}>
            <button onClick={() => setEditingItem(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Edit Barang Katalog</h2>
            <form onSubmit={submitEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Drag and drop zone for image */}
              <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Foto Barang Baru (Drag & Drop)</label>
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
                      {editForm.image_file ? (
                          <span style={{ color: 'var(--primary-color)' }}>File terpilih: {editForm.image_file.name}</span>
                      ) : (
                          <>
                            <UploadCloud size={32} style={{ margin: '0 auto 12px', opacity: 0.7, color: 'var(--primary-color)' }} />
                            <span style={{ color: 'var(--text-main)' }}>Drag file foto ke sini atau klik untuk mencari file</span>
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

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Nama Barang</label>
                <input type="text" className="chat-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} required />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Lokasi / Kota</label>
                <select className="chat-input" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px' }} required>
                  <option value="" disabled>Pilih Lokasi</option>
                  <option value="Jakarta Pusat">Jakarta Pusat</option>
                  <option value="Jakarta Timur">Jakarta Timur</option>
                  <option value="Jakarta Barat">Jakarta Barat</option>
                  <option value="Jakarta Utara">Jakarta Utara</option>
                  <option value="Jakarta Selatan">Jakarta Selatan</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Deskripsi Barang</label>
                <textarea className="chat-input" rows="3" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} required></textarea>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Harga / Hari (Rp)</label>
                <input type="number" className="chat-input" value={editForm.price_per_day} onChange={e => setEditForm({...editForm, price_per_day: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} required />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn" onClick={() => setEditingItem(null)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal (Vendor/Admin) */}
      {isAdding && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '600px', position: 'relative', maxHeight: '90vh', overflowY: 'auto', background: 'var(--card-bg)' }}>
            <button onClick={() => setIsAdding(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Tambah Barang Baru</h2>
            <form onSubmit={submitAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Foto Barang (Drag & Drop)</label>
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
                      {editForm.image_file ? (
                          <span style={{ color: 'var(--primary-color)' }}>File terpilih: {editForm.image_file.name}</span>
                      ) : (
                          <>
                            <UploadCloud size={32} style={{ margin: '0 auto 12px', opacity: 0.7, color: 'var(--primary-color)' }} />
                            <span style={{ color: 'var(--text-main)' }}>Drag file foto ke sini atau klik untuk mencari file</span>
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

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Nama Barang</label>
                <input type="text" className="chat-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} required />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Lokasi / Kota</label>
                <select className="chat-input" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px' }} required>
                  <option value="" disabled>Pilih Lokasi</option>
                  <option value="Jakarta Pusat">Jakarta Pusat</option>
                  <option value="Jakarta Timur">Jakarta Timur</option>
                  <option value="Jakarta Barat">Jakarta Barat</option>
                  <option value="Jakarta Utara">Jakarta Utara</option>
                  <option value="Jakarta Selatan">Jakarta Selatan</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Deskripsi Barang</label>
                <textarea className="chat-input" rows="3" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} required></textarea>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Harga / Hari (Rp)</label>
                <input type="number" className="chat-input" value={editForm.price_per_day} onChange={e => setEditForm({...editForm, price_per_day: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} required />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn" onClick={() => setIsAdding(false)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Simpan Barang</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: '16px',
  fontWeight: '600',
  color: 'var(--text-muted)',
  fontSize: '0.9rem',
  borderBottom: '1px solid var(--border-color)'
};

const tdStyle = {
  padding: '16px',
  fontSize: '0.95rem'
};

const statusStyle = (status) => {
  let bgColor = 'rgba(255, 255, 255, 0.1)';
  let color = 'white';
  
  if (status === 'PAID') {
    bgColor = 'rgba(16, 185, 129, 0.2)';
    color = 'var(--accent)';
  } else if (status === 'COMPLETED') {
    bgColor = 'rgba(79, 70, 229, 0.2)';
    color = '#818cf8';
  } else if (status === 'PENDING_PAYMENT') {
    bgColor = 'rgba(245, 158, 11, 0.2)';
    color = '#fcd34d';
  }

  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    background: bgColor,
    color: color
  };
};

