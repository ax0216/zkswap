/**
 * ZKSwap Vault - Roadmap Timeline Section
 *
 * Animated timeline showing Midnight Network development phases.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

interface RoadmapPhase {
  id: string;
  quarter: string;
  year: string;
  title: string;
  status: 'completed' | 'current' | 'upcoming';
  items: string[];
  highlight?: string;
}

// ============================================================================
// Roadmap Data
// ============================================================================

const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: 'q4-2025',
    quarter: 'Q4',
    year: '2025',
    title: 'Foundation',
    status: 'completed',
    items: [
      'Smart contract development',
      'ZK circuit design & testing',
      'Core SDK implementation',
      'Internal security review',
    ],
    highlight: 'Compact smart contracts deployed',
  },
  {
    id: 'q1-2026',
    quarter: 'Q1',
    year: '2026',
    title: 'Testnet Launch',
    status: 'current',
    items: [
      'Public testnet deployment',
      'Premium UI development',
      'Community testing program',
      'Bug bounty initiation',
    ],
    highlight: 'Currently live on testnet',
  },
  {
    id: 'q2-2026',
    quarter: 'Q2',
    year: '2026',
    title: 'Beta Release',
    status: 'upcoming',
    items: [
      'Third-party security audit',
      'Performance optimization',
      'Multi-pool support',
      'Advanced analytics',
    ],
  },
  {
    id: 'q3-2026',
    quarter: 'Q3',
    year: '2026',
    title: 'Mainnet Launch',
    status: 'upcoming',
    items: [
      'Mainnet deployment',
      'Liquidity mining program',
      'Governance token launch',
      'Cross-chain bridges',
    ],
  },
  {
    id: 'q4-2026',
    quarter: 'Q4',
    year: '2026',
    title: 'Ecosystem Growth',
    status: 'upcoming',
    items: [
      'Partner integrations',
      'Institutional features',
      'Mobile app launch',
      'DAO governance',
    ],
  },
];

// ============================================================================
// Phase Card Component
// ============================================================================

interface PhaseCardProps {
  phase: RoadmapPhase;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function PhaseCard({ phase, index, isExpanded, onToggle }: PhaseCardProps) {
  const statusColors = {
    completed: 'from-green-500 to-emerald-600',
    current: 'from-purple-500 to-indigo-600',
    upcoming: 'from-gray-500 to-gray-600',
  };

  const statusLabels = {
    completed: 'Completed',
    current: 'In Progress',
    upcoming: 'Upcoming',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`relative ${index % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8'}`}
    >
      {/* Timeline Dot */}
      <motion.div
        className={`
          hidden md:block absolute top-6 w-4 h-4 rounded-full
          bg-gradient-to-r ${statusColors[phase.status]}
          ${index % 2 === 0 ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'}
        `}
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
      >
        {phase.status === 'current' && (
          <motion.div
            className="absolute inset-0 rounded-full bg-purple-500"
            animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Card */}
      <motion.div
        onClick={onToggle}
        className={`
          glass-card p-6 cursor-pointer
          ${phase.status === 'current' ? 'ring-2 ring-purple-500/50' : ''}
        `}
        whileHover={{ scale: 1.02 }}
        animate={{ scale: isExpanded ? 1.02 : 1 }}
      >
        {/* Header */}
        <div className={`flex items-start gap-4 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
          {/* Date Badge */}
          <div className={`
            shrink-0 px-3 py-1.5 rounded-lg bg-gradient-to-r ${statusColors[phase.status]}
            text-white font-bold text-sm
          `}>
            {phase.quarter} {phase.year}
          </div>

          <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : ''}`}>
            <h3 className="text-xl font-bold text-white mb-1">{phase.title}</h3>
            <span className={`
              text-xs px-2 py-0.5 rounded-full
              ${phase.status === 'completed' ? 'bg-green-500/20 text-green-400' : ''}
              ${phase.status === 'current' ? 'bg-purple-500/20 text-purple-400' : ''}
              ${phase.status === 'upcoming' ? 'bg-gray-500/20 text-gray-400' : ''}
            `}>
              {statusLabels[phase.status]}
            </span>
          </div>
        </div>

        {/* Highlight */}
        {phase.highlight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`
              mt-4 px-3 py-2 rounded-lg bg-white/5 border border-white/10
              text-sm text-gray-300
              ${index % 2 === 0 ? 'md:text-right' : ''}
            `}
          >
            ✨ {phase.highlight}
          </motion.div>
        )}

        {/* Expandable Items */}
        <motion.div
          initial={false}
          animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
          className="overflow-hidden"
        >
          <ul className={`
            mt-4 space-y-2 pt-4 border-t border-white/10
            ${index % 2 === 0 ? 'md:text-right' : ''}
          `}>
            {phase.items.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: index % 2 === 0 ? 20 : -20 }}
                animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : (index % 2 === 0 ? 20 : -20) }}
                transition={{ delay: i * 0.1 }}
                className={`
                  flex items-center gap-2 text-sm text-gray-400
                  ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}
                `}
              >
                <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${statusColors[phase.status]}`} />
                {item}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Expand Indicator */}
        <motion.div
          className={`
            mt-4 flex items-center gap-1 text-xs text-gray-500
            ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}
          `}
          animate={{ opacity: isExpanded ? 0 : 1 }}
        >
          <span>View details</span>
          <motion.svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            animate={{ rotate: isExpanded ? 180 : 0 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function RoadmapTimeline() {
  const [expandedPhase, setExpandedPhase] = useState<string | null>('q1-2026');

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-midnight" />
      <div className="absolute inset-0 grid-pattern opacity-50" />

      {/* Floating Orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

      <div className="section-container relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 mb-4">
            Development Journey
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our <span className="gradient-text">Roadmap</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Building the future of private DeFi on Midnight Network, one milestone at a time.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Central Line - Desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-purple-500 to-gray-600" />

          {/* Phase Cards */}
          <div className="space-y-8">
            {ROADMAP_PHASES.map((phase, index) => (
              <div
                key={phase.id}
                className={`md:w-1/2 ${index % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'}`}
              >
                <PhaseCard
                  phase={phase}
                  index={index}
                  isExpanded={expandedPhase === phase.id}
                  onToggle={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-400 mb-6">
            Want to stay updated on our progress?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-neon px-6 py-3">
              Join Community
            </button>
            <button className="px-6 py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-all">
              View GitHub
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default RoadmapTimeline;
