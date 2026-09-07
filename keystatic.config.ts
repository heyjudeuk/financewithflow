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
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        publishedDate: fields.date({
          label: 'Published Date',
          validation: { isRequired: true },
        }),
        author: fields.text({
          label: 'Author',
          defaultValue: 'Finance with Flow',
        }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Blogs from the MD', value: 'Blogs from the MD' },
            { label: 'Outsourcing', value: 'Outsourcing' },
            { label: 'Social Mobility', value: 'Social Mobility' },
            { label: 'Construction Specialists', value: 'Construction Specialists' },
            { label: 'Insights', value: 'Insights' },
            { label: 'Featured', value: 'Featured' },
            { label: 'Year End', value: 'Year End' },
            { label: 'Guest Writer', value: 'Guest Writer' },
            { label: 'Case Study', value: 'Case Study' },
            { label: 'CIS and PAYE', value: 'CIS and PAYE' },
          ],
          defaultValue: 'Featured',
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
  },
});
