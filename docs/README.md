# MLPie Documentation

This directory contains the documentation for the MLPie MLOps platform.

## Structure

- `/website`: Docusaurus-based documentation site
  - `/docs`: Documentation content
  - `/blog`: Blog posts
  - `/src`: Source code for the documentation site
  - `/static`: Static assets like images

## Development

To run the documentation site locally:

```bash
cd website
npm install
npm start
```

This will start a development server at http://localhost:3000.

## Building

To build the documentation site for production:

```bash
cd website
npm run build
```

The built site will be in the `website/build` directory.

## Contributing

To add new documentation:

1. Create a new Markdown file in the appropriate directory under `website/docs/`
2. Update the sidebar configuration in `website/sidebars.ts` if needed
3. Run the site locally to preview your changes
4. Submit a pull request 