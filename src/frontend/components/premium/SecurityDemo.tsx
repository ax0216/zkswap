/**
 * ZKSwap Vault - Security Demo Section
 *
 * Interactive demonstration of ZK proof generation and verification.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

type DemoStep = 'idle' | 'input' | 'proving' | 'verified';

interface ProofData {
  commitment: string;
  nullifier: string;
  proof: string;
  publicInputs: string[];
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateRandomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '0x';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function generateProofData(): ProofData {
  return {
    commitment: generateRandomHex(64),
    nullifier: generateRandomHex(64),
    proof: generateRandomHex(256),
    publicInputs: [
      generateRandomHex(32),
      generateRandomHex(32),
      generateRandomHex(32),
    ],
  };
}

// ============================================================================
// Animation Components
// ============================================================================

function CircuitAnimation({ isActive }: { isActive: boolean }) {
  const paths = [
    'M20,50 Q50,20 80,50 T140,50',
    'M20,80 Q60,60 100,80 T180,80',
    'M40,30 L60,50 L80,30 L100,50 L120,30',
    'M30,90 C50,70 70,110 90,90 C110,70 130,110 150,90',
  ];

  return (
    <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 120">
      {paths.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke={`url(#circuit-grad-${i})`}
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={isActive ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: 1.5, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="circuit-grad-0" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="circuit-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="circuit-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="circuit-grad-3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      {/* Animated nodes */}
      {isActive && [20, 80, 140, 180].map((x, i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={50 + (i % 2) * 30}
          r="4"
          fill="#8b5cf6"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 1], opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 + i * 0.2 }}
        />
      ))}
    </svg>
  );
}

function DataFlowParticles({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-purple-500 rounded-full"
          initial={{
            x: '50%',
            y: '50%',
            opacity: 0,
          }}
          animate={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            delay: i * 0.1,
            repeat: Infinity,
            repeatDelay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SecurityDemo() {
  const [step, setStep] = useState<DemoStep>('idle');
  const [amount, setAmount] = useState('100');
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [progress, setProgress] = useState(0);

  // Simulate proof generation
  useEffect(() => {
    if (step === 'proving') {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            setStep('verified');
            setProofData(generateProofData());
            return 100;
          }
          return p + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step]);

  const startDemo = () => {
    setStep('input');
    setProofData(null);
  };

  const generateProof = () => {
    setStep('proving');
  };

  const resetDemo = () => {
    setStep('idle');
    setProofData(null);
    setProgress(0);
  };

  return (
    <section className="w-full py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-midnight-950 via-purple-950/20 to-midnight-950" />

      <div className="section-container relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 mb-4">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            See <span className="gradient-text">Privacy</span> in Action
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Watch how ZK proofs protect your transaction data while validating on-chain.
          </p>
        </motion.div>

        {/* Demo Container */}
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-8 relative"
          >
            <DataFlowParticles isActive={step === 'proving'} />

            {/* Demo Steps */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Input Side */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-lg">1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">Your Private Data</h3>
                </div>

                {/* Hidden Data Display */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <label className="block text-sm text-gray-500 mb-2">Amount (Hidden)</label>
                    <AnimatePresence mode="wait">
                      {step === 'idle' ? (
                        <motion.div
                          key="hidden"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-2xl font-mono text-gray-600"
                        >
                          ••••••
                        </motion.div>
                      ) : (
                        <motion.input
                          key="input"
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          disabled={step !== 'input'}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full bg-transparent text-2xl font-mono text-white outline-none disabled:text-gray-400"
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <label className="block text-sm text-gray-500 mb-2">Balance (Hidden)</label>
                    <div className="text-2xl font-mono text-gray-600">
                      {step === 'idle' ? '••••••' : '1,000 DUST'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2 text-red-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-sm font-medium">Never leaves your device</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Proof Side */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                    <span className="text-lg">2</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">Public ZK Proof</h3>
                </div>

                {/* Circuit Animation */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 min-h-[160px] flex items-center justify-center">
                  <CircuitAnimation isActive={step === 'proving' || step === 'verified'} />
                </div>

                {/* Proof Output */}
                <AnimatePresence mode="wait">
                  {step === 'proving' && (
                    <motion.div
                      key="proving"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-purple-400">Generating proof...</span>
                        <span className="text-sm text-purple-400">{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-purple-500/20 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                        />
                      </div>
                    </motion.div>
                  )}

                  {step === 'verified' && proofData && (
                    <motion.div
                      key="verified"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-medium">Proof Verified</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Validates you have sufficient balance without revealing the amount.
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-xs text-gray-500 mb-1">Commitment</div>
                        <div className="text-xs font-mono text-cyan-400 break-all">
                          {proofData.commitment.slice(0, 30)}...
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-xs text-gray-500 mb-1">Proof Hash</div>
                        <div className="text-xs font-mono text-purple-400 break-all">
                          {proofData.proof.slice(0, 30)}...
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-8 flex justify-center">
              <AnimatePresence mode="wait">
                {step === 'idle' && (
                  <motion.button
                    key="start"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={startDemo}
                    className="btn-neon px-8 py-3"
                  >
                    Try Demo
                  </motion.button>
                )}
                {step === 'input' && (
                  <motion.button
                    key="generate"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={generateProof}
                    className="btn-neon px-8 py-3"
                  >
                    Generate ZK Proof
                  </motion.button>
                )}
                {step === 'verified' && (
                  <motion.button
                    key="reset"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={resetDemo}
                    className="px-8 py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-all"
                  >
                    Reset Demo
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 flex flex-wrap justify-center gap-8"
        >
          {[
            { icon: '🔐', text: 'Military-Grade Encryption' },
            { icon: '⚡', text: 'Sub-Second Proofs' },
            { icon: '🛡️', text: 'Audited Circuits' },
            { icon: '🌐', text: 'Decentralized Verification' },
          ].map((item, i) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-sm text-gray-400">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default SecurityDemo;
