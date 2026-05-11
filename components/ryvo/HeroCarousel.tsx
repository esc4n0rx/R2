'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react'
import { useHero } from '@/hooks/use-catalog'
import type { ContentCard } from '@/lib/api/catalog'

interface HeroCarouselProps {
  contentType: 'movie' | 'series'
  onDetailClick: (item: ContentCard) => void
}

function HeroBannerImage({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      loading="eager"
    />
  )
}

function HeroBanner({
  item,
  direction,
  onDetailClick,
}: {
  item: ContentCard
  direction: number
  onDetailClick: (item: ContentCard) => void
}) {
  return (
    <motion.div
      key={item.id}
      custom={direction}
      initial={{ opacity: 0, x: direction * 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: direction * -40 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="absolute inset-0 flex"
    >
      {/* Left — text content */}
      <div className="relative z-10 flex flex-col justify-center pl-6 md:pl-12 lg:pl-16 pr-6 md:pr-0 w-full md:w-[55%] lg:w-[52%] py-12">
        {/* Category label */}
        <div className="mb-4">
          <span
            className="text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded border transition-colors duration-300"
            style={{
              color: 'var(--muted-foreground)',
              borderColor: 'var(--border)',
              fontFamily: 'var(--font-inter)',
              backgroundColor: 'var(--background)',
            }}
          >
            {item.type === 'movie' ? 'Filme' : 'Série'}
          </span>
        </div>

        {/* Title */}
        <h2
          className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[0.9] mb-4 text-balance transition-colors duration-300"
          style={{
            color: 'var(--foreground)',
            fontFamily: 'var(--font-syne)',
            letterSpacing: '-1.5px',
          }}
        >
          {item.title}
        </h2>

        {/* Overview */}
        <p
          className="text-sm md:text-base leading-relaxed mb-5 max-w-md text-pretty transition-colors duration-300 line-clamp-3"
          style={{ color: 'var(--ryvo-charcoal)', fontFamily: 'var(--font-inter)' }}
        >
          {item.overview}
        </p>

        {/* Genres */}
        {item.genres && item.genres.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap mb-6">
            {item.genres.slice(0, 3).map((genre, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span style={{ color: 'var(--border)' }}>•</span>}
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                >
                  {typeof genre === 'string' ? genre : (genre as any).name}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="flex gap-3 flex-wrap">
          <button
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--ryvo-orange)',
              color: '#fffefb',
              fontFamily: 'var(--font-inter)',
            }}
          >
            <Play size={15} fill="white" />
            Assistir agora
          </button>
          <button
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border transition-colors duration-300"
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
              fontFamily: 'var(--font-inter)',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card)')
            }
            onClick={() => onDetailClick(item)}
          >
            <Info size={15} />
            Ver detalhes
          </button>
        </div>
      </div>

      {/* Right — visual panel */}
      <div
        className="hidden md:block absolute right-0 top-0 bottom-0 w-[48%] lg:w-[50%] rounded-l-3xl overflow-hidden border-l border-y transition-colors duration-300"
        style={{ borderColor: 'var(--border)' }}
      >
        {item.backdrop_url ? (
          <div className="w-full h-full relative">
            <HeroBannerImage src={item.backdrop_url} alt={item.title} />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to right, var(--background) 0%, transparent 30%)`,
              }}
            />
          </div>
        ) : item.poster_url ? (
          <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
            <HeroBannerImage src={item.poster_url} alt={item.title} />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to right, var(--background) 0%, transparent 40%)`,
              }}
            />
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: 'var(--muted)' }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, var(--ryvo-orange) 0, var(--ryvo-orange) 1px, transparent 0, transparent 50%)`,
                backgroundSize: '18px 18px',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to right, var(--background) 0%, transparent 30%)`,
              }}
            />
            <div className="relative z-10 flex flex-col items-center gap-5 px-10">
              <div
                className="w-28 h-28 md:w-36 md:h-36 rounded-full opacity-40"
                style={{ backgroundColor: 'var(--ryvo-orange)' }}
              />
              <p
                className="text-center text-base md:text-xl font-bold opacity-60"
                style={{ color: 'var(--foreground)' }}
              >
                {item.title}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function HeroSkeleton() {
  return (
    <div className="absolute inset-0 flex">
      <div className="flex flex-col justify-center pl-6 md:pl-12 lg:pl-16 pr-6 w-full md:w-[55%] py-12 gap-4">
        <div
          className="w-20 h-6 rounded animate-pulse"
          style={{ backgroundColor: 'var(--muted)' }}
        />
        <div
          className="w-3/4 h-16 rounded-xl animate-pulse"
          style={{ backgroundColor: 'var(--muted)' }}
        />
        <div
          className="w-full h-12 rounded animate-pulse"
          style={{ backgroundColor: 'var(--muted)' }}
        />
        <div className="flex gap-3 mt-2">
          <div
            className="w-36 h-11 rounded-lg animate-pulse"
            style={{ backgroundColor: 'var(--muted)' }}
          />
          <div
            className="w-36 h-11 rounded-lg animate-pulse"
            style={{ backgroundColor: 'var(--muted)' }}
          />
        </div>
      </div>
    </div>
  )
}

export default function HeroCarousel({ contentType, onDetailClick }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused] = useState(false)
  const { data, isLoading } = useHero(contentType)

  const items = data?.items ?? []

  // Reset to first slide when type changes
  useEffect(() => {
    setCurrent(0)
  }, [contentType])

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1)
      setCurrent(index)
    },
    [current],
  )

  const next = useCallback(() => {
    setDirection(1)
    setCurrent((prev) => (prev + 1) % Math.max(items.length, 1))
  }, [items.length])

  useEffect(() => {
    if (paused || items.length <= 1) return
    const interval = setInterval(next, 5000)
    return () => clearInterval(interval)
  }, [paused, next, items.length])

  return (
    <section
      className="relative border-b transition-colors duration-300"
      style={{ borderBottomColor: 'var(--border)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Hero area */}
      <div className="relative h-[460px] md:h-[540px] lg:h-[580px] overflow-hidden">
        {isLoading && <HeroSkeleton />}
        {!isLoading && items.length > 0 && (
          <AnimatePresence custom={direction} mode="wait">
            <HeroBanner
              key={items[current]?.id ?? current}
              item={items[current]}
              direction={direction}
              onDetailClick={onDetailClick}
            />
          </AnimatePresence>
        )}
        {!isLoading && items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
              Nenhum conteúdo encontrado
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      {items.length > 0 && (
        <div className="px-6 md:px-12 lg:px-16 pb-5 flex items-center justify-between">
          {/* Dots */}
          <div className="flex items-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="transition-all duration-200 rounded-full"
                style={{
                  width: current === i ? '24px' : '8px',
                  height: '8px',
                  backgroundColor: current === i ? 'var(--ryvo-orange)' : 'var(--border)',
                }}
                aria-label={`Ir para slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setDirection(-1)
                setCurrent((prev) => (prev - 1 + items.length) % items.length)
              }}
              className="w-9 h-9 rounded-lg border flex items-center justify-center transition-colors duration-300"
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
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={next}
              className="w-9 h-9 rounded-lg border flex items-center justify-center transition-colors duration-300"
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
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
