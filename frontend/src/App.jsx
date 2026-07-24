import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import CustomerHistory from './pages/CustomerHistory';

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Navbar user={user} onLogout={() => setUser(null)} />
      <Routes>
        <Route path="/auth" element={!user ? <Auth onLogin={setUser} /> : <Navigate to={(user.role === 'admin' || user.role === 'vendor') ? '/dashboard' : '/'} />} />
        
        <Route path="/" element={user ? <Home user={user} /> : <Navigate to="/auth" />} />
        <Route path="/item/:id" element={user ? <ProductDetail user={user} /> : <Navigate to="/auth" />} />
        <Route path="/checkout/:id" element={user ? <Checkout user={user} /> : <Navigate to="/auth" />} />
        <Route path="/profile" element={user ? <Profile user={user} onUpdateUser={setUser} /> : <Navigate to="/auth" />} />
        <Route path="/history" element={user && user.role === 'customer' ? <CustomerHistory user={user} /> : <Navigate to="/auth" />} />
        
        <Route path="/dashboard" element={user && (user.role === 'admin' || user.role === 'vendor') ? <Dashboard user={user} /> : <Navigate to="/auth" />} />
      </Routes>
    </Router>
  );
}

export default App;
