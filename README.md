# BPMN monorepo

This repository uses pnpm workspaces. The Astro frontend lives in `apps/web`;
add other applications under `apps/` and reusable packages under `packages/`.
Each workspace needs its own `package.json`.

From the repository root, run `pnpm install` to install dependencies. Run a
script across workspaces that define it with `pnpm -r --if-present <script>`,
for example `pnpm -r --if-present build`.
