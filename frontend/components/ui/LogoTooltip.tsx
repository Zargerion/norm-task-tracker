'use client';
import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { text: 'text-2xl', img: { w: 100, h: 30 } },
  md: { text: 'text-3xl', img: { w: 120, h: 37 } },
  lg: { text: 'text-4xl', img: { w: 140, h: 43 } },
};

export function LogoTooltip({ size = 'md', className = '' }: Props) {
  const [visible, setVisible] = useState(false);
  const { text, img } = sizeMap[size];

  return (
    <span
      className={`relative inline-block cursor-default select-none ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span
        className={`${text}`}
        style={{
          color: 'var(--accent-gold)',
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontWeight: 600,
          letterSpacing: '0.04em',
        }}
      >
        Norm Task Tracker
      </span>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 pointer-events-none"
          >
            <div
              className="rounded-xl px-3 py-2 shadow-lg border"
              style={{
                background: 'var(--bg-panel)',
                borderColor: 'var(--border-card)',
                boxShadow: '0 8px 32px rgba(200,169,110,0.15)',
                width: img.w + 24,
              }}
            >
              <Image
                src="/logo.png"
                alt="Норм Таск Трекер"
                width={img.w}
                height={img.h}
                style={{ width: img.w, height: 'auto' }}
              />
            </div>
            {/* arrow */}
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: '6px solid var(--border-card)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
