import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CollectionView from './pages/CollectionView';
import Profile from './pages/Profile';
import JoinCollection from './pages/JoinCollection';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/collection/:id" element={
          <ProtectedRoute>
            <CollectionView />
          </ProtectedRoute>
        } />
        <Route path="/join/:token" element={
          <ProtectedRoute>
            <JoinCollection />
          </ProtectedRoute>
        } />
      </Routes>

    </Router>
  );
}

export default App;
