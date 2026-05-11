'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Star } from 'lucide-react'
import { getGenreLabel, getReleaseYear, type ReleaseItem } from '@/lib/api/discover'

interface ReleaseCardProps {
  item: ReleaseItem
  index?: number
}

export default function ReleaseCard({ item, index = 0 }: ReleaseCardProps) {
  const [imgError, setImgError] = useState(false)
  const year = getReleaseYear(item.release_date)
  const genre = getGenreLabel(item.genre_ids)
  const rating = item.vote_average.toFixed(1)
  const isMovie = item.media_type === 'movie'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="group relative rounded-lg overflow-hidden cursor-pointer flex flex-col"
      style={{ backgroundColor: 'var(--card)' }}
    >
      {/* Poster — proporção 2:3 igual Netflix */}
      <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: '2/3' }}>
        {item.poster_url && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.poster_url}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-2 relative overflow-hidden"
            style={{ backgroundColor: '#1c2a36' }}
          >
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, #4a8fa8 0, #4a8fa8 1px, transparent 0, transparent 50%)',
                backgroundSize: '12px 12px',
              }}
            />
            <div className="w-8 h-8 rounded-full opacity-50" style={{ backgroundColor: '#4a8fa8' }} />
            <p
              className="text-center text-[10px] font-semibold px-2 relative z-10 leading-tight"
              style={{ color: '#4a8fa8', maxWidth: '85%' }}
            >
              {item.title}
            </p>
          </div>
        )}

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

        {/* Rating — canto superior direito */}
        {item.vote_count > 10 && (
          <div
            className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          >
            <Star size={9} fill="#facc15" className="text-yellow-400" />
            <span className="text-[10px] font-semibold text-white leading-none">{rating}</span>
          </div>
        )}

        {/* Tipo — canto superior esquerdo, só em hover */}
        <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ backgroundColor: 'var(--ryvo-orange)', color: '#fffefb' }}
          >
            {isMovie ? 'Filme' : 'Série'}
          </span>
        </div>
      </div>

      {/* Info abaixo do poster — compacto */}
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
          {year} · {genre}
        </p>
      </div>
    </motion.div>
  )
}
