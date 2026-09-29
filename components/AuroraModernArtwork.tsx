'use client';

/**
 * Aurora Modern Artwork
 * Komponen visual untuk tema aurora-modern dengan animasi partikel dan orbs.
 * Digunakan di catalog card, editor preview, dan renderer publik.
 */
export default function AuroraModernArtwork({
  slug,
  portrait = false,
  photo,
  names,
}: {
  slug: string;
  portrait?: boolean;
  photo?: string;
  names?: string;
}) {
  if (slug !== 'aurora-modern') return null;

  // Untuk catalog card / ThemeCard
  if (!portrait) {
    return (
      <div className="aurora-art-preview" aria-hidden="true">
        <div className="aurora-art-orb aurora-art-orb-1" />
        <div className="aurora-art-orb aurora-art-orb-2" />
        <div className="aurora-art-orb aurora-art-orb-3" />
        <span className="aurora-art-icon">✦</span>
      </div>
    );
  }

  // Untuk cover undangan (portrait mode)
  return (
    <div className="aurora-scene" aria-hidden="true">
      {/* Animated gradient orbs */}
      <div className="aurora-orbs">
        <div className="aurora-orb orb-1" />
        <div className="aurora-orb orb-2" />
        <div className="aurora-orb orb-3" />
        <div className="aurora-orb orb-4" />
      </div>

      {/* Floating particles */}
      <div className="aurora-particles">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="aurora-particle"
            style={{
              left: `${(i * 5.5 + 2) % 96}%`,
              animationDelay: `${(i * 0.7) % 8}s`,
              animationDuration: `${10 + (i % 5) * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Glass frame for photo/initials */}
      <div className="aurora-glass-frame">
        {photo ? (
          <img
            src={photo}
            alt={names || 'Pengantin'}
            className="aurora-portrait-photo"
            width={320}
            height={320}
          />
        ) : (
          <div className="aurora-initials">
            {names
              ? names
                  .split('&')
                  .map((n) => n.trim().charAt(0))
                  .join('')
              : '♥'}
          </div>
        )}
      </div>
    </div>
  );
}
