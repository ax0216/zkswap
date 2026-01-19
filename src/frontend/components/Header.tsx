import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { WalletConnect } from './WalletConnect';

type ViewMode = 'landing' | 'app';

interface HeaderProps {
  viewMode: ViewMode;
  onLogoClick: () => void;
}

export function Header({ viewMode, onLogoClick }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || viewMode === 'app'
          ? 'bg-midnight-950/90 backdrop-blur-xl border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={onLogoClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 blur opacity-30" />
            </div>
            <div>
              <span className="text-xl font-bold gradient-text">ZKSwap</span>
              <span className="text-xl font-bold text-white"> Vault</span>
            </div>
          </motion.div>

          {viewMode === 'landing' && (
            <nav className="hidden md:flex items-center gap-8">
              {['Features', 'Security', 'Roadmap'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {item}
                </a>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Testnet</span>
            </div>
            <WalletConnect />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
