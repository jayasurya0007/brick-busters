import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { Wallet, Home, Shield, Building, Users, Menu, X } from 'lucide-react';
import { useState } from 'react';
import logo from '../assets/logo.jpg';

const Layout = ({ children }) => {
  const { account, isConnected, connectWallet, disconnectWallet, isWalletVerified } = useWeb3();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'KYC', href: '/kyc', icon: Shield },
    { name: 'Marketplace', href: '/marketplace', icon: Building },
    { name: 'Creator', href: '/creator', icon: Building },
    { name: 'Investor', href: '/investor', icon: Users },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-card shadow-lg border-b border-dark-border backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 group">
                <img src={logo} alt="Logo" className="h-8 w-8 text-primary-500 group-hover:text-primary-400 transition-colors" />
                <span className="text-xl font-bold text-dark-text-primary">Brick Busters</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive(item.href)
                        ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20'
                        : 'text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-border/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Wallet Connection */}
            <div className="flex items-center space-x-4">
              {isConnected ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-dark-border/30 px-3 py-2 rounded-lg">
                    <div className="h-2 w-2 bg-secondary-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-dark-text-secondary font-mono">
                      {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connected'}
                    </span>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="bg-dark-border hover:bg-red-500/20 hover:border-red-500/30 text-dark-text-secondary hover:text-red-400 font-medium py-2 px-4 rounded-lg transition-all duration-300 border border-dark-border"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-6 rounded-lg transition-all duration-300 flex items-center space-x-2 group"
                >
                  <Wallet className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>Connect Wallet</span>
                </button>
              )}

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-border/50 transition-all duration-300"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-dark-border bg-dark-card/95 backdrop-blur-sm">
            <div className="px-4 pt-4 pb-6 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 ${
                      isActive(item.href)
                        ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20'
                        : 'text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-border/50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default Layout;
