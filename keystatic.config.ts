import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: process.env.NODE_ENV === 'production'
    ? {
        kind: 'github',
        repo: 'heyjudeuk/financewithflow',
      }
    : {
        kind: 'local',
      },
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
          defaultValue: 'published',
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
