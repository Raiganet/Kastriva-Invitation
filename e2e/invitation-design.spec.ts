import {test, expect} from '@playwright/test';
import {ALL_THEME_SLUGS} from '../lib/theme-registry';

for (const slug of ALL_THEME_SLUGS) {
  test(`invitation layout and navigation: ${slug}`, async ({page, isMobile}) => {
    // The narrowest supported phone catches overflow that a typical phone misses.
    if (isMobile) await page.setViewportSize({width: 320, height: 740});
    await page.emulateMedia({reducedMotion: 'reduce'});
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if(message.type() === 'error') errors.push(message.text());
    });
    await page.goto(`/demo/${slug}?to=Keluarga%20Bapak%20Muhammad%20Abdurrahman`);
    const root = page.locator('.invitation');
    // Every catalog theme has its own complementary decorative inks.
    const palette=await root.evaluate(element=>{
      const style=getComputedStyle(element);
      return ['--edition-petal','--edition-leaf','--edition-foil'].map(name=>style.getPropertyValue(name).trim());
    });
    expect(palette.every(Boolean)).toBe(true);
    expect(new Set(palette).size).toBe(3);
    const fits = () => root.evaluate(element => element.scrollWidth <= element.clientWidth + 1);
    await expect(page.getByRole('heading', {level: 1})).toBeVisible();
    await expect.poll(()=>page.locator('.inv-cover img').first().evaluate((element)=>(element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    expect(await fits()).toBe(true);
    await page.getByRole('button', {name: /Buka undangan/}).click();
    await expect(page.locator('.inv-content')).toBeFocused();
    await expect(page.locator('.inv-music .music-toggle')).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('[data-demo-wish]')).toHaveCount(3);
    await expect(page.locator('.inv-gallery')).toHaveCount(1);
    await expect(page.locator('.photo-placeholders')).toHaveCount(0);
    for(const photo of await page.locator('.inv-story-image').all())await expect(photo).toHaveCSS('object-fit','contain');
    const nav = page.getByRole('navigation', {name: 'Bagian undangan'});
    await nav.getByRole('button', {name: 'Acara', exact: true}).click();
    const heading = page.getByRole('heading', {name: 'Waktu & tempat', exact: true});
    await expect(heading).toBeInViewport();
    await expect(nav.getByRole('button', {name: 'Acara', exact: true})).toHaveAttribute('aria-current', 'location');
    expect(await fits()).toBe(true);
    const download = page.waitForEvent('download');
    await page.getByRole('button', {name: 'Simpan tanggal', exact: true}).first().click();
    expect((await download).suggestedFilename()).toBe('undangan-kastriva.ics');
    await nav.getByRole('button', {name: 'Galeri', exact: true}).click();
    await expect(page.getByRole('heading', {name: 'Galeri kenangan', exact: true})).toBeInViewport();
    expect(errors).toEqual([]);
  });
}

test('scroll reveal reaches tall sections and responds to reduced motion changes', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.goto('/demo/elegant-rose');
  await page.getByRole('button', {name: /Buka undangan/}).click();
  await expect(page.locator('.inv-content')).toBeFocused();
  const sections = page.locator('.inv-section');
  for (const section of await sections.all()) {
    await section.evaluate(element => element.scrollIntoView({block: 'start', behavior: 'instant'}));
    await expect(section).toHaveCSS('opacity', '1');
    await expect(section).not.toHaveClass(/inv-reveal-pending/);
  }
  await page.reload();
  await page.getByRole('button', {name: /Buka undangan/}).click();
  await expect(page.locator('.inv-reveal-pending').first()).toBeAttached();
  await page.emulateMedia({reducedMotion: 'reduce'});
  await expect(page.locator('.inv-reveal-pending')).toHaveCount(0);
  expect(await page.locator('.inv-ornament-corner').first().evaluate(element => getComputedStyle(element).animationName)).toBe('none');
});
