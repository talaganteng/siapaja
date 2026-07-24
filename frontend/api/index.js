const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Setup Multer for File Uploads
// Use /tmp for Vercel Serverless Functions (read-only filesystem)
const uploadDir = '/tmp/uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });
app.use('/uploads', express.static(uploadDir));

// Dummy Data Fallback
const dummyItems = [];

const dummyReviews = [];

let pool = null;
// Force disable DB to prevent 10s connection timeout on Vercel Serverless
// Running purely in fallback (in-memory) mode
console.log('Running in fallback mode without DB.');

// API Routes
app.get('/api/items', async (req, res) => {
    try {
        if (pool) {
            const [rows] = await pool.query(`
                SELECT i.*, v.name as vendor_name, v.rating as vendor_rating 
                FROM items i 
                JOIN vendor_profiles v ON i.vendor_id = v.id
            `);
            // Assuming DB works, return rows. If empty, return dummy to ensure UI works
            if (rows.length > 0) return res.json(rows);
        }
        res.json(dummyItems.filter(i => i.isVisible !== false));
    } catch (error) {
        console.log('DB error on /api/items, using fallback.', error.message);
        res.json(dummyItems.filter(i => i.isVisible !== false));
    }
});

app.get('/api/items/admin/:vendorId', (req, res) => {
    // In real app, filter by vendor_id
    res.json(dummyItems);
});

app.get('/api/items/:id', async (req, res) => {
    const itemId = parseInt(req.params.id);
    try {
        if (pool) {
            const [rows] = await pool.query('SELECT * FROM items WHERE id = ?', [itemId]);
            if (rows.length > 0) {
                const [reviews] = await pool.query('SELECT * FROM reviews WHERE item_id = ?', [itemId]);
                return res.json({ item: rows[0], reviews });
            }
        }
        const item = dummyItems.find(i => i.id === itemId);
        const reviews = dummyReviews.filter(r => r.item_id === itemId);
        if (item) return res.json({ item, reviews });
        res.status(404).json({ message: 'Item not found' });
    } catch (error) {
        console.log('DB error on /api/items/:id, using fallback.', error.message);
        const item = dummyItems.find(i => i.id === itemId);
        const reviews = dummyReviews.filter(r => r.item_id === itemId);
        if (item) return res.json({ item, reviews });
        res.status(404).json({ message: 'Item not found' });
    }
});

// --- MODUL 2: Booking System & Ketersediaan ---

const dummyBookings = [];
const dummyNotifications = [];

app.get('/api/notifications/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const userNotifs = dummyNotifications.filter(n => n.user_id === userId).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(userNotifs);
});

app.post('/api/notifications/read/:id', (req, res) => {
    const notif = dummyNotifications.find(n => n.id === parseInt(req.params.id));
    if (notif) notif.is_read = true;
    res.json({ success: true });
});

app.get('/api/items/:id/availability', async (req, res) => {
    const itemId = parseInt(req.params.id);
    try {
        // In real app, query DB: SELECT start_date, end_date FROM bookings WHERE item_id = ?
        const bookedDates = dummyBookings.filter(b => b.item_id === itemId);
        res.json(bookedDates);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching availability' });
    }
});

app.post('/api/bookings/calculate', (req, res) => {
    const { itemId, durationDays } = req.body;
    const item = dummyItems.find(i => i.id === itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const rentCost = item.price_per_day * durationDays;
    const depositFee = 100000; // Flat deposit policy based on plan
    const totalCost = rentCost + depositFee;

    res.json({
        rentCost,
        depositFee,
        totalCost,
        durationDays
    });
});

app.post('/api/bookings', (req, res) => {
    const { itemId, startDate, endDate, durationDays, totalCost, depositFee, rentCost, customerId, customerName } = req.body;
    // In real app, START TRANSACTION, INSERT into bookings, COMMIT
    const newBooking = {
        id: dummyBookings.length + 1,
        item_id: itemId,
        customer_id: customerId || null,
        customer_name: customerName || 'Budi S.',
        start_date: startDate,
        end_date: endDate,
        status: 'PENDING_PAYMENT',
        total_cost: totalCost,
        deposit_fee: depositFee,
        rent_cost: rentCost
    };
    dummyBookings.push(newBooking);
    
    const item = dummyItems.find(i => i.id === itemId);
    if (item && item.vendor_id) {
        dummyNotifications.push({
            id: Date.now(),
            user_id: item.vendor_id,
            title: 'Pesanan Baru Masuk!',
            message: `Penyewa ${customerName || 'Budi S.'} telah memesan ${item.name}.`,
            is_read: false,
            timestamp: new Date().toISOString()
        });
    }
    
    res.json({ message: 'Booking created, pending payment.', booking: newBooking });
});

// --- MODUL 3: Manajemen Transaksi, Deposit & Revenue Sharing ---

app.get('/api/bookings/:id', (req, res) => {
    const booking = dummyBookings.find(b => b.id === parseInt(req.params.id));
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    const item = dummyItems.find(i => i.id === booking.item_id);
    res.json({ booking, item });
});

app.post('/api/payments/webhook', (req, res) => {
    const { bookingId, paymentMethod } = req.body;
    const booking = dummyBookings.find(b => b.id === parseInt(bookingId));
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = 'PAID';
    booking.payment_method = paymentMethod;
    
    res.json({ message: 'Payment successful', booking });
});

app.post('/api/transactions/complete', (req, res) => {
    const { bookingId, hasDamage } = req.body;
    const booking = dummyBookings.find(b => b.id === parseInt(bookingId));
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.status !== 'PAID') return res.status(400).json({ message: 'Booking is not paid yet' });

    // Revenue Split Logic
    const platformFeePercentage = 0.10; // 10%
    const vendorRevenue = booking.rent_cost * (1 - platformFeePercentage);
    const platformRevenue = booking.rent_cost * platformFeePercentage;

    // Deposit Logic
    let refundedDeposit = booking.deposit_fee;
    if (hasDamage) {
        refundedDeposit = 0; // Or partial refund depending on damage
    }

    booking.status = 'COMPLETED';
    
    // Simulate updating Vendor Wallet & User Refund
    res.json({
        message: 'Rental completed successfully',
        transactionDetails: {
            vendorRevenue,
            platformRevenue,
            refundedDeposit,
            damagePenalty: hasDamage ? booking.deposit_fee : 0
        }
    });
});

// --- MODUL 4: Komunikasi & Retensi Pengguna (Real Chat) ---

// chatRooms store: { roomId: { customerId, customerName, vendorId, messages: [ { sender: 'user'|'vendor', text, timestamp } ] } }
const chatRooms = {};

app.get('/api/chat/rooms/:vendorId', (req, res) => {
    const { vendorId } = req.params;
    const rooms = Object.keys(chatRooms)
        .filter(roomId => chatRooms[roomId].vendorId === parseInt(vendorId))
        .map(roomId => ({
            roomId,
            customerId: chatRooms[roomId].customerId,
            customerName: chatRooms[roomId].customerName,
            lastMessage: chatRooms[roomId].messages.length > 0 ? chatRooms[roomId].messages[chatRooms[roomId].messages.length - 1] : null
        }));
    res.json(rooms);
});

app.get('/api/chat/:roomId', (req, res) => {
    const { roomId } = req.params;
    if (!chatRooms[roomId]) return res.json([]);
    res.json(chatRooms[roomId].messages);
});

app.post('/api/chat/:roomId', (req, res) => {
    const { roomId } = req.params;
    const { text, sender, customerId, customerName, vendorId, profilePic } = req.body;
    
    if (!chatRooms[roomId]) {
        chatRooms[roomId] = { customerId, customerName, vendorId, messages: [] };
    }
    
    const newMessage = { sender, text, timestamp: new Date().toISOString(), profilePic };
    chatRooms[roomId].messages.push(newMessage);
    
    res.json({ message: 'Message sent', data: newMessage });
});

// --- MODUL 5: Dashboard & Advanced Analytics ---

app.get('/api/dashboard/stats/:vendorId', (req, res) => {
    const stats = {
        totalRevenue: dummyBookings.filter(b => b.status === 'COMPLETED').reduce((sum, b) => sum + (b.rent_cost || 0), 0),
        activeOrders: dummyBookings.filter(b => b.status === 'PAID').length,
        completedOrders: dummyBookings.filter(b => b.status === 'COMPLETED').length
    };
    res.json(stats);
});

// Admin Reset Endpoint
app.post('/api/admin/reset', (req, res) => {
    // Keep only admin user
    const adminUser = usersStore.find(u => u.role === 'admin');
    usersStore.length = 0;
    if (adminUser) usersStore.push(adminUser);
    
    dummyItems.length = 0;
    dummyBookings.length = 0;
    dummyReviews.length = 0;
    Object.keys(chatRooms).forEach(key => delete chatRooms[key]);
    
    res.json({ message: 'System reset successful' });
});

app.get('/api/dashboard/orders/:vendorId', (req, res) => {
    const { vendorId } = req.params;
    const vendorOrders = dummyBookings.map(b => {
        const item = dummyItems.find(i => i.id === b.item_id);
        return {
            id: b.id,
            itemName: item ? item.name : 'Unknown Item',
            renterName: b.customer_name || 'Budi S.', 
            startDate: b.start_date,
            endDate: b.end_date,
            status: b.status,
            totalCost: b.total_cost || 0
        };
    });
    res.json(vendorOrders);
});

app.get('/api/bookings/customer/:customerId', (req, res) => {
    const customerId = parseInt(req.params.customerId);
    const history = dummyBookings
        .filter(b => b.customer_id === customerId)
        .map(b => {
            const item = dummyItems.find(i => i.id === b.item_id);
            return {
                id: b.id,
                itemName: item ? item.name : 'Unknown Item',
                startDate: b.start_date,
                endDate: b.end_date,
                status: b.status,
                totalCost: b.total_cost || 0
            };
        });
    res.json(history);
});

// --- MODUL EKSTRA: Auth & RBAC ---

const usersStore = []; // Mock users: { id, name, email, password, role: 'admin' | 'customer' }

app.post('/api/auth/register', upload.single('profile_pic'), (req, res) => {
    const { name, email, password, role } = req.body;
    if (usersStore.find(u => u.email === email)) {
        return res.status(400).json({ message: 'Email already exists' });
    }
    
    let profile_pic = null;
    if (req.file) {
        // We'll return just the path or a fully qualified URL if we know the host.
        // For simplicity, let's store the relative path and let the frontend handle the host.
        profile_pic = `/uploads/${req.file.filename}`;
    }

    const newUser = { id: usersStore.length + 1, name, email, password, role, profile_pic };
    usersStore.push(newUser);
    res.json({ message: 'User registered', user: { id: newUser.id, name: newUser.name, role: newUser.role, profile_pic: newUser.profile_pic } });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = usersStore.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ message: 'Login successful', user: { id: user.id, name: user.name, role: user.role, profile_pic: user.profile_pic } });
});

app.put('/api/users/:id/profile', upload.single('profile_pic'), (req, res) => {
    const id = parseInt(req.params.id);
    const userIndex = usersStore.findIndex(u => u.id === id);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

    const { name, password } = req.body;
    
    if (name) usersStore[userIndex].name = name;
    if (password) usersStore[userIndex].password = password;
    
    if (req.file) {
        usersStore[userIndex].profile_pic = `/uploads/${req.file.filename}`;
    }

    const updatedUser = usersStore[userIndex];
    res.json({ message: 'Profile updated', user: { id: updatedUser.id, name: updatedUser.name, role: updatedUser.role, profile_pic: updatedUser.profile_pic } });
});

// Admin & Vendor Item Management
app.get('/api/items/manage/:userId/:role', (req, res) => {
    const { userId, role } = req.params;
    if (role === 'admin') {
        res.json(dummyItems); // Admin sees all
    } else {
        res.json(dummyItems.filter(i => i.vendor_id === parseInt(userId))); // Vendor sees own
    }
});

app.post('/api/items', upload.single('image'), (req, res) => {
    const { name, description, price_per_day, location, vendorId, vendorName } = req.body;
    let image_url = req.body.image_url;
    if (req.file) {
        image_url = `http://localhost:5000/uploads/${req.file.filename}`;
    }

    const newItem = {
        id: dummyItems.length ? Math.max(...dummyItems.map(i => i.id)) + 1 : 1,
        name, description, price_per_day: parseInt(price_per_day), location, image_url,
        vendor: { name: vendorName || 'Vendor', rating: 0 },
        vendor_id: parseInt(vendorId),
        rating: 0, reviews_count: 0,
        isVisible: true
    };
    dummyItems.push(newItem);
    dummyNotifications.push({
        id: Date.now(),
        user_id: parseInt(vendorId),
        title: 'Katalog Ditambahkan',
        message: `Barang ${name} berhasil ditambahkan ke katalog Anda.`,
        is_read: false,
        timestamp: new Date().toISOString()
    });
    res.json({ message: 'Item created', item: newItem });
});

app.put('/api/items/:id', upload.single('image'), (req, res) => {
    const id = parseInt(req.params.id);
    const itemIndex = dummyItems.findIndex(i => i.id === id);
    if (itemIndex === -1) return res.status(404).json({ message: 'Item not found' });
    
    // Ownership check
    const { userId, role } = req.query;
    if (role !== 'admin') {
        if (dummyItems[itemIndex].vendor_id !== parseInt(userId)) {
            return res.status(403).json({ message: 'Forbidden: You do not own this item' });
        }
    }

    const { name, description, price_per_day, location, isVisible } = req.body;
    let image_url = req.body.image_url; // fallback if they just pass url
    
    if (req.file) {
        image_url = `http://localhost:5000/uploads/${req.file.filename}`;
    }

    dummyItems[itemIndex] = { 
        ...dummyItems[itemIndex], 
        ...(name && {name}),
        ...(description && {description}),
        ...(price_per_day && {price_per_day: parseInt(price_per_day)}),
        ...(location && {location}),
        ...(image_url && {image_url}),
        ...(isVisible !== undefined && {isVisible: isVisible === 'true' || isVisible === true})
    };
    dummyNotifications.push({
        id: Date.now(),
        user_id: dummyItems[itemIndex].vendor_id,
        title: 'Katalog Diperbarui',
        message: `Barang ${dummyItems[itemIndex].name} berhasil diperbarui.`,
        is_read: false,
        timestamp: new Date().toISOString()
    });
    res.json({ message: 'Item updated', item: dummyItems[itemIndex] });
});

app.delete('/api/items/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const itemIndex = dummyItems.findIndex(i => i.id === id);
    if (itemIndex === -1) return res.status(404).json({ message: 'Item not found' });
    
    // Ownership check
    const { userId, role } = req.query;
    if (role !== 'admin') {
        if (dummyItems[itemIndex].vendor_id !== parseInt(userId)) {
            return res.status(403).json({ message: 'Forbidden: You do not own this item' });
        }
    }

    const deletedItemName = dummyItems[itemIndex].name;
    const vendorIdTarget = dummyItems[itemIndex].vendor_id;
    dummyItems.splice(itemIndex, 1);
    
    dummyNotifications.push({
        id: Date.now(),
        user_id: vendorIdTarget,
        title: 'Katalog Dihapus',
        message: `Barang ${deletedItemName} berhasil dihapus.`,
        is_read: false,
        timestamp: new Date().toISOString()
    });
    
    res.json({ message: 'Item deleted' });
});

// --- Reviews Management ---
app.get('/api/reviews', (req, res) => {
    // Admin route to see all reviews
    res.json(dummyReviews);
});

app.post('/api/reviews', (req, res) => {
    const { item_id, user, rating, comment } = req.body;
    const newReview = {
        id: dummyReviews.length ? Math.max(...dummyReviews.map(r => r.id)) + 1 : 1,
        item_id: parseInt(item_id),
        user,
        rating: parseInt(rating),
        comment
    };
    dummyReviews.push(newReview);
    
    // Update item rating
    const item = dummyItems.find(i => i.id === parseInt(item_id));
    if (item) {
        item.reviews_count += 1;
        // simplistic rating recalculation
        item.rating = ((item.rating * (item.reviews_count - 1)) + parseInt(rating)) / item.reviews_count;
    }
    
    res.json({ message: 'Review added', review: newReview });
});

app.delete('/api/reviews/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const reviewIndex = dummyReviews.findIndex(r => r.id === id);
    if (reviewIndex === -1) return res.status(404).json({ message: 'Review not found' });
    
    dummyReviews.splice(reviewIndex, 1);
    res.json({ message: 'Review deleted' });
});

app.use((err, req, res, next) => {
    console.error('Express Error:', err);
    res.status(500).json({ error: err.message || 'Unknown error' });
});

module.exports = app;
