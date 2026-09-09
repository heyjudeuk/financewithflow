/**
 * Archived Hero Sections
 * 
 * This file preserves the exact raw HTML markup, Elementor container IDs, and metadata
 * for the hero sections removed from the About, Meet The Team, Services, Packages, and Insights pages.
 * 
 * If any hero banner needs to be restored in the future:
 * 1. Locate the page in `src/pages/`
 * 2. Copy the `html` string for the relevant page from this file
 * 3. Paste it directly as the first child container inside `<div data-elementor-type="wp-page"...>`
 */

export interface ArchivedHeroSection {
  pageName: string;
  pageRoute: string;
  targetFile: string;
  containerId: string;
  title: string;
  subtitle: string;
  logoSrc: string;
  restorationTargetSelector: string;
  html: string;
}

export const archivedHeroSections: Record<'about' | 'meetTheTeam' | 'services' | 'packages' | 'insights', ArchivedHeroSection> = {
  about: {
    pageName: 'About',
    pageRoute: '/about/',
    targetFile: 'src/pages/about.astro',
    containerId: '2c3e4a49',
    title: 'Where it all began',
    subtitle: 'Welcome to',
    logoSrc: '/wp-content/uploads/2025/06/fwf-white-construction-logo.webp',
    restorationTargetSelector: 'Insert before container [data-id="309b5cfa"] ("Who We Are")',
    html: `<div class="elementor-element elementor-element-2c3e4a49 e-flex e-con-boxed e-con e-parent" data-id="2c3e4a49" data-element_type="container" data-settings="{&quot;background_background&quot;:&quot;classic&quot;}"><div class="e-con-inner"><div class="elementor-element elementor-element-6e991425 e-flex e-con-boxed e-con e-child" data-id="6e991425" data-element_type="container"><div class="e-con-inner"><div class="elementor-element elementor-element-11b15f34 elementor-widget elementor-widget-heading" data-id="11b15f34" data-element_type="widget" data-widget_type="heading.default"><div class="elementor-widget-container"><h2 class="elementor-heading-title elementor-size-default">Welcome to</h2></div></div><div class="elementor-element elementor-element-1f308d00 elementor-widget elementor-widget-image" data-id="1f308d00" data-element_type="widget" data-widget_type="image.default"><div class="elementor-widget-container"> <img class="attachment-large size-large wp-image-1662 " src="/wp-content/uploads/2025/06/fwf-white-construction-logo.webp" decoding="async" width="714" height="172"   alt="" srcset="/wp-content/uploads/2025/06/fwf-white-construction-logo.webp 714w, /wp-content/uploads/2025/06/fwf-white-construction-logo-300x72.webp 300w" sizes="(max-width: 714px) 100vw, 714px" /></div></div><div class="elementor-element elementor-element-31a78f2e elementor-widget elementor-widget-heading" data-id="31a78f2e" data-element_type="widget" data-widget_type="heading.default"><div class="elementor-widget-container"><h1 class="elementor-heading-title elementor-size-default">Where it all began</h1></div></div></div></div></div></div>`,
  },

  meetTheTeam: {
    pageName: 'Meet The Team',
    pageRoute: '/meet-the-team/',
    targetFile: 'src/pages/meet-the-team.astro',
    containerId: '4ebd60ac',
    title: 'Meet the team',
    subtitle: 'Welcome to',
    logoSrc: '/wp-content/uploads/2025/06/fwf-white-construction-logo.webp',
    restorationTargetSelector: 'Insert before container [data-id="645e00c"] ("Our team members")',
    html: `<div class="elementor-element elementor-element-4ebd60ac e-flex e-con-boxed e-con e-parent" data-id="4ebd60ac" data-element_type="container" data-settings="{&quot;background_background&quot;:&quot;classic&quot;}"><div class="e-con-inner"><div class="elementor-element elementor-element-18828856 e-flex e-con-boxed e-con e-child" data-id="18828856" data-element_type="container"><div class="e-con-inner"><div class="elementor-element elementor-element-927f9c1 elementor-widget elementor-widget-heading" data-id="927f9c1" data-element_type="widget" data-widget_type="heading.default"><div class="elementor-widget-container"><p class="elementor-heading-title elementor-size-default">Welcome to</p></div></div><div class="elementor-element elementor-element-360a1a2f elementor-widget elementor-widget-image" data-id="360a1a2f" data-element_type="widget" data-widget_type="image.default"><div class="elementor-widget-container"> <img class="attachment-large size-large wp-image-1662 " src="/wp-content/uploads/2025/06/fwf-white-construction-logo.webp" decoding="async" width="714" height="172"   alt="" srcset="/wp-content/uploads/2025/06/fwf-white-construction-logo.webp 714w, /wp-content/uploads/2025/06/fwf-white-construction-logo-300x72.webp 300w" sizes="(max-width: 714px) 100vw, 714px" /></div></div><div class="elementor-element elementor-element-3d755512 elementor-widget elementor-widget-heading" data-id="3d755512" data-element_type="widget" data-widget_type="heading.default"><div class="elementor-widget-container"><h1 class="elementor-heading-title elementor-size-default">Meet the team</h1></div></div></div></div></div></div>`,
  },

  services: {
    pageName: 'Services',
    pageRoute: '/services/',
    targetFile: 'src/pages/services.astro',
    containerId: '1c6f0185',
    title: 'Your partner in financial success',
    subtitle: 'Welcome to',
    logoSrc: '/wp-content/uploads/2025/06/fwf-white-construction-logo.webp',
    restorationTargetSelector: 'Insert before container [data-id="c77407e"] ("Expertise at your fingertips")',
    html: `<div class="elementor-element elementor-element-1c6f0185 e-flex e-con-boxed e-con e-parent" data-id="1c6f0185" data-element_type="container" data-settings="{&quot;background_background&quot;:&quot;classic&quot;}"><div class="e-con-inner"><div class="elementor-element elementor-element-c4deda5 e-flex e-con-boxed e-con e-child" data-id="c4deda5" data-element_type="container"><div class="e-con-inner"><div class="elementor-element elementor-element-2bac3d8c elementor-widget elementor-widget-heading" data-id="2bac3d8c" data-element_type="widget" data-widget_type="heading.default"><div class="elementor-widget-container"><h2 class="elementor-heading-title elementor-size-default">Welcome to</h2></div></div><div class="elementor-element elementor-element-63da5bd8 elementor-widget elementor-widget-image" data-id="63da5bd8" data-element_type="widget" data-widget_type="image.default"><div class="elementor-widget-container"> <img class="attachment-large size-large wp-image-1662 " src="/wp-content/uploads/2025/06/fwf-white-construction-logo.webp" decoding="async" width="714" height="172"   alt="" srcset="/wp-content/uploads/2025/06/fwf-white-construction-logo.webp 714w, /wp-content/uploads/2025/06/fwf-white-construction-logo-300x72.webp 300w" sizes="(max-width: 714px) 100vw, 714px" /></div></div><div class="elementor-element elementor-element-19f7c33e elementor-widget elementor-widget-heading" data-id="19f7c33e" data-element_type="widget" data-widget_type="heading.default"><div class="elementor-widget-container"><h1 class="elementor-heading-title elementor-size-default">Your partner in financial success</h1></div></div></div></div></div></div>`,
  },

  packages: {
    pageName: 'Packages',
    pageRoute: '/packages/',
    targetFile: 'src/pages/packages.astro',
    containerId: '3db37a96',
    title: 'Outsourced Finance Department Packages',
    subtitle: 'Welcome to',
    logoSrc: '/wp-content/uploads/2025/06/fwf-white-construction-logo.webp',
    restorationTargetSelector: 'Insert before container [data-id="60442b9a"] ("What we do / Find the right package for you")',
    html: `<div class="elementor-element elementor-element-3db37a96 e-flex e-con-boxed e-con e-parent" data-id="3db37a96" data-element_type="container" data-settings="{&quot;background_background&quot;:&quot;classic&quot;}"><div class="e-con-inner"><div class="elementor-element elementor-element-7d63446c e-flex e-con-boxed e-con e-child" data-id="7d63446c" data-element_type="container"><div class="e-con-inner"><div class="elementor-element elementor-element-57f7c3a6 elementor-widget elementor-widget-heading" data-id="57f7c3a6" data-element_type="widget" data-widget_type="heading.default"><div class="elementor-widget-container"><h2 class="elementor-heading-title elementor-size-default">Welcome to</h2></div></div><div class="elementor-element elementor-element-33e0be9 elementor-widget elementor-widget-image" data-id="33e0be9" data-element_type="widget" data-widget_type="image.default"><div class="elementor-widget-container"> <img class="attachment-large size-large wp-image-1662 " src="/wp-content/uploads/2025/06/fwf-white-construction-logo.webp" decoding="async" width="714" height="172"   alt="" srcset="/wp-content/uploads/2025/06/fwf-white-construction-logo.webp 714w, /wp-content/uploads/2025/06/fwf-white-construction-logo-300x72.webp 300w" sizes="(max-width: 714px) 100vw, 714px" /></div></div><div class="elementor-element elementor-element-58e4cbf9 elementor-widget elementor-widget-heading" data-id="58e4cbf9" data-element_type="widget" data-widget_type="heading.default"><div class="elementor-widget-container"><h1 class="elementor-heading-title elementor-size-default">Outsourced Finance Department Packages</h1></div></div></div></div></div></div>`,
  },

  insights: {
    pageName: 'Insights',
    pageRoute: '/blog/',
    targetFile: 'src/pages/blog/index.astro',
    containerId: '6f97368',
    title: 'Explore our news & insights',
    subtitle: 'Blog',
    logoSrc: '/wp-content/uploads/2023/12/logo-white-1024x279-2.webp',
    restorationTargetSelector: 'Insert before container [data-id="340bbb7"] ("Featured News & Insights")',
    html: `<div class="elementor-element elementor-element-6f97368 e-flex e-con-boxed e-con e-parent" data-id="6f97368" data-element_type="container" data-settings="{&quot;background_background&quot;:&quot;classic&quot;}"><div class="e-con-inner"><div class="elementor-element elementor-element-74e8657 e-flex e-con-boxed e-con e-child" data-id="74e8657" data-element_type="container"><div class="e-con-inner"><div class="elementor-element elementor-element-469b88b elementor-widget elementor-widget-heading" data-id="469b88b" data-element_type="widget" data-widget_type="heading.default"><div class="elementor-widget-container"><h2 class="elementor-heading-title elementor-size-default">Blog</h2></div></div><div class="elementor-element elementor-element-38f1d61 elementor-widget elementor-widget-image" data-id="38f1d61" data-element_type="widget" data-widget_type="image.default"><div class="elementor-widget-container"> <img class="attachment-large size-large wp-image-1656 " src="/wp-content/uploads/2023/12/logo-white-1024x279-2.webp" decoding="async" width="800" height="216"   alt="Finance with Flow" srcset="/wp-content/uploads/2023/12/logo-white-1024x279-2.webp 1024w, /wp-content/uploads/2023/12/logo-white-1024x279-2-300x81.webp 300w, /wp-content/uploads/2023/12/logo-white-1024x279-2-768x207.webp 768w" sizes="(max-width: 800px) 100vw, 800px" /></div></div><div class="elementor-element elementor-element-657f4a3 elementor-widget elementor-widget-heading" data-id="657f4a3" data-element_type="widget" data-widget_type="heading.default"><div class="elementor-widget-container"><h1 class="elementor-heading-title elementor-size-default">Explore our news &amp; insights</h1></div></div><div class="elementor-element elementor-element-af84f07 elementor-widget elementor-widget-button" data-id="af84f07" data-element_type="widget" data-widget_type="button.default"><div class="elementor-widget-container"><div class="elementor-button-wrapper"> <a class="elementor-button elementor-button-link elementor-size-sm" href="/finance-with-flow-newsletter-sign-up/"> <span class="elementor-button-content-wrapper"> <span class="elementor-button-text">Join our newsletter here</span> </span> </a></div></div></div></div></div></div></div>`,
  },
};
