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
    <div className="w-full min-h-screen pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-1.5 sm:gap-2 text-gray-400 hover:text-white mb-4 sm:mb-6 md:mb-8 transition-colors text-xs sm:text-sm md:text-base"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-1 sm:p-1.5 md:p-2 mb-3 sm:mb-4 md:mb-6"
        >
          <div className="grid grid-cols-4 gap-0.5 sm:gap-1 md:gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 md:gap-2 px-1.5 sm:px-2 md:px-4 py-1.5 sm:py-2 md:py-3 rounded-md sm:rounded-lg md:rounded-xl font-medium transition-all text-[10px] sm:text-xs md:text-sm lg:text-base ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5">{tab.icon}</span>
                <span className="leading-tight sm:leading-normal">{tab.label}</span>
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
              className="fixed top-16 sm:top-20 md:top-24 left-3 right-3 sm:left-4 sm:right-4 md:left-auto md:right-4 md:max-w-md z-50 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl bg-green-500/90 backdrop-blur-xl text-white font-medium shadow-lg text-xs sm:text-sm md:text-base"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          className="glass-card p-0 sm:p-3 md:p-4 lg:p-6 overflow-hidden"
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
          className="mt-3 sm:mt-4 md:mt-6 glass-card p-3 sm:p-4 md:p-6"
        >
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 md:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-semibold mb-0.5 sm:mb-1 text-xs sm:text-sm md:text-base">Zero-Knowledge Privacy</h3>
              <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm leading-snug">
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
      <div id="features" className="w-full">
        <FeatureCarousel />
      </div>
      <div id="security" className="w-full">
        <SecurityDemo />
      </div>
      <div id="roadmap" className="w-full">
        <RoadmapTimeline />
      </div>
      <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-950/20 to-transparent" />
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 md:mb-6 leading-tight">
              Ready to Trade <span className="gradient-text">Privately</span>?
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 mb-5 sm:mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed">
              Join the future of decentralized finance where your privacy comes first.
              Start swapping on Midnight Network today.
            </p>
            <motion.button
              onClick={onLaunchApp}
              className="btn-neon text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-4"
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
    <div ref={appRef} className="w-full min-h-screen bg-midnight-950 text-white">
      <CSSParticleField count={30} />
      <Header viewMode={viewMode} onLogoClick={handleBackToLanding} />
      <AnimatePresence mode="wait">
        {viewMode === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <LandingPage onLaunchApp={handleLaunchApp} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
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
