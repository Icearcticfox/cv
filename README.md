A one-page resume website backed by the LaTeX source.  
The site displays the compiled PDF in-browser and is deployed with GitHub Pages.

### Quick start

Get started quickly using [Overleaf](https://www.overleaf.com/latex/templates/software-engineer-resume/gqxmqsvsbdjf) template.

### Build PDF using Docker

```sh
docker build -t latex .
docker run --rm -i -v "$PWD":/data latex pdflatex kirill_kashin_resume.tex
```

### Build website locally

```sh
docker run --rm -i -v "$PWD":/data thomasweise/docker-texlive-full:latest \
  sh -lc 'cd /data && pdflatex -interaction=nonstopmode kirill_kashin_resume.tex'
mkdir -p dist
cp site/index.html dist/index.html
cp kirill_kashin_resume.pdf dist/resume.pdf
python3 -m http.server 8090 --directory dist
```
Open `http://127.0.0.1:8090/`.

### Deploy

Push to `master`.  
GitHub Actions compiles `kirill_kashin_resume.tex` and deploys only:
- `index.html`
- `resume.pdf`
- `CNAME`

### License

This repository uses split licensing:

- Template/layout code and build files are licensed under [MIT](./LICENSE).
- Personal resume content and personal data are licensed under [All Rights Reserved](./LICENSE-CONTENT).
