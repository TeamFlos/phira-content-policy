# Repository Guidelines

## Where To Look First

Project documentation lives in `docs/`. If you are unsure about data structure, terminology, or policy rules, read `docs/prd.md` before making changes.

## Before You Commit

- Keep changes small and focused on a single topic.
- Ensure files you touched are valid and correctly formatted for their file type.
- Run formatting and linting: `pnpm run lint`, `pnpm run lint:fix`, `pnpm run fmt:check`, `pnpm run fmt`.

## Commit & Pull Request Guidelines

- Commit message format (recommended): `type(scope): summary` (example: `data(artists): add new policy entry`).
- Pull requests should include a short summary of what changed and why.
- Pull requests should include links to supporting sources if a decision depends on external references.
- Pull requests should list any follow-up tasks or known gaps.

## When In Doubt

If a change feels ambiguous, pause and consult `docs/prd.md` rather than guessing.
