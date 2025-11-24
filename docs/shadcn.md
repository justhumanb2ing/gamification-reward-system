# shadcn/ui setup

- CLI initialized with `style: new-york`, `baseColor: neutral`, `css: app/globals.css`, `rsc: true`, `tsx: true`.
- Dependencies added: `class-variance-authority`, `clsx`, `lucide-react`, `tailwind-merge`, `tw-animate-css`.
- Global tokens live in `app/globals.css`; dark mode is controlled via the `.dark` class on the root element.
- Utility helper `cn` is available at `lib/utils.ts` for merging class names with Tailwind-aware precedence.

## Add components

- Use `bunx shadcn@latest add <component>` to pull components into `components/ui`.
- Keep component files PascalCase and prefer shadcn-provided building blocks before creating custom ones.
