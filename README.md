A personal site with an About page and an HTML resume generated from LaTeX source.

Live at [kirillkashin.cv](https://kirillkashin.cv/)

### Stack

- **LaTeX** (`kirill_kashin_resume.tex`) — source of truth for resume content
- **Node.js scripts** — parse the `.tex` and generate `site/resume.html`
- **Vite** — dev server and build pipeline
- **GitHub Actions** — compiles PDF, generates HTML, deploys to GitHub Pages

### Local development

Compile PDF (requires Docker):

```sh
docker run --rm -i -v "$PWD":/data thomasweise/docker-texlive-full:latest \
  sh -lc 'cd /data && pdflatex -interaction=nonstopmode kirill_kashin_resume.tex'
```

Run dev server:

```sh
npm install
npm run dev
```

This generates `site/resume.html` from the `.tex` source and starts Vite at `http://localhost:5173/`.

### Deploy

Push to `master`. GitHub Actions compiles the PDF, generates the HTML resume, builds the site with Vite, and deploys to GitHub Pages.

### License

- Template/layout code and build files: [MIT](./LICENSE)
- Personal resume content and personal data: [All Rights Reserved](./LICENSE-CONTENT)
