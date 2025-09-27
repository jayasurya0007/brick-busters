import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Web3Provider } from './context/Web3Context';
import Layout from './components/Layout';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import PropertyCreatorDashboard from './pages/PropertyCreatorDashboard';
import InvestorDashboard from './pages/InvestorDashboard';
import PropertyDetails from './pages/PropertyDetails';
import Marketplace from './components/Marketplace';
import KYCVerification from './components/KYCVerification';
// import './App.css';

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/kyc" element={<KYCVerification />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/creator" element={<PropertyCreatorDashboard />} />
              <Route path="/investor" element={<InvestorDashboard />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/property/:id" element={<PropertyDetails />} />
            </Routes>
          </Layout>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;
