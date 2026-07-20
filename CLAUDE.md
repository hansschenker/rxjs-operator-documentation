# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A **content-first documentation collection** for RxJS pipeable operators — mostly plain Markdown, no application code. Each operator gets one `.md` file authored against a fixed template (the "eight-policy framework" defined in `SKILL.md`), and a VitePress site renders them with an auto-generated sidebar.

Note: this repo is unrelated to the `rxjs-ds` / `rxjs-vitepress-ds` design-system projects described in the user's global `~/.claude/CLAUDE.md`. There is no component library, no magenta theme, and no build step for TypeScript/Vue here.

## Commands

```bash
npm install            # installs vitepress + vitepress-plugin-mermaid
npm run docs:dev       # dev server (VitePress root = repo root)
npm run docs:build     # build static site to .vitepress/dist
npm run docs:preview   # preview the built site
```

There is **no test runner and no linter** (`npm test` is the placeholder `exit 1`). The build itself is the check — `docs:build` fails on malformed Markdown (see the angle-bracket gotcha under Quirks).

## Architecture

The **repo root is the VitePress project root**; content and site are wired together:

- **Content (the real work):** `operators-claude/<category>/<operator>.md` — 100 files across 9 category folders (buffering, combination, error-handling, filtering, higher-order, multicasting, rate-limiting, transformation, utility), plus the hand-maintained index in `operators-claude/README.md`.
- **Site config:** `.vitepress/config.mts` (standard location — root `.vitepress/` is VitePress's reserved config dir). The **sidebar is generated at config-load time** by reading `operators-claude/` from disk (`buildSidebar()`), using each file's first `# H1` as its label. **Adding an operator `.md` to a category folder makes it appear in the sidebar automatically — no config edit needed.** Category order and section titles live in the `CATEGORY_ORDER` array.
- **Home page:** root `index.md` (a VitePress `layout: home` hero with one feature card per category).
- `srcExclude` in the config drops `**/README.md`, `CLAUDE.md`, and `docs/**` from the built site; `ignoreDeadLinks` is on because `SKILL.md`/README contain relative links to non-served files.

Dead/empty placeholders — safe to ignore, do not treat as real:
- `docs/` is a second, empty scaffold: `docs/.vitepress/config.mjs`, `docs/index.md`, and every `docs/operator-trees/*.md` are 0 bytes (excluded from the build).
- `.github/workflows/deploy-docs.yml` is 0 bytes (no CI).
- `all fattenin operators puls skill.zip` is committed but not source. Build output (`.vitepress/dist`) and cache (`.vitepress/cache`) are gitignored.

## Authoring operator docs

`SKILL.md` is the authoring standard — an eight-policy framework (Identity, Functional Specification, Marble Diagram, Behavioral Characteristics, Type System, Examples, Common Pitfalls, Related Operators) and a 17-group operator taxonomy. Read it before writing or reviewing a doc.

The de-facto template that existing files follow (see `operators-claude/transformation/map.md` as the reference example) uses these H2 sections in order: **Brief Description, Category, Import, Signature, Parameters, Return Type, Marble Diagram, Examples (three, each runnable with expected `// Output:` comments), Common Pitfalls (❌ anti-pattern → ✅ correction), Related Operators.** Match this structure and the surrounding tone when adding operators.

When you add or rename an operator file, also update the table in `operators-claude/README.md` (it is maintained by hand and its counts already drift from reality).

## Quirks to know

- **Raw `<T>` in prose breaks the build.** VitePress compiles Markdown as Vue templates, so a bare generic like `Observable<T>` in a *paragraph* is parsed as an unclosed HTML tag and fails `docs:build` with "Element is missing end tag". **Always wrap generics in backticks** (`` `Observable<T>` ``) outside code fences. Inside ```` ``` ```` code fences they are safe. The older fuller-template files (`concatMap`, `mergeMap`, `switchMap`, `exhaustMap`) were the offenders; new docs must not reintroduce this.
- **Counts.** There are 100 operator `.md` files; `operators-claude/README.md`'s table is kept in sync (Filtering 22, Transformation 20, Combination 14, …). `concatMap` intentionally appears in both `transformation/` and `higher-order/`, and `combineLatest` lives in an oddly named `combination/combineLatest-operator-documentation.md`. Verify against the filesystem before claiming coverage.
- **Two doc templates coexist.** Most files use the lighter template (Brief Description → Category → Import → Signature → Parameters → Return Type → Marble Diagram → Examples → Common Pitfalls → Related Operators; see `transformation/map.md`). Five "pre-existing" files (`combineLatest`, `concatMap`, `mergeMap`, `switchMap`, `exhaustMap`) use the fuller eight-policy layout with `## Functional Specification`, `## Type System`, etc. Match the lighter template for new operators.
- **Scope is pipeable operators only** — creation functions (`of`, `from`, `interval`, `fromEvent`, `merge`/`concat`/`zip`/`combineLatest` as creation, `forkJoin`, …) are intentionally out of scope.
