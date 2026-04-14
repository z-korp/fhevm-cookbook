# FHEVM Cookbook Site

Thin discovery surface for the FHEVM Cookbook project.

The site focuses on:

1. a catalog of the skills that actually ship in the repo
2. a start-here router plus focused specialist modules
3. direct source and raw links for every skill
4. machine-readable artifacts for agents

## Local development

```bash
npm run dev
```

## Checks

```bash
npm run lint
npm run build
```

## Key files

1. `src/app/page.tsx` for homepage composition
2. `src/components/` for page sections
3. `src/data/` for shared site and catalog data
4. `src/app/llms.txt/route.ts` and `src/app/data/*.json/route.ts` for machine-readable artifacts
