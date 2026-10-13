# Contributing to CoachSlot

## The rules

1. **Every task starts with an issue.** Use the Feature or Bug template. If the task is bigger
   than ½ day, split it into smaller issues first.
2. **One branch per issue**, created from an up-to-date `main`.
   Name it `type/short-description`: `feat/`, `fix/`, `chore/` or `docs/`.
   Example: `feat/health-endpoint`.
3. **Nobody pushes to `main`.** Every change goes through a pull request.
4. **Design first for big work.** If a task takes more than ½ day or changes the database or
   the API, write a design doc from `docs/design-doc-template.md` and link it in the issue.
5. **Commits are small and start with a verb**, in the present tense:
   `add health endpoint`, `fix timezone in booking list`.
6. **A PR may be merged only when** CI is green, every section of the PR template is filled in,
   and it links its issue (`Closes #12`).
7. **Review comments are labelled.** `blocking:` must be fixed before merge.
   `nit:` is a suggestion; the author decides.
8. **Every PR adds one line to `CHANGELOG.md`**, saying what changed for the user.

## How to run locally

TODO (Day 3): install, start the database, run the API and the web app, run the tests.
