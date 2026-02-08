# Git Workflow

## Worktrees
Use git worktrees to isolate feature work from `main`.

**Location:** `C:\Users\Caus\Desktop\idleMMOGrind-worktrees\<branch-name>\`

**Create:**
```bash
git worktree add ../idleMMOGrind-worktrees/<branch-name> <branch-name>
```

**Cleanup after merge:**
```bash
git worktree remove ../idleMMOGrind-worktrees/<branch-name>
git branch -d <branch-name>
```

**Use worktrees for:** Implementation work, large doc efforts, experimental/prototype work
**Don't use for:** Quick single-file fixes on `main`, reading/research, updating CLAUDE.md or memory

## Branch Naming
- `feat/<system>` -- New features (e.g., `feat/combat-engine`)
- `docs/<topic>` -- Documentation work
- `fix/<issue>` -- Bug fixes
- `refactor/<scope>` -- Refactoring
