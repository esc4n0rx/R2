'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Play, Tag } from 'lucide-react'
import { useGenreBrowse } from '@/hooks/use-catalog'
import type { ContentCard } from '@/lib/api/catalog'

interface GenreBrowseViewProps {
  genre: string
  contentType: 'movie' | 'series'
  onClose: () => void
  onItemClick: (item: ContentCard) => void
}

function BrowseCard({
  item,
  onClick,
  index,
}: {
  item: ContentCard
  onClick: (item: ContentCard) => void
  index: number
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      onClick={() => onClick(item)}
      className="group rounded-xl border overflow-hidden text-left w-full flex flex-col transition-all duration-300"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ryvo-orange)')
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')
      }
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden">
        {item.poster_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.poster_url}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center relative"
            style={{ backgroundColor: 'var(--muted)' }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, var(--ryvo-orange) 0, var(--ryvo-orange) 1px, transparent 0, transparent 50%)`,
                backgroundSize: '8px 8px',
              }}
            />
            <span
              className="text-[10px] font-semibold text-center px-2 z-10 relative leading-tight"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {item.title}
            </span>
          </div>
        )}

        {/* Hover play */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all duration-200 flex items-center justify-center">
          <div
            className="w-11 h-11 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-lg"
            style={{ backgroundColor: 'var(--ryvo-orange)' }}
          >
            <Play size={15} fill="white" className="text-white ml-0.5" />
          </div>
        </div>

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span
            className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: 'rgba(0,0,0,0.75)',
              color: '#fff',
              fontFamily: 'var(--font-inter)',
            }}
          >
            {item.type === 'movie' ? 'Filme' : 'Série'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5 flex-1">
        <p
          className="text-sm font-semibold truncate leading-tight transition-colors"
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
        >
          {item.title}
        </p>
        {item.genres && item.genres.length > 0 && (
          <p
            className="text-[11px] mt-0.5 truncate"
            style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
          >
            {item.genres.slice(0, 2).map((g) => typeof g === 'string' ? g : (g as any).name).join(' · ')}
          </p>
        )}
      </div>
    </motion.button>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div
            className="aspect-[2/3] rounded-xl animate-pulse"
            style={{ backgroundColor: 'var(--muted)' }}
          />
          <div
            className="h-3 w-3/4 rounded animate-pulse"
            style={{ backgroundColor: 'var(--muted)' }}
          />
        </div>
      ))}
    </div>
  )
}

export default function GenreBrowseView({
  genre,
  contentType,
  onClose,
  onItemClick,
}: GenreBrowseViewProps) {
  const { items, isLoading, isLoadingMore, hasMore, error, loadMore } = useGenreBrowse(
    genre,
    contentType,
  )

  // Intersection observer sentinel for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, loadMore])

  const label = contentType === 'movie' ? 'Filmes' : 'Séries'

  return (
    <AnimatePresence>
      <motion.div
        key={`genre-browse-${genre}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="min-h-screen"
        style={{ backgroundColor: 'var(--background)' }}
      >
        {/* Header bar */}
        <div
          className="sticky top-0 z-30 border-b px-6 md:px-12 lg:px-16 py-4 flex items-center gap-4"
          style={{
            backgroundColor: 'var(--background)',
            borderBottomColor: 'var(--border)',
          }}
        >
          {/* Genre pill */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{
              backgroundColor: 'var(--ryvo-orange)',
              borderColor: 'var(--ryvo-orange)',
            }}
          >
            <Tag size={13} className="text-white" />
            <span
              className="text-sm font-semibold text-white"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {genre}
            </span>
          </div>

          <span
            className="text-sm"
            style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
          >
            {label} · {items.length > 0 ? `${items.length}${hasMore ? '+' : ''} resultado${items.length !== 1 ? 's' : ''}` : ''}
          </span>

          <div className="flex-1" />

          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
              backgroundColor: 'transparent',
              fontFamily: 'var(--font-inter)',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
            }
          >
            <X size={14} />
            Fechar
          </button>
        </div>

        {/* Grid content */}
        <div className="px-6 md:px-12 lg:px-16 py-8">
          {/* Loading initial */}
          {isLoading && <SkeletonGrid />}

          {/* Error */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p
                className="text-sm"
                style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
              >
                {error}
              </p>
              <button
                onClick={onClose}
                className="text-sm underline"
                style={{ color: 'var(--ryvo-orange)', fontFamily: 'var(--font-inter)' }}
              >
                Voltar
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Tag size={36} style={{ color: 'var(--border)' }} />
              <p
                className="text-base font-semibold"
                style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}
              >
                Nenhum conteúdo em &ldquo;{genre}&rdquo;
              </p>
              <p
                className="text-sm text-center max-w-xs"
                style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
              >
                Não encontramos {label.toLowerCase()} nesse gênero no momento.
              </p>
            </div>
          )}

          {/* Results grid */}
          {!isLoading && items.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {items.map((item, i) => (
                <BrowseCard key={item.id} item={item} onClick={onItemClick} index={i} />
              ))}
            </div>
          )}

          {/* Load more sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {/* Loading more indicator */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-8 gap-2" style={{ color: 'var(--muted-foreground)' }}>
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm" style={{ fontFamily: 'var(--font-inter)' }}>
                Carregando mais…
              </span>
            </div>
          )}

          {/* End of results */}
          {!hasMore && !isLoading && items.length > 0 && (
            <div className="flex items-center justify-center py-8">
              <p
                className="text-xs"
                style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
              >
                Todos os {items.length} resultados exibidos
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
