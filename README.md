# Finance with Flow - Modern Astro Migration & Keystatic CMS

A high-performance, responsive, and SEO-optimised modern website for **Finance with Flow** ([financewithflow.com](https://financewithflow.com)), rebuilt with **Astro**, **Keystatic CMS**, **Tailwind CSS v4**, and **Markdoc**.

---

## Features & Highlights

- **⚡ Blazing Fast Astro Architecture**: Fully prerendered static pages with sub-second page loads and zero hydration overhead.
- **📝 Non-Technical Friendly Keystatic CMS**: Integrated visual Markdown/Markdoc editor accessible at `/keystatic` with direct GitHub OAuth integration.
- **📚 32 Migrated Blog Posts**: Complete migration of all existing blog articles, authors, publication dates, and locally hosted featured images.
- **🏢 Complete Page Scope**:
  - **Core Pages**: Home (`/`), About (`/about`), Meet The Team (`/meet-the-team`), Services (`/services`), Packages (`/packages`), FAQs (`/faqs`), Contact (`/contact`), Insights/Blog (`/blog`).
  - **7 Location Landing Pages**: Suffolk, Essex, Colchester, Chelmsford, Bury St Edmunds, Harwich, Freeport East.
  - **Policy & Legal**: Privacy Policy, Terms & Conditions, Cookie Policy, Newsletter Sign-up.
- **🎨 Exact Brand Design Tokens**:
  - Primary Blue: `#3456A7`
  - Deep Midnight Navy: `#160F3F`
  - Vibrant Accent: `#31CDB0`
  - Cream Background: `#FEF9F3`
  - Fonts: `Quicksand` (Headings) and `Poppins` (Body).
  - High-resolution logos, partner badges (ICAEW, Xero Bronze Partner, IFT Associate), and team headshots.

---

## Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:4321](http://localhost:4321) in your browser.

---

## Using Keystatic CMS (For Non-Technical Editors)

Keystatic provides an intuitive, rich-text admin dashboard where non-technical staff can write, format, upload images, and publish blog articles without touching any code.

### Accessing the CMS Admin
- In development: Navigate to [http://localhost:4321/keystatic](http://localhost:4321/keystatic).
- In production: Navigate to `https://your-domain.com/keystatic`.

### How to Create & Edit Blog Posts
1. Go to `/keystatic`.
2. Click on **Blog Posts**.
3. To edit an existing post, click on any of the 32 migrated articles.
4. To create a new post, click **+ Add**:
   - **Title**: Enter the title (a URL-friendly slug is generated automatically).
   - **Published Date**: Pick the publication date from the calendar.
   - **Author**: Enter the author's name (defaults to *Finance with Flow*).
   - **Featured Image**: Drag and drop or upload a cover image. Keystatic automatically stores it in `public/images/posts/`.
   - **Excerpt**: Enter a 1-2 sentence summary for social cards and search results.
   - **Content**: Write and format your post using the rich visual Markdoc editor (headings, bold, lists, quotes, inline images, links).
5. Click **Save / Publish**:
   - In local mode: Changes are saved directly to your local files.
   - In production mode: Keystatic commits and pushes the changes directly to your GitHub repository via GitHub OAuth, triggering an automatic rebuild and deployment!

---

## Production GitHub OAuth Setup

In `keystatic.config.ts`, Keystatic is configured to connect to GitHub repository `heyjudeuk/financewithflow` in production:

```ts
export default config({
  storage: process.env.NODE_ENV === 'production'
    ? {
        kind: 'github',
        repo: 'heyjudeuk/financewithflow',
      }
    : {
        kind: 'local',
      },
  // ... collections
});
```

### Option A: 1-Click Keystatic Cloud (Easiest - Recommended)
Keystatic offers a free hosted cloud layer that handles GitHub OAuth authentication and image CDN automatically:
1. Sign in at [keystatic.cloud](https://keystatic.cloud) with your GitHub account (`heyjudeuk`).
2. Connect the `financewithflow` repository.
3. In `keystatic.config.ts`, set `storage: { kind: 'cloud' }` and `cloud: { project: '<team>/<project>' }`. No environment variable is required -- Keystatic Cloud handles authentication. Add your deployed URLs under the project's "Project URLs" so logins from those origins are allowed.

### Option B: Self-Hosted GitHub App
1. When you deploy your site, visit `https://your-domain.com/keystatic`.
2. Keystatic will prompt you with a 1-click button to create and register a new GitHub App on your GitHub account.
3. Grant permissions to the `financewithflow` repository.
4. Set the following environment variables in your hosting provider:
   - `KEYSTATIC_GITHUB_CLIENT_ID`
   - `KEYSTATIC_GITHUB_CLIENT_SECRET`
   - `KEYSTATIC_SECRET` (generate any random 32-character string for session encryption)

---

## Building & Deploying

### Build for Production
```bash
npm run build
```
The output will be generated in `dist/`.

### Deployment Options
- **Vercel / Netlify**: Connect the GitHub repository directly. Switch adapter in `astro.config.mjs` to `@astrojs/vercel` or `@astrojs/netlify` if using their native serverless runtimes.
- **Node.js / Docker**: The project is currently configured with `@astrojs/node` in standalone mode. Run `node ./dist/server/entry.mjs` to launch the production server.
- **Cloudflare Pages**: Add `@astrojs/cloudflare` for edge rendering.

---

## Project Structure

```
financewithflow/
├── public/
│   ├── images/
│   │   ├── branding/       # Brand logos, accreditations, badges
│   │   ├── team/           # Team headshots (Roz, Nasser, Fiona, Jackie, Lorri)
│   │   └── posts/          # Downloaded featured images for all 32 posts
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Header.astro    # Navigation bar & mobile menu
│   │   └── Footer.astro    # Footer with locations, links, badges, CMS link
│   ├── content/
│   │   └── posts/          # 32 migrated .mdoc posts
│   ├── content.config.ts   # Zod schema for blog collection
│   ├── data/
│   │   ├── services.json   # Comprehensive services list
│   │   ├── packages.json   # Sunstone, Carnelian, Agate packages
│   │   ├── team.json       # Team bios and roles
│   │   ├── faqs.json       # 10 Q&A items
│   │   ├── locations.json  # 7 regional landing pages
│   │   └── legal.json      # Privacy, terms, cookie policy copy
│   ├── layouts/
│   │   ├── BaseLayout.astro     # Global layout with SEO & Google Fonts
│   │   └── BlogPostLayout.astro # Article reader with meta & CTA
│   ├── pages/
│   │   ├── index.astro     # Homepage
│   │   ├── about.astro     # About page
│   │   ├── meet-the-team.astro # Team directory
│   │   ├── services.astro  # Services catalogue
│   │   ├── packages.astro  # Package tiers
│   │   ├── faqs.astro      # FAQ accordion
│   │   ├── contact.astro   # Inquiry form & office details
│   │   ├── blog/
│   │   │   ├── index.astro # Blog archive
│   │   │   └── [slug].astro # Single post reader
│   │   ├── [location].astro # Regional payroll pages
│   │   ├── privacy-policy.astro
│   │   ├── terms-conditions.astro
│   │   ├── cookie-policy-uk.astro
│   │   └── finance-with-flow-newsletter-sign-up.astro
│   └── styles/
│       └── global.css      # Brand tokens, Quicksand/Poppins typography
├── keystatic.config.ts     # Keystatic CMS configuration
├── astro.config.mjs        # Astro configuration
└── package.json
```
