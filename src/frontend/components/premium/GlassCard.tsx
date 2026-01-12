/**
 * ZKSwap Vault - Reusable Glass Card Component
 *
 * Glassmorphism card with animated borders and glow effects.
 */

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  variant?: 'default' | 'glow' | 'neon' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  animated?: boolean;
}

// ============================================================================
// Variants
// ============================================================================

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantClasses = {
  default: '',
  glow: 'shadow-glow hover:shadow-glow-lg',
  neon: 'neon-border',
  gradient: 'bg-gradient-to-br from-purple-500/10 to-cyan-500/10',
};

// ============================================================================
// Component
// ============================================================================

export function GlassCard({
  children,
  variant = 'default',
  padding = 'md',
  hover = true,
  animated = true,
  className = '',
  ...props
}: GlassCardProps) {
  const baseClasses = `
    relative overflow-hidden rounded-2xl
    bg-glass-dark backdrop-blur-xl
    border border-glass-border
    ${paddingClasses[padding]}
    ${variantClasses[variant]}
    ${hover ? 'transition-all duration-300 hover:border-white/20' : ''}
    ${className}
  `;

  const content = (
    <>
      {/* Top shine line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Animated shine effect for neon variant */}
      {variant === 'neon' && animated && (
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
          initial={false}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </motion.div>
      )}
    </>
  );

  if (animated) {
    return (
      <motion.div
        className={`group ${baseClasses}`}
        whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        {...props}
      >
        {content}
      </motion.div>
    );
  }

  return <div className={`group ${baseClasses}`}>{content}</div>;
}

// ============================================================================
// Stat Card Variant
// ============================================================================

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  trend?: { value: number; positive: boolean };
  gradient?: string;
}

export function StatCard({ value, label, icon, trend, gradient = 'from-purple-500 to-indigo-600' }: StatCardProps) {
  return (
    <GlassCard variant="default" padding="md" className="text-center">
      {icon && (
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${gradient} bg-opacity-20 mb-4`}>
          {icon}
        </div>
      )}
      <div className="text-3xl font-bold gradient-text mb-1">{value}</div>
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      {trend && (
        <div className={`inline-flex items-center gap-1 text-xs ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
          <svg className={`w-3 h-3 ${trend.positive ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          {trend.value}%
        </div>
      )}
    </GlassCard>
  );
}

// ============================================================================
// Feature Card Variant
// ============================================================================

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient?: string;
  onClick?: () => void;
}

export function FeatureCard({ icon, title, description, gradient = 'from-purple-500 to-indigo-600', onClick }: FeatureCardProps) {
  return (
    <GlassCard
      variant="default"
      padding="lg"
      className="cursor-pointer"
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
    >
      {/* Icon */}
      <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${gradient} bg-opacity-20 mb-6`}>
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>

      {/* Description */}
      <p className="text-gray-400 leading-relaxed">{description}</p>

      {/* Arrow */}
      <div className="mt-4 flex items-center gap-2 text-sm text-purple-400 group-hover:text-purple-300 transition-colors">
        <span>Learn more</span>
        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </GlassCard>
  );
}

export default GlassCard;
