/**
 * ZKSwap Vault - Feature Carousel Section
 *
 * Animated showcase of key features with 3D card effects.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

interface Feature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  details: string[];
}

// ============================================================================
// Feature Data
// ============================================================================

const FEATURES: Feature[] = [
  {
    id: 'private-swaps',
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="20" stroke="url(#grad1)" strokeWidth="2" />
        <path d="M16 24h16m-8-8v16" stroke="url(#grad1)" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: 'Private Swaps',
    description: 'Execute token swaps without revealing your balance or transaction amounts to the public.',
    gradient: 'from-purple-500 to-indigo-600',
    details: [
      'Hidden transaction amounts',
      'Private balance preservation',
      'Zswap protocol integration',
      'Instant finality',
    ],
  },
  {
    id: 'zk-proofs',
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
        <path d="M24 4L4 14v20l20 10 20-10V14L24 4z" stroke="url(#grad2)" strokeWidth="2" />
        <path d="M24 24l-10-5v10l10 5 10-5v-10l-10 5z" fill="url(#grad2)" fillOpacity="0.3" />
        <circle cx="24" cy="24" r="4" fill="url(#grad2)" />
        <defs>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: 'Zero-Knowledge Proofs',
    description: 'Cryptographic guarantees that validate transactions without exposing sensitive data.',
    gradient: 'from-cyan-500 to-blue-600',
    details: [
      'Balance verification',
      'Ownership proofs',
      'Compact circuit verification',
      'On-chain validation',
    ],
  },
  {
    id: 'liquidity',
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
        <circle cx="18" cy="24" r="10" stroke="url(#grad3)" strokeWidth="2" />
        <circle cx="30" cy="24" r="10" stroke="url(#grad3)" strokeWidth="2" />
        <path d="M24 16v16" stroke="url(#grad3)" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 4" />
        <defs>
          <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: 'Private Liquidity',
    description: 'Provide liquidity to pools while keeping your positions and rewards completely private.',
    gradient: 'from-emerald-500 to-cyan-600',
    details: [
      'Private LP positions',
      'Hidden rewards accrual',
      'Confidential withdrawals',
      'Shielded fee collection',
    ],
  },
  {
    id: 'staking',
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
        <rect x="8" y="28" width="8" height="12" rx="2" fill="url(#grad4)" fillOpacity="0.6" />
        <rect x="20" y="20" width="8" height="20" rx="2" fill="url(#grad4)" fillOpacity="0.8" />
        <rect x="32" y="12" width="8" height="28" rx="2" fill="url(#grad4)" />
        <path d="M4 44h40" stroke="url(#grad4)" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: 'Premium Staking',
    description: 'Stake NIGHT tokens to unlock premium features and earn rewards with privacy protection.',
    gradient: 'from-amber-500 to-red-500',
    details: [
      '100+ NIGHT premium tier',
      'Batch swap access',
      'Reduced fees',
      'Priority execution',
    ],
  },
  {
    id: 'security',
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
        <path d="M24 4L6 12v12c0 11 8 21 18 24 10-3 18-13 18-24V12L24 4z" stroke="url(#grad5)" strokeWidth="2" />
        <path d="M18 24l4 4 8-8" stroke="url(#grad5)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: 'Audited Security',
    description: 'Smart contracts audited for maximum security with comprehensive test coverage.',
    gradient: 'from-violet-500 to-pink-500',
    details: [
      'Formal verification',
      '100% test coverage',
      'Bug bounty program',
      'Open source contracts',
    ],
  },
];

// ============================================================================
// Card Component
// ============================================================================

interface FeatureCardProps {
  feature: Feature;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

function FeatureCard({ feature, isActive, onClick, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      onClick={onClick}
      className={`relative cursor-pointer group ${isActive ? 'z-10' : 'z-0'}`}
    >
      <motion.div
        animate={{
          scale: isActive ? 1.05 : 1,
          y: isActive ? -10 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="glass-card p-8 h-full"
      >
        {/* Glow Effect */}
        <motion.div
          className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500`}
          animate={{ opacity: isActive ? 0.4 : 0 }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <motion.div
            className="mb-6"
            animate={{ scale: isActive ? 1.1 : 1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {feature.icon}
          </motion.div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>

          {/* Description */}
          <p className="text-gray-400 mb-4 line-clamp-2">{feature.description}</p>

          {/* Expandable Details */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <ul className="space-y-2 pt-4 border-t border-white/10">
                  {feature.details.map((detail, i) => (
                    <motion.li
                      key={detail}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${feature.gradient}`} />
                      {detail}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expand Indicator */}
          <motion.div
            className="mt-4 flex items-center gap-2 text-sm text-gray-500"
            animate={{ opacity: isActive ? 0 : 1 }}
          >
            <span>Click to expand</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function FeatureCarousel() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-midnight opacity-50" />
      <div className="absolute inset-0 grid-pattern" />

      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="section-container relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 mb-4"
          >
            Platform Features
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Built for <span className="gradient-text">Privacy</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Every feature designed from the ground up to protect your financial privacy
            while delivering a seamless DeFi experience.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              isActive={activeFeature === feature.id}
              onClick={() => setActiveFeature(activeFeature === feature.id ? null : feature.id)}
              index={index}
            />
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { value: '100%', label: 'Private Transactions' },
            { value: '<1s', label: 'Proof Generation' },
            { value: '0.5%', label: 'Base Fee' },
            { value: '24/7', label: 'Uptime' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="glass-card p-6 text-center"
            >
              <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default FeatureCarousel;
