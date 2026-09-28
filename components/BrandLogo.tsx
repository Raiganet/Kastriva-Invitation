import Link from 'next/link';
import { BRAND_ASSETS, brandHomeLabel, usesKastrivaWordmark } from '@/lib/brand-identity';

type BrandLogoProps = {
  brandName: string;
  tagline: string;
  placement?: 'header' | 'footer';
};

/** One home link, one accessible name. The pictures are decorative inside that link. */
export default function BrandLogo({ brandName, tagline, placement = 'header' }: BrandLogoProps) {
  const wordmark = usesKastrivaWordmark(brandName, tagline);
  return (
    <Link
      href="/"
      className={`brand ki-brand ki-brand--${placement}${wordmark ? '' : ' ki-brand--custom'}`}
      aria-label={brandHomeLabel(brandName, tagline)}
      title={brandHomeLabel(brandName, tagline)}
    >
      {wordmark ? (
        <img
          className="ki-brand__horizontal"
          src={BRAND_ASSETS.horizontal}
          width={930}
          height={220}
          alt=""
          decoding="async"
          loading={placement === 'header' ? 'eager' : 'lazy'}
        />
      ) : (
        <>
          <img className="ki-brand__emblem" src={BRAND_ASSETS.emblem}
            width={485} height={383} alt="" decoding="async"
            loading={placement === 'header' ? 'eager' : 'lazy'} />
          <span className="ki-brand__copy">
            <strong className="brand-name" title={brandName}>{brandName}</strong>
            <small title={tagline}>{tagline}</small>
          </span>
        </>
      )}
    </Link>
  );
}
