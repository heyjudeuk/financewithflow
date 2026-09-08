export const CATEGORY_NAMES: Record<string, string> = {
  'construction-specialists': 'Construction Specialists',
  'cis-and-paye': 'CIS and PAYE',
  'outsourcing': 'Outsourcing',
  'case-study': 'Case Study',
  'year-end': 'Year End',
  'guest-writer': 'Guest Writer',
  'featured': 'Featured',
  'insights': 'Insights',
  'social-mobility': 'Social Mobility',
  'blogs-from-the-md': 'Blogs from the MD',
};

/**
 * Returns a human-friendly display name for a given category slug or name.
 */
export function getCategoryDisplayName(categorySlugOrName?: string | null): string {
  if (!categorySlugOrName) return 'Featured';
  
  // If it's already a recognized slug
  if (CATEGORY_NAMES[categorySlugOrName]) {
    return CATEGORY_NAMES[categorySlugOrName];
  }
  
  // If it's one of the original display names
  for (const name of Object.values(CATEGORY_NAMES)) {
    if (name.toLowerCase() === categorySlugOrName.toLowerCase()) {
      return name;
    }
  }

  // Fallback: format kebab-case to Title Case
  return categorySlugOrName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
