import { config, fields, collection } from '@keystatic/core';

export default config({
  // Cloud storage is used in all environments so there is no NODE_ENV-inferred
  // fallback to unauthenticated `local` mode on a public deployment.
  // Auth is handled by Keystatic Cloud's GitHub OAuth flow; no env var is needed.
  storage: { kind: 'cloud' },
  cloud: { project: 'finance-with-flow/financewithflow' },
  collections: {
    posts: collection({
      label: 'Blog Posts',
      slugField: 'title',
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      columns: ['publishedDate', 'category', 'status', 'isFeatured'],
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        publishedDate: fields.date({
          label: 'Published Date',
          validation: { isRequired: true },
        }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'Published', value: 'published' },
            { label: 'Draft', value: 'draft' },
          ],
          defaultValue: 'draft',
        }),
        isFeatured: fields.checkbox({
          label: 'Featured Article',
          defaultValue: false,
          description: 'Highlight this article in the Featured News & Insights hero section',
        }),
        author: fields.text({
          label: 'Author',
          defaultValue: 'Finance with Flow',
        }),
        category: fields.relationship({
          collection: 'categories',
          label: 'Category',
          validation: { isRequired: true },
        }),
        featuredImage: fields.image({
          label: 'Featured Image',
          directory: 'public/images/posts',
          publicPath: '/images/posts/',
        }),
        excerpt: fields.text({
          label: 'Excerpt',
          multiline: true,
        }),
        relatedPosts: fields.multiRelationship({
          collection: 'posts',
          label: 'Custom Related Posts (optional)',
          description: 'Hand-pick up to 3 articles. If left empty, related posts are chosen automatically by category.',
          validation: { length: { max: 3 } },
        }),
        content: fields.markdoc({
          label: 'Content',
          options: {
            image: {
              directory: 'public/images/posts',
              publicPath: '/images/posts/',
            },
          },
        }),
      },
    }),
    categories: collection({
      label: 'Categories',
      slugField: 'name',
      path: 'src/content/categories/*',
      schema: {
        name: fields.slug({ name: { label: 'Category Name' } }),
        description: fields.text({ label: 'Description', multiline: true }),
      },
    }),
  },
});
