/* ============================================================
   HOW THIS WORKS
   - Each article is a plain .md (Markdown) text file inside /articles
   - articles-index.json lists which files to show, newest first
   - This script fetches that list, fetches each file, reads the
     little "front matter" block at the top (title/date/image),
     and turns the rest into HTML using the Marked.js library.
   ============================================================ */

const ARTICLES_INDEX = "articles-index.json";
const ARTICLES_FOLDER = "articles/";

let articlesCache = null;

async function loadArticleList() {
  if (articlesCache) return articlesCache;

  const res = await fetch(ARTICLES_INDEX);
  const filenames = await res.json();

  const articles = await Promise.all(filenames.map(async (filename) => {
    const text = await (await fetch(ARTICLES_FOLDER + filename)).text();
    const { meta, body } = parseFrontMatter(text);
    return {
      file: filename,
      title: meta.title || filename,
      date: meta.date || "",
      image: meta.image || "",
      body
    };
  }));

  articlesCache = articles;
  return articles;
}

// Splits a file into the "---" metadata block and the markdown body below it
function parseFrontMatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const meta = {};
  match[1].split("\n").forEach(line => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    meta[key] = value;
  });

  return { meta, body: match[2].trim() };
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function excerptFromMarkdown(markdown, maxLen = 200) {
  const plain = markdown
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[#*_>`-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > maxLen ? plain.slice(0, maxLen).trim() + "…" : plain;
}

/* ---------- Homepage ---------- */
async function renderHomepage() {
  const container = document.getElementById("article-list");
  if (!container) return;
  container.innerHTML = '<p class="state-msg">Loading articles…</p>';

  try {
    const articles = await loadArticleList();
    if (!articles.length) {
      container.innerHTML = '<p class="state-msg">No articles published yet.</p>';
      return;
    }
    container.innerHTML = articles.map(a => `
      <article class="article-card">
        <h2><a href="article.html?file=${encodeURIComponent(a.file)}">${a.title}</a></h2>
        <div class="article-meta">${formatDate(a.date)}</div>
        ${a.image ? `<img class="article-thumb" src="${a.image}" alt="${a.title}" loading="lazy">` : ""}
        <p class="article-excerpt">${excerptFromMarkdown(a.body)}</p>
      </article>
    `).join("");
  } catch (err) {
    container.innerHTML = '<p class="state-msg">Couldn\'t load articles.</p>';
    console.error(err);
  }
}

/* ---------- Article detail page ---------- */
async function renderArticle() {
  const container = document.getElementById("article-detail");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const file = params.get("file");

  container.innerHTML = '<p class="state-msg">Loading…</p>';

  try {
    const articles = await loadArticleList();
    const article = articles.find(a => a.file === file);
    if (!article) {
      container.innerHTML = '<p class="state-msg">Article not found. <a href="index.html">Back to home</a></p>';
      return;
    }
    document.title = article.title + " — Rutuja Shinde";
    const html = window.marked ? marked.parse(article.body) : article.body;
    container.innerHTML = `
      <a class="back-link" href="index.html">&larr; Back to all articles</a>
      <h1>${article.title}</h1>
      <div class="article-meta">${formatDate(article.date)}</div>
      ${article.image ? `<img class="article-thumb" src="${article.image}" alt="${article.title}">` : ""}
      <div class="article-body">${html}</div>
    `;
  } catch (err) {
    container.innerHTML = '<p class="state-msg">Couldn\'t load this article.</p>';
    console.error(err);
  }
}

/* ---------- Gallery ---------- */
async function renderGallery() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;

  try {
    const res = await fetch("data/gallery.json");
    const photos = await res.json();
    if (!photos.length) {
      grid.innerHTML = '<p class="state-msg">No photos yet — add some to data/gallery.json</p>';
      return;
    }
    grid.innerHTML = photos.map(p => `
      <figure data-full="${p.src}">
        <img src="${p.src}" alt="${(p.caption || '').replace(/"/g, '&quot;')}" loading="lazy">
        ${p.caption ? `<figcaption>${p.caption}</figcaption>` : ""}
      </figure>
    `).join("");

    grid.querySelectorAll("figure").forEach(fig => {
      fig.addEventListener("click", () => openLightbox(fig.dataset.full));
    });
  } catch (err) {
    grid.innerHTML = '<p class="state-msg">Could not load gallery.</p>';
    console.error(err);
  }
}

function openLightbox(src) {
  const lb = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  if (!lb || !img) return;
  img.src = src;
  lb.classList.add("open");
}
function closeLightbox() {
  document.getElementById("lightbox")?.classList.remove("open");
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderHomepage();
  renderArticle();
  renderGallery();

  const closeBtn = document.querySelector(".lightbox .close-btn");
  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
  const lb = document.getElementById("lightbox");
  if (lb) lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
});
