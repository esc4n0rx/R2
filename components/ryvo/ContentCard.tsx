'use client'

import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import type { ContentItem } from '@/lib/mock-data'

interface ContentCardProps {
  item: ContentItem
  onClick: (item: ContentItem) => void
  variant?: 'default' | 'new' | 'recommended'
  index?: number
}

export default function ContentCard({ item, onClick, variant = 'default', index = 0 }: ContentCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={() => onClick(item)}
      className="group relative rounded-lg overflow-hidden cursor-pointer text-left w-full flex flex-col"
      style={{ backgroundColor: 'var(--card)' }}
    >
      {/* Poster 2:3 */}
      <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: '2/3' }}>
        {/* Placeholder colorido */}
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-2 relative overflow-hidden"
          style={{ backgroundColor: item.posterColor }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, ${item.accentColor} 0, ${item.accentColor} 1px, transparent 0, transparent 50%)`,
              backgroundSize: '12px 12px',
            }}
          />
          <div className="w-8 h-8 rounded-full opacity-60 relative z-10" style={{ backgroundColor: item.accentColor }} />
          <p
            className="text-center text-[10px] font-semibold px-2 relative z-10 leading-tight"
            style={{ color: item.accentColor, maxWidth: '85%' }}
          >
            {item.title}
          </p>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-all duration-300 flex items-center justify-center">
          <div className="scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: 'var(--ryvo-orange)' }}
            >
              <Play size={16} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
        </div>

        {/* Match badge — só recomendados, aparece em hover */}
        {variant === 'recommended' && item.matchScore && (
          <div
            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: item.matchScore >= 90 ? 'var(--ryvo-orange)' : 'rgba(0,0,0,0.7)',
              color: '#fff',
            }}
          >
            <span className="text-[10px] font-semibold leading-none">{item.matchScore}%</span>
          </div>
        )}

        {/* Novo badge */}
        {item.isNew && (
          <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'var(--ryvo-orange)', color: '#fffefb' }}
            >
              Novo
            </span>
          </div>
        )}
      </div>

      {/* Info abaixo — compacto */}
      <div className="pt-2 pb-1 px-0.5">
        <h3
          className="text-xs font-semibold leading-snug truncate"
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
        >
          {item.title}
        </h3>
        <p
          className="text-[10px] mt-0.5 truncate"
          style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
        >
          {item.year} · {item.genre[0]}
        </p>
      </div>
    </motion.button>
  )
}
