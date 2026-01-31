import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateAuction from './pages/CreateAuction';
import AuctionList from './pages/AuctionList';
import LiveAuction from './pages/LiveAuction';
import AuctionDetails from './pages/AuctionDetails';
import MyBids from './pages/MyBids';
import MyAuctions from './pages/MyAuctions';
import Profile from './pages/Profile';
import { useAuth } from './context/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <div className="app">
            <Navbar />
            <main>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auctions" element={<AuctionList />} />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* Auctioneer Routes */}
                <Route
                  path="/create-auction"
                  element={
                    <ProtectedRoute requiredRole="auctioneer">
                      <CreateAuction />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/my-auctions"
                  element={
                    <ProtectedRoute requiredRole="auctioneer">
                      <MyAuctions />
                    </ProtectedRoute>
                  }
                />

                {/* Bidder Routes */}
                <Route
                  path="/my-bids"
                  element={
                    <ProtectedRoute requiredRole="bidder">
                      <MyBids />
                    </ProtectedRoute>
                  }
                />

                {/* Auction Routes */}
                <Route
                  path="/auction/:id"
                  element={
                    <ProtectedRoute>
                      <AuctionDetails />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/auction/:id/live"
                  element={
                    <ProtectedRoute>
                      <LiveAuction />
                    </ProtectedRoute>
                  }
                />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
