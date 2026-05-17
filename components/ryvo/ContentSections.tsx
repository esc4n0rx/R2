'use client'

import { motion } from 'framer-motion'
import { Play, ChevronRight, ChevronLeft, Loader2, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useNewReleases, useRecommended } from '@/hooks/use-catalog'
import { type WatchProgress } from '@/lib/api/stream'
import type { ContentCard } from '@/lib/api/catalog'



const KIDS_ALLOWED_RATINGS = new Set(['L', 'G', 'TV-Y', 'TV-G'])

function normalizeRating(rating?: string | null) {
  return (rating ?? '').trim().toUpperCase()
}

function isKidsAllowed(item: ContentCard) {
  return KIDS_ALLOWED_RATINGS.has(normalizeRating(item.rating))
}

function toNormalizedGenreValue(genre: unknown): string | null {
  if (typeof genre === 'string') return genre.toLowerCase()
  if (genre && typeof genre === 'object' && 'name' in (genre as Record<string, unknown>)) {
    const value = (genre as { name?: unknown }).name
    return typeof value === 'string' ? value.toLowerCase() : null
  }
  return null
}

function matchesAnyGenre(item: ContentCard, genres: string[]) {
  const normalized = (item.genres ?? [])
    .map((g) => toNormalizedGenreValue(g))
    .filter((g): g is string => Boolean(g))

  return genres.some((g) => normalized.includes(g.toLowerCase()))
}

/* =============================================
   CONTENT CARD (API)
   ============================================= */
function ApiContentCard({
  item,
  onClick,
  index = 0,
}: {
  item: ContentCard
  onClick: (item: ContentCard) => void
  index?: number
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => onClick(item)}
      className="group w-full rounded-xl border overflow-hidden text-left cursor-pointer transition-all duration-300 flex flex-col"
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
            className="w-full h-full flex items-center justify-center"
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
              className="text-[9px] font-semibold text-center px-2 z-10 relative leading-tight"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {item.title}
            </span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
            style={{ backgroundColor: 'var(--ryvo-orange)' }}
          >
            <Play size={14} fill="white" className="text-white ml-0.5" />
          </div>
        </div>
        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span
            className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: '#fff',
              fontFamily: 'var(--font-inter)',
            }}
          >
            {item.type === 'movie' ? 'Filme' : 'Série'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-2 flex-1">
        <p
          className="text-xs font-semibold truncate leading-tight transition-colors duration-300"
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
        >
          {item.title}
        </p>
        {item.genres && item.genres.length > 0 && (
          <p
            className="text-[10px] mt-0.5 truncate transition-colors duration-300"
            style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
          >
            {typeof item.genres[0] === 'string' ? item.genres[0] : (item.genres[0] as any).name}
          </p>
        )}
      </div>
    </motion.button>
  )
}

/* =============================================
   SECTION HEADER
   ============================================= */
function SectionHeader({
  title,
  subtitle,
  onScrollLeft,
  onScrollRight,
}: {
  title: string
  subtitle?: string
  onScrollLeft: () => void
  onScrollRight: () => void
}) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2
          className="text-xl md:text-2xl font-semibold transition-colors duration-300"
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-xs mt-0.5 transition-colors duration-300"
            style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={onScrollLeft}
          className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors duration-300"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--ryvo-charcoal)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
          }
          aria-label="Anterior"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={onScrollRight}
          className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors duration-300"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--ryvo-charcoal)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
          }
          aria-label="Próximo"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

/* =============================================
   SECTION LOADING SKELETON
   ============================================= */
function SectionSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex-none w-[140px] md:w-[160px] lg:w-[180px]">
          <div
            className="aspect-[2/3] rounded-xl animate-pulse"
            style={{ backgroundColor: 'var(--muted)' }}
          />
          <div
            className="mt-2 h-3 w-3/4 rounded animate-pulse"
            style={{ backgroundColor: 'var(--muted)' }}
          />
        </div>
      ))}
    </div>
  )
}

/* =============================================
   POSTER PLACEHOLDER (for continue watching)
   ============================================= */
function PosterPlaceholder({
  color,
  accentColor,
  title,
}: {
  color: string
  accentColor: string
  title: string
}) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: color }}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${accentColor} 0, ${accentColor} 1px, transparent 0, transparent 50%)`,
          backgroundSize: '12px 12px',
        }}
      />
      <div
        className="w-8 h-8 rounded-full opacity-60 relative z-10"
        style={{ backgroundColor: accentColor }}
      />
      <p
        className="text-center text-[9px] font-semibold px-2 mt-2 relative z-10 leading-tight"
        style={{ color: accentColor, maxWidth: '80%' }}
      >
        {title}
      </p>
    </div>
  )
}

/* =============================================
   CONTINUE WATCHING SECTION (mockup)
   ============================================= */
export function ContinueWatchingSection({
  items,
  isLoading,
  onItemClick,
}: {
  items: Array<{
    progress: WatchProgress
    card: ContentCard
    progressPercent: number
    timeLeftLabel: string
  }>
  isLoading: boolean
  onItemClick: (item: ContentCard) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' })
    }
  }

  return (
    <section
      className="py-10 border-b transition-colors duration-300"
      style={{ borderBottomColor: 'var(--muted)' }}
    >
      <div className="px-6 md:px-12 lg:px-16">
        <SectionHeader
          title="Continue assistindo"
          onScrollLeft={() => scroll('left')}
          onScrollRight={() => scroll('right')}
        />

        <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {isLoading && (
            <div className="w-full py-6 flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
              <Loader2 size={14} className="animate-spin" />
              <span className="text-sm" style={{ fontFamily: 'var(--font-inter)' }}>Carregando continue assistindo...</span>
            </div>
          )}
          {!isLoading && items.length === 0 && (
            <p className="text-sm py-6" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
              Ainda não há itens em progresso para este perfil.
            </p>
          )}
          {!isLoading && items.map((item, i) => (
            <motion.button
              key={item.progress.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => onItemClick(item.card)}
              className="group flex-none w-[260px] md:w-[300px] rounded-xl border overflow-hidden text-left cursor-pointer transition-all duration-300"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ryvo-orange)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')
              }
            >
              {/* Thumbnail */}
              <div className="relative h-[150px] md:h-[170px] overflow-hidden">
                {item.card.poster_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.card.poster_url}
                    alt={item.card.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <PosterPlaceholder
                    color="#272727"
                    accentColor="#ff4f00"
                    title={item.card.title}
                  />
                )}
                {/* Hover play */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-200 flex items-center justify-center">
                  <div
                    className="w-10 h-10 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                    style={{ backgroundColor: 'var(--ryvo-orange)' }}
                  >
                    <Play size={16} fill="white" className="text-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3
                    className="text-sm font-semibold leading-tight transition-colors duration-300"
                    style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
                  >
                    {item.card.title}
                  </h3>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded flex-none transition-colors duration-300"
                    style={{
                      backgroundColor: 'var(--muted)',
                      color: 'var(--ryvo-charcoal)',
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    {item.card.type === 'movie' ? 'Filme' : 'Série'}
                  </span>
                </div>

                <p
                  className="text-xs mb-2.5 transition-colors duration-300"
                  style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                >
                  {item.timeLeftLabel}
                </p>

                {/* Progress bar */}
                <div
                  className="h-1 rounded-full overflow-hidden transition-colors duration-300"
                  style={{ backgroundColor: 'var(--muted)' }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progressPercent}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.06, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: 'var(--ryvo-orange)' }}
                  />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}

/* =============================================
   NEW RELEASES SECTION (real API)
   ============================================= */
export function NewReleasesSection({
  contentType,
  onItemClick,
  isKidsProfile = false,
  onItemsLoaded,
}: {
  contentType: 'movie' | 'series'
  onItemClick: (item: ContentCard) => void
  isKidsProfile?: boolean
  onItemsLoaded?: (items: ContentCard[]) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { data, isLoading, error } = useNewReleases(contentType)

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -360 : 360, behavior: 'smooth' })
    }
  }

  const rawItems = data?.items ?? []
  const items = useMemo(() => (isKidsProfile ? rawItems.filter(isKidsAllowed) : rawItems), [isKidsProfile, rawItems])

  useEffect(() => {
    onItemsLoaded?.(items)
  }, [items, onItemsLoaded])

  return (
    <section
      className="py-10 border-b transition-colors duration-300"
      style={{ borderBottomColor: 'var(--muted)' }}
    >
      <div className="px-6 md:px-12 lg:px-16">
        <SectionHeader
          title="Novidades"
          subtitle={
            items.length > 0 ? `${items.length} ${contentType === 'movie' ? 'filmes' : 'séries'}` : undefined
          }
          onScrollLeft={() => scroll('left')}
          onScrollRight={() => scroll('right')}
        />

        {isLoading && <SectionSkeleton />}

        {error && !isLoading && (
          <p
            className="text-sm py-4"
            style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
          >
            {error}
          </p>
        )}

        {!isLoading && !error && items.length === 0 && (
          <p
            className="text-sm py-4"
            style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
          >
            Nenhuma novidade no momento.
          </p>
        )}

        {!isLoading && !error && items.length > 0 && (
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {items.map((item, i) => (
              <div key={item.id} className="flex-none w-[140px] md:w-[160px] lg:w-[180px]">
                <ApiContentCard item={item} onClick={onItemClick} index={i} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* =============================================
   RECOMMENDED SECTION (real API)
   ============================================= */
export function RecommendedSection({
  contentType,
  profileId,
  onItemClick,
  isKidsProfile = false,
}: {
  contentType: 'movie' | 'series'
  profileId: string | null
  onItemClick: (item: ContentCard) => void
  isKidsProfile?: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { data, isLoading, error } = useRecommended(profileId, contentType)

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' })
    }
  }

  const rawItems = data?.items ?? []
  const items = useMemo(() => (isKidsProfile ? rawItems.filter(isKidsAllowed) : rawItems), [isKidsProfile, rawItems])

  return (
    <section className="py-10">
      <div className="px-6 md:px-12 lg:px-16">
        <SectionHeader
          title="Recomendado para você"
          subtitle={
            data?.has_enough_data
              ? 'Baseado no seu histórico de visualização'
              : undefined
          }
          onScrollLeft={() => scroll('left')}
          onScrollRight={() => scroll('right')}
        />

        {isLoading && <SectionSkeleton />}

        {error && !isLoading && (
          <p
            className="text-sm py-4"
            style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
          >
            {error}
          </p>
        )}

        {!isLoading && !error && data && !data.has_enough_data && (
          <div
            className="flex flex-col items-center justify-center py-12 gap-3 rounded-xl border"
            style={{ borderColor: 'var(--border)', borderStyle: 'dashed' }}
          >
            <Sparkles size={28} style={{ color: 'var(--ryvo-orange)', opacity: 0.7 }} />
            <p
              className="text-sm text-center max-w-sm"
              style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
            >
              {data.message || 'Continue assistindo para receber recomendações personalizadas.'}
            </p>
          </div>
        )}

        {!isLoading && !error && items.length > 0 && (
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {items.map((item, i) => (
              <div key={item.id} className="flex-none w-[140px] md:w-[160px] lg:w-[180px]">
                <ApiContentCard item={item} onClick={onItemClick} index={i} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}


export function DynamicGenreSections({
  contentType,
  items,
  onItemClick,
}: {
  contentType: 'movie' | 'series'
  items: ContentCard[]
  onItemClick: (item: ContentCard) => void
}) {
  const sectionDefs = contentType === 'series'
    ? [
        { title: 'Maratona no streaming', genres: ['netflix', 'prime video', 'amazon'] },
        { title: 'Universo Anime', genres: ['animação', 'animacao', 'anime'] },
        { title: 'Para arrepiar', genres: ['terror', 'thriller', 'suspense'] },
      ]
    : [
        { title: 'Noite em família', genres: ['comédia', 'comedia', 'animação', 'animacao', 'família', 'familia'] },
        { title: 'Dose de adrenalina', genres: ['ação', 'acao', 'suspense', 'aventura'] },
        { title: 'Para ficar com medo', genres: ['terror', 'thriller'] },
      ]

  return (
    <>
      {sectionDefs.map((section) => {
        const sectionItems = items.filter((item) => matchesAnyGenre(item, section.genres)).slice(0, 12)
        if (sectionItems.length === 0) return null
        return (
          <section key={section.title} className="py-10 border-b transition-colors duration-300" style={{ borderBottomColor: 'var(--muted)' }}>
            <div className="px-6 md:px-12 lg:px-16">
              <div className="mb-5">
                <h2 className="text-xl md:text-2xl font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>{section.title}</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {sectionItems.map((item, i) => (
                  <div key={`${section.title}-${item.id}`} className="flex-none w-[140px] md:w-[160px] lg:w-[180px]">
                    <ApiContentCard item={item} onClick={onItemClick} index={i} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      })}
    </>
  )
}
