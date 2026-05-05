const fs = require("fs");
const path = require("path");
const MarkdownIt = require("markdown-it");

const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "content", "blog");
const outputDir = path.join(rootDir, "blog");

const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
});

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function parsePost(filePath) {
    const raw = fs.readFileSync(filePath, "utf8");
    const frontMatterMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    const metadata = {};
    let body = raw;

    if (frontMatterMatch) {
        body = raw.slice(frontMatterMatch[0].length);
        for (const line of frontMatterMatch[1].split(/\r?\n/)) {
            const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
            if (match) {
                metadata[match[1].toLowerCase()] = match[2].trim().replace(/^["']|["']$/g, "");
            }
        }
    }

    const fallbackTitle = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
    const title = metadata.title || fallbackTitle || path.basename(filePath, ".md");
    const slug = metadata.slug || slugify(path.basename(filePath, ".md"));
    const excerpt = metadata.excerpt || body
        .replace(/^#\s+.+$/m, "")
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.replace(/[#*_`>\-[\]()]/g, "").trim())
        .find(Boolean) || "";

    return {
        title,
        slug,
        date: metadata.date || "",
        excerpt,
        html: md.render(body),
    };
}

function renderLayout({ title, description = "", body, canonicalPath = "" }) {
    const pageTitle = title === "Blog" ? "Blog | Weltschmerz.dev" : `${title} | Weltschmerz.dev`;

    return `<!doctype html>
<html lang="en-US">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="${escapeHtml(description)}" />
        <title>${escapeHtml(pageTitle)}</title>
        <link rel="stylesheet" href="../css/style.css" />
    </head>
    <body>
        <header>
            <ul class="header-items">
                <li><a href="../index.html#home-section" class="header-item">Home</a></li>
                <li><a href="../index.html#about-section" class="header-item">About</a></li>
                <li><a href="../index.html#experience-section" class="header-item">Experience</a></li>
                <li><a href="index.html" class="header-item selected-header-item">Blog</a></li>
            </ul>
        </header>

        <main class="blog-page"${canonicalPath ? ` data-page="${escapeHtml(canonicalPath)}"` : ""}>
${body}
        </main>

        <footer>
            <p>Contact me at <a style="text-decoration: none;" href="mailto:business@weltschmerz.dev"><span class="secondary-color">business</span>@weltschmerz.dev</a></p>
        </footer>
    </body>
</html>
`;
}

function renderPost(post) {
    return renderLayout({
        title: post.title,
        description: post.excerpt,
        canonicalPath: `blog/${post.slug}.html`,
        body: `            <article class="blog-post content-box">
                <a class="blog-back-link" href="index.html">Back to blog</a>
                <h1>${escapeHtml(post.title)}</h1>
                ${post.date ? `<p class="blog-date">${escapeHtml(post.date)}</p>` : ""}
                <div class="blog-content">
${post.html.trim()}
                </div>
            </article>`,
    });
}

function renderIndex(posts) {
    const items = posts.map((post) => `                <li class="blog-list-item">
                    <a href="${escapeHtml(post.slug)}.html">
                        <span class="blog-list-title">${escapeHtml(post.title)}</span>
                        ${post.date ? `<span class="blog-date">${escapeHtml(post.date)}</span>` : ""}
                        ${post.excerpt ? `<span class="blog-excerpt">${escapeHtml(post.excerpt)}</span>` : ""}
                    </a>
                </li>`).join("\n");

    return renderLayout({
        title: "Blog",
        description: "Articles by Kyan Machiels.",
        canonicalPath: "blog/index.html",
        body: `            <section class="blog-index content-box">
                <h1><span class="secondary-color">My</span> Blog</h1>
                <ul class="blog-list">
${items || "                    <li>No posts yet.</li>"}
                </ul>
            </section>`,
    });
}

fs.mkdirSync(sourceDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const fileName of fs.readdirSync(outputDir)) {
    if (fileName.endsWith(".html")) {
        fs.rmSync(path.join(outputDir, fileName));
    }
}

const posts = fs.readdirSync(sourceDir)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => parsePost(path.join(sourceDir, fileName)))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

for (const post of posts) {
    fs.writeFileSync(path.join(outputDir, `${post.slug}.html`), renderPost(post));
}

fs.writeFileSync(path.join(outputDir, "index.html"), renderIndex(posts));

console.log(`Built ${posts.length} blog post${posts.length === 1 ? "" : "s"} into ${path.relative(rootDir, outputDir)}`);
