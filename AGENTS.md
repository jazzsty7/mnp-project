# AGENTS.md

Read this file first before continuing work in this workspace.

## Project

- Repository: `messenger-mvp`
- Type: static HTML/CSS/JS chat MVP
- Main entry points:
  - `messenger-mvp/home.html`
  - `messenger-mvp/pages/chat_list.html`
  - `messenger-mvp/pages/chat_room.html`
  - `messenger-mvp/assets/js/app.js`
  - `messenger-mvp/assets/css/style.css`

## Current Product Rules

- `chat_list.html` has a `+` button that opens a "create chat room" sheet.
- A single selected friend creates a 1:1 chat room.
- Multiple selected friends create a group chat room.
- Group chat room titles are derived from the selected names if the user leaves the title blank.
- `chat_room.html` title must be isolated per room and must not leak across other rooms.
- Chat room titles are passed through the URL query string, not shared global state.
- 1:1 room title = friend name.
- Group room title = custom title when provided, otherwise comma-separated member names.
- Group room title display in the header:
  - centered
  - ellipsis when too long
  - member count shown on the same line, e.g. `(3명)`
  - leave spacing between the back button and the menu button

## Chat Room Interaction Rules

- Long-press a message bubble to open the popup menu.
- Reply preview appears only after choosing `Reply` from the popup.
- Reply preview `X` closes the reply area and restores the normal composer.
- `Save` and `Delete` switch into selection mode.
- Selection mode shows left-side selection controls and a bottom action bar.
- Outside selection mode, show the normal message input only.

## Implementation Notes

- Use `apply_patch` for all file edits.
- Do not revert unrelated user changes.
- Keep edits ASCII where practical, but Korean UI text is acceptable in app files.
- When updating UI behavior, verify both HTML structure and CSS visibility rules.
- If a `hidden` element appears unexpectedly, check for CSS rules overriding `display`.
- Prefer URL/query-state for room-specific data instead of `localStorage` for shared titles.

## Known Constraints

- Some existing HTML files in this repo may contain legacy encoding artifacts.
- Prefer minimal, targeted rewrites when a file becomes too inconsistent for partial patching.
- Preserve the current MVP structure unless the user asks for a broader redesign.

## Suggested Workflow for Future Work

1. Read this file and `WORKLOG.md`.
2. Inspect the relevant page and shared script/style files.
3. Make the smallest coherent change.
4. Run a syntax check on `assets/js/app.js` after JS edits.
5. Verify title and modal behavior after any chat-flow change.

