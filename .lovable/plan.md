## Goal
On the Generate Idea page, let users specify budget in both US Dollars ($) and Indian Rupees (₹) instead of a single free-text field.

## Changes (frontend only)

**File: `src/routes/_authenticated/idea.tsx`**

1. Replace the single `budget` string in form state with two fields:
   - `budgetUsd` (default `"$5,000"`)
   - `budgetInr` (default `"₹4,00,000"`)
2. Replace the single Budget input with two side-by-side inputs labeled "Budget (USD)" and "Budget (INR)". Industry input moves to its own row below.
3. When submitting, combine both into the existing `budget` string sent to the server, e.g. `"$5,000 / ₹4,00,000"`, so no backend / schema changes are needed (server accepts `budget` as a free-form string up to 200 chars).

## Not changing
- No DB migration, no server function edits, no changes to AI prompt structure (the combined string is passed through as before).
- Other pages untouched.
