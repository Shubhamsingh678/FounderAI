The asterisks (`**text**`) appear because the assistant's reply contains markdown, but the chat renders it as plain text with `whitespace-pre-wrap`. Fix by rendering assistant messages as markdown.

## Changes

1. Add `react-markdown` + `remark-gfm` dependencies.
2. In `src/routes/_authenticated/chat.tsx`:
   - Import `ReactMarkdown` and `remark-gfm`.
   - For assistant messages, render content via `<ReactMarkdown remarkPlugins={[remarkGfm]}>` wrapped in a `prose prose-invert prose-sm` container (with tuned styles for lists, paragraphs, code, links).
   - Keep user messages as plain text bubbles (unchanged).

Result: `**Strategy & Product:**` renders as bold heading; `*   **Define…**` renders as a proper bulleted list — no raw asterisks visible.