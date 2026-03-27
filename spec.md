# Mobile Number Tracker

## Current State
The app is a contact manager with add/edit/delete and category filtering. There is no tracking feature or track button anywhere in the UI.

## Requested Changes (Diff)

### Add
- `tracked: Bool` field to `Contact` type in backend
- `tracked: boolean` field to `ContactInput`
- A backend function `toggleTrackContact(contactId)` that flips the tracked flag
- A "Track" / "Untrack" toggle button on each ContactCard
- A "Tracked" tab in the category filter tabs to show only tracked contacts
- Visual badge/indicator on tracked contacts

### Modify
- `Contact` type: add `tracked: Bool` (defaults to false on creation)
- `ContactInput` type: add `tracked: Bool`
- `createContactFromInput`: pass through `tracked` field
- ContactCard component: add Track button with MapPin or Bookmark icon
- App.tsx: add "Tracked" to CATEGORIES filter list, filter logic for tracked

### Remove
- Nothing removed

## Implementation Plan
1. Update `src/backend/main.mo`: add `tracked: Bool` to Contact, ContactInput; add `toggleTrackContact` function
2. Update `src/frontend/src/backend.d.ts`: reflect new types and function
3. Update `src/frontend/src/hooks/useQueries.ts`: add `useToggleTrackContact` mutation
4. Update `ContactCard.tsx`: add Track/Untrack button
5. Update `App.tsx`: add "Tracked" tab, filter logic
