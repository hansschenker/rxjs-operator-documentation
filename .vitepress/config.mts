import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OPERATORS_DIR = path.resolve(__dirname, '../operators-claude')

// Category folders in the order they should appear in the sidebar,
// paired with their human-readable section titles.
const CATEGORY_ORDER: [string, string][] = [
  ['transformation', 'Transformation'],
  ['filtering', 'Filtering'],
  ['combination', 'Combination'],
  ['higher-order', 'Higher-Order Mapping'],
  ['rate-limiting', 'Rate Limiting'],
  ['buffering', 'Buffering & Windowing'],
  ['error-handling', 'Error Handling'],
  ['utility', 'Utility'],
  ['multicasting', 'Multicasting'],
]

// Use the first Markdown H1 as the label, falling back to the file name.
function titleFromFile(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8')
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : path.basename(filePath, '.md')
}

// Build the sidebar by reading operators-claude/ at config-load time, so new
// operator files appear automatically without editing this config.
function buildSidebar() {
  return CATEGORY_ORDER.filter(([dir]) =>
    fs.existsSync(path.join(OPERATORS_DIR, dir)),
  ).map(([dir, text]) => {
    const files = fs
      .readdirSync(path.join(OPERATORS_DIR, dir))
      .filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md')
      .sort((a, b) => a.localeCompare(b))
    return {
      text,
      collapsed: true,
      items: files.map((f) => ({
        text: titleFromFile(path.join(OPERATORS_DIR, dir, f)),
        link: `/operators-claude/${dir}/${f.replace(/\.md$/, '')}`,
      })),
    }
  })
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'RxJS Operator Documentation',
  description:
    'Formal specifications for RxJS operators using an eight-policy framework.',
  // operators-claude/README.md and SKILL.md contain relative links to files
  // that are intentionally not served; skip the dead-link build check.
  ignoreDeadLinks: true,
  srcExclude: ['**/README.md', 'CLAUDE.md', 'docs/**'],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Operators', link: '/operators-claude/transformation/map' },
      { text: 'Authoring Standard', link: '/SKILL' },
    ],
    sidebar: buildSidebar(),
    outline: [2, 3],
    search: { provider: 'local' },
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/hansschenker/rxjs-operator-documentation',
      },
    ],
  },
})
