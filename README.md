# Rutuja Shinde — Website (Markdown CMS version)

A minimalist 3-page site: Home, About, Photo Gallery. Articles are
plain Markdown text files — no Substack, no external service needed.

## Writing a new article
1. Duplicate `articles/post1.md`, rename it (e.g. `post3.md`).
2. Edit the top block between the `---` lines: title, date, image (optional).
3. Write your article below the second `---` in plain text. Blank line
   between paragraphs. `## Heading` for headings, `**bold**`, `*italic*`.
4. Open `articles-index.json` and add your new filename to the top of
   the list (newest first).
5. If you used an image, drop the file in `images/articles/`.

That's the whole workflow — no code.

## Gallery photos
Same as before — files in `images/gallery/`, listed in `data/gallery.json`.

## About page
Edit the text directly inside `about.html`.
