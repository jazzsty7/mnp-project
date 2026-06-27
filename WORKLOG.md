# WORKLOG

## Current State

The chat MVP has been extended with room creation and message interaction flows.

### Implemented

- Chat list page has a `+` button that opens a create-room sheet.
- The create-room sheet supports selecting one or more friends.
- 1:1 room behavior:
  - room title becomes the selected friend name
  - room opens directly without requiring a separate title
- Group room behavior:
  - title input is shown when 2 or more friends are selected
  - if the user leaves the title blank, the selected names are joined with commas
  - room count is displayed on the same line as the title, e.g. `(3명)`
- Chat room header:
  - centered title
  - ellipsis for overflow
  - spacing preserved around back and menu buttons
- Message menu in chat room:
  - long-press bubble to open popup
  - reply / copy / save / delete / cancel actions
- Reply behavior:
  - reply preview appears only after selecting `Reply`
  - the reply `X` closes the reply preview and restores the normal composer
- Save/Delete behavior:
  - enter selection mode
  - show left-side selection controls
  - show bottom action bar

### Key Files

- `messenger-mvp/pages/chat_list.html`
- `messenger-mvp/pages/chat_room.html`
- `messenger-mvp/assets/js/app.js`
- `messenger-mvp/assets/css/style.css`
- `messenger-mvp/README.md`

## Important Design Decisions

- Room identity and title are passed through URL query parameters.
- Avoid shared global title state for chat rooms.
- Keep selection mode and reply preview hidden by default.
- Use `hidden` plus explicit CSS overrides for modal visibility.

## Important Caveats

- The repo has legacy files with broken/garbled encoded text in some places.
- Several files were rewritten to stabilize behavior.
- If future changes touch chat-room routing, always verify that titles remain room-specific.
- If a modal appears by default, check:
  - HTML `hidden`
  - CSS `[hidden] { display: none; }`
  - JS initialization/reset on page load and `pageshow`

## Recent Debug History

- Fixed chat room popup visibility being incorrectly shown on page load.
- Fixed reply preview being visible by default.
- Fixed selection bar being visible by default.
- Fixed room title leakage by moving room state to URL-based parameters.
- Added centered title layout with ellipsis and count display.

## Next Likely Follow-Ups

- Reflect created room titles back into the chat list.
- Replace the static room list with generated room entries.
- Add persistence for created rooms if the MVP needs to simulate multiple sessions.

