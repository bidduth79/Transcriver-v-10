---
name: Refactoring Guidelines
description: Rules for refactoring the Transcriver-v-10 codebase.
---

# Refactoring Rules

1. **NO UI/UX Changes:** When refactoring code (e.g., extracting components, creating hooks, separating logic), you MUST ensure that the UI, styles, and user flows remain exactly the same as before. Do not change colors, padding, layout, or animations without explicit permission.
2. **NO Feature Changes:** The functionality of the application must remain 100% identical. Refactoring is strictly for improving code organization and maintainability, not for adding or removing features.
3. **Ask for Permission on Blockers:** If you encounter a complex issue during refactoring, or if fixing a piece of code requires a significant architectural compromise, DO NOT assume or invent a solution on your own. You must STOP, explain the issue to the user, and ask for permission/direction before proceeding.
