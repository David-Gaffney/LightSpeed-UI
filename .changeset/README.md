# Changesets

LightSpeedUI (`@lsui/*`) uses Changesets with a **fixed lockstep version group**. Any release bump keeps all 11 public packages on one shared version number: `@lsui/origin`, `@lsui/liftoff`, `@lsui/landing`, `@lsui/apogee`, `@lsui/ast`, `@lsui/themes`, `@lsui/icons`, `@lsui/cli`, `@lsui/codemods`, `@lsui/mcp`, and `@lsui/skill`. `@lsui/figma-sync` and the `apps/*` projects are internal-only and ignored. (Older notes named `@lsui/behaviors`, `@lsui/core`, and `@lsui/blocks`; those packages were folded into the four-level layout in `FINDINGS.md` `F-032`.)
