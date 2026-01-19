import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletProvider, useWallet } from './context/WalletContext';
import { SwapForm } from './components/SwapForm';
import { StakePanel } from './components/StakePanel';
import { LiquidityPanel } from './components/LiquidityPanel';
import { PoolStats } from './components/PoolStats';
import { Hero3D } from './components/premium/Hero3D';
import { FeatureCarousel } from './components/premium/FeatureCarousel';
import { SecurityDemo } from './components/premium/SecurityDemo';
import { RoadmapTimeline } from './components/premium/RoadmapTimeline';
import { CSSParticleField } from './components/premium/ParticleField';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TABS, TabId } from './components/TabsConfig';

type ViewMode = 'landing' | 'app';

interface TradingAppProps {
  onBack: () => void;
}

function TradingApp({ onBack }: TradingAppProps) {
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<TabId>('swap');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 sm:mb-8 transition-colors text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-1.5 sm:p-2 mb-4 sm:mb-6"
        >
          <div className="grid grid-cols-4 gap-1 sm:gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-xs sm:text-base ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="w-4 h-4 sm:w-5 sm:h-5">{tab.icon}</span>
                <span className="sm:inline text-[10px] sm:text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-20 sm:top-24 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-green-500/90 backdrop-blur-xl text-white font-medium shadow-lg text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="truncate">{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card p-4 sm:p-6"
        >
          {activeTab === 'swap' && (
            <SwapForm onSwapComplete={(tx) => showNotification(`Swap complete! TX: ${tx.slice(0, 10)}...`)} />
          )}
          {activeTab === 'stake' && (
            <StakePanel onStakeComplete={(tx) => showNotification(`Stake complete! TX: ${tx.slice(0, 10)}...`)} />
          )}
          {activeTab === 'liquidity' && (
            <LiquidityPanel onComplete={(tx) => showNotification(`Liquidity operation complete! TX: ${tx.slice(0, 10)}...`)} />
          )}
          {activeTab === 'pools' && <PoolStats />}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 sm:mt-6 glass-card p-4 sm:p-6"
        >
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-semibold mb-1 text-sm sm:text-base">Zero-Knowledge Privacy</h3>
              <p className="text-gray-400 text-xs sm:text-sm">
                All transactions are protected by ZK proofs. Your balances and amounts remain completely private.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

interface LandingPageProps {
  onLaunchApp: () => void;
}

function LandingPage({ onLaunchApp }: LandingPageProps) {
  return (
    <>
      <Hero3D onGetStarted={onLaunchApp} />
      <div id="features">
        <FeatureCarousel />
      </div>
      <div id="security">
        <SecurityDemo />
      </div>
      <div id="roadmap">
        <RoadmapTimeline />
      </div>
      <section className="py-16 sm:py-20 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-950/20 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Ready to Trade <span className="gradient-text">Privately</span>?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join the future of decentralized finance where your privacy comes first.
              Start swapping on Midnight Network today.
            </p>
            <motion.button
              onClick={onLaunchApp}
              className="btn-neon text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Launch App
            </motion.button>
          </motion.div>
        </div>
      </section>
    </>
  );
}

function AppContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const appRef = useRef<HTMLDivElement>(null);

  const handleLaunchApp = () => {
    setViewMode('app');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLanding = () => {
    setViewMode('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div ref={appRef} className="min-h-screen bg-midnight-950 text-white">
      <CSSParticleField count={30} />
      <Header viewMode={viewMode} onLogoClick={handleBackToLanding} />
      <AnimatePresence mode="wait">
        {viewMode === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LandingPage onLaunchApp={handleLaunchApp} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TradingApp onBack={handleBackToLanding} />
          </motion.div>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider autoConnect={false}>
      <AppContent />
    </WalletProvider>
  );
}
