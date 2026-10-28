# @bpmn/web

The Astro frontend workspace, built with React and Tailwind CSS.

Run commands from the monorepo root:

| Command | Action |
| --- | --- |
| `pnpm --filter @bpmn/web dev` | Start the development server |
| `pnpm --filter @bpmn/web build` | Create a production build |
| `pnpm --filter @bpmn/web preview` | Preview the production build |
| `pnpm --filter @bpmn/web check` | Check Astro and TypeScript files |
| `pnpm --filter @bpmn/web astro -- --help` | Show Astro CLI options |

Astro pages live in `src/pages/`, and reusable Astro or React components can live
in `src/components/`. Tailwind CSS is loaded from `src/styles/global.css`.
Pages use the shared `src/layouts/Layout.astro` layout. The home page shows the
Goodsole shoe-order process, while `/learn` introduces the BPMN node components
with interactive React Flow previews. The `/furniture` page gives a compact
seller-and-supplier collaboration example for a fictional luxury furniture shop.

The reusable BPMN visual primitives are in `src/components/bpmn/nodes.tsx`:
activities (task, user, service, manual, script, and call), start/intermediate/end
events with message, timer, error, and signal markers, exclusive/parallel/
inclusive/event-based gateways, data artifacts, annotations, and pool/lane
backgrounds. `Flow.tsx` shows how to combine them with labeled sequence flows,
dashed message flows, and data associations.

These are diagram components rather than a complete BPMN 2.0 parser, exporter,
or execution engine.

See the [Astro documentation](https://docs.astro.build/) for more information.
