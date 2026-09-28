import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { BRAND_ASSETS, brandHomeLabel, usesKastrivaWordmark } from '../lib/brand-identity.ts';
const root = new URL('../', import.meta.url);
const read = (name: string) => readFileSync(new URL(name, root), 'utf8');

test('approved brand uses the chosen artwork, not recreated letters', () => {
  for (const name of ['Kastriva', 'KASTRIVA', ' Kastriva Invitation ', 'Kastriva-Invitation']) {
    assert.equal(usesKastrivaWordmark(name, ' INVITATION '), true);
  }
});
test('custom CMS names or subtitles still render their actual text', () => {
  assert.equal(usesKastrivaWordmark('Nama baru', 'INVITATION'), false);
  assert.equal(usesKastrivaWordmark('Kastriva', 'Undangan & acara'), false);
});
test('logo link has a single accessible home label without a duplicate subtitle', () => {
  assert.equal(brandHomeLabel('Kastriva', 'INVITATION'), 'Kastriva INVITATION — Beranda');
  assert.equal(brandHomeLabel('Kastriva Invitation', 'INVITATION'), 'Kastriva Invitation — Beranda');
  assert.equal(brandHomeLabel('Nama baru', 'Undangan'), 'Nama baru Undangan — Beranda');
});
test('all branded asset paths are local, versioned and present', () => {
  for (const path of Object.values(BRAND_ASSETS)) {
    assert.ok(path.startsWith('/brand/crest-v1/'));
    assert.ok(!path.includes('..') && !path.includes('?') && !path.includes('://'));
    assert.ok(existsSync(new URL('public' + path, root)), path);
  }
});
test('brand component leaves authorization and contacts to the existing application', () => {
  const s = read('components/BrandLogo.tsx');
  assert.ok(s.includes('brandHomeLabel(brandName, tagline)'));
  assert.ok(s.includes('usesKastrivaWordmark(brandName, tagline)'));
  assert.ok(s.includes('width={930}') && s.includes('height={220}'));
  assert.ok(s.includes('alt=""'));
  assert.ok(!s.includes('dangerouslySetInnerHTML') && !s.includes('process.env') && !s.includes('supabase'));
});
test('header and footer share the same logo and keep their existing visibility guards', () => {
  for (const name of ['components/SiteHeader.tsx', 'components/SiteFooter.tsx']) {
    const s = read(name);
    assert.ok(s.includes('<BrandLogo brandName={content.brandName} tagline={content.tagline}'));
    assert.ok(s.includes("path.startsWith('/u/')") && s.includes("path.startsWith('/demo/')"));
    assert.ok(s.includes("path.endsWith('/preview')"));
    assert.ok(!s.includes('className="brand-mark"'));
  }
  const header = read('components/SiteHeader.tsx');
  assert.ok(header.includes('useAccountNavigation(!hidden)'));
  assert.ok(header.includes('aria-expanded={open}') && header.includes('aria-controls="mobile-menu"'));
  assert.ok(read('components/SiteFooter.tsx').includes('content.contactEmail'));
});
test('root metadata uses the new icons without changing robots or requesting Supabase keys', () => {
  const s = read('app/layout.tsx');
  assert.ok(s.includes("import './brand-identity.css'"));
  assert.ok(s.includes("manifest:'/manifest.webmanifest'"));
  assert.ok(s.includes('BRAND_ASSETS.favicon32') && s.includes('BRAND_ASSETS.apple'));
  assert.ok(s.includes('robots:{index:false,follow:false}'));
  assert.ok(!s.includes("icon:'/icon.svg'"));
});
test('manifest has a real title and separate any/maskable icons without a worker claim', () => {
  const m = JSON.parse(read('app/manifest.webmanifest'));
  assert.equal(m.name, 'Kastriva Invitation');
  assert.equal(m.short_name, 'Kastriva');
  assert.equal(m.start_url, '/');
  assert.equal(m.scope, '/');
  assert.equal(m.display, 'standalone');
  assert.equal(m.icons.length, 3);
  assert.equal(m.icons[2].purpose, 'maskable');
  for (const icon of m.icons) assert.ok(existsSync(new URL('public' + icon.src, root)));
  assert.equal('serviceworker' in m, false);
});
test('favicon is a valid ICO container with multiple sizes', () => {
  const b = readFileSync(new URL('app/favicon.ico', root));
  assert.equal(b.readUInt16LE(0), 0);
  assert.equal(b.readUInt16LE(2), 1);
  assert.equal(b.readUInt16LE(4), 4);
});
test('PNG icons have the specified native pixel dimensions', () => {
  const expected: Array<[string, number]> = [
    [BRAND_ASSETS.favicon16,16], [BRAND_ASSETS.favicon32,32], [BRAND_ASSETS.apple,180],
    ['/brand/crest-v1/icon-192.png',192], ['/brand/crest-v1/icon-512.png',512],
    ['/brand/crest-v1/icon-maskable-512.png',512],
  ];
  for (const [path, size] of expected) {
    const b = readFileSync(new URL('public' + path, root));
    assert.equal(b.subarray(0,8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(b.readUInt32BE(16),size);
    assert.equal(b.readUInt32BE(20),size);
  }
});
test('CSS is scoped to branding and reserves intrinsic proportions', () => {
  const s = read('app/brand-identity.css');
  assert.ok(s.includes('aspect-ratio: 930 / 220'));
  assert.ok(s.includes('@media (max-width: 360px)'));
  assert.ok(!s.includes('.invitation ') && !s.includes('overflow-x: hidden'));
});
test('public indexing remains conditional, assets only are added to the allow-list', () => {
  const s = read('app/robots.ts');
  assert.ok(s.includes("!s.content.allowIndex"));
  assert.ok(s.includes("disallow:'/'"));
  assert.ok(s.includes("'/brand/crest-v1/'"));
  assert.ok(!s.includes("'/u/'"));
});
