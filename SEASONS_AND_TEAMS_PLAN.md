# Seasons & Teams Management: Implementation Plan (Revised)

## 1. Overview
The goal of this feature is to allow users to group their roster and games into "Seasons" (or Teams). This will enable them to end a current season, retain all historical data for past reference, and start a fresh season with a brand new roster.

## 2. Data Model Changes (Firestore)

### New Collection: `seasons`
- `id` (string)
- `name` (string) - e.g., "Fall 2026", "Summer League"
- `uid` (string) - The owner's user ID (CRITICAL for security rules).
- `createdAt` (timestamp)

### Schema Updates to Existing Collections
- **`players` collection**: Add an optional `seasonId` (string) field.
- **`games` collection**: Add an optional `seasonId` (string) field.
- **`settings` collection**: Add `activeSeasonId` (string) field to remember the user's current working season across sessions.

## 3. Critical Flaws & Solutions in Implementation

### Flaw A: Migration Race Conditions & Massive Writes
*Original Plan:* Loop through all games and players and add a `seasonId` on first load.
*The Problem:* If the user opens the app on two tabs, it causes race conditions. Mass writes are slow and error-prone.
*The Solution (Lazy / Implicit Migration):* Do NOT mass-update existing documents. Treat any `player` or `game` with a missing or undefined `seasonId` as belonging to the "Legacy Season". We will dynamically create a read-only or mutable "Legacy Season" document (e.g., `id: "legacy"`), and filter `!seasonId` items into it automatically. 

### Flaw B: Firestore Composite Index Errors
*The Problem:* Querying `where('uid', '==', uid)`. `where('seasonId', '==', activeSeason)`. `orderBy('date', 'asc')` requires a custom composite index in Firestore. In this automated environment, deploying custom composite indexes can be painful or block development.
*The Solution (Client-Side Filtering):* Continue querying games by `where('uid', '==', uid)` and `orderBy('date', 'asc')`. Since a single team's game history is relatively small, we will apply the `.filter(g => g.seasonId === currentSeason)` logic purely on the client side in the `useGames` hook. This bypasses the need for composite indexes entirely.

### Flaw C: Shared Public Links Mixing All Seasons
*The Problem:* The current `useSharedData.ts` fetches *all* games and players for a given `ownerId`. If we add seasons, the public share view will show a massive jumble of every game from every season.
*The Solution:* 
1. Update `useSharedData.ts` to only surface data matching the user's `settings.activeSeasonId`.
2. OR, append `?season=xyz` to the share URL so parents/fans can view specific past seasons. (Option 1 is easier: just share the Active Season by default).

### Flaw D: Firebase Security Rules & Blueprints
*The Problem:* The initial plan forgot to provision security rules for the new `seasons` collection.
*The Solution:* Update `firebase-blueprint.json` and `firestore.rules` to include the `seasons` collection, ensuring read/write access is restricted to `request.auth.uid == resource.data.uid`.

### Flaw E: Player Identity vs. Snapshotting
*The Problem:* If we copy a player to a new season, does it use the same ID? If it does, changing their jersey number in Season 2 alters Season 1's history.
*The Solution:* We will *Snapshot* players. Creating a new season and "Copying" players will generate *new* player documents with new IDs, tied to the new `seasonId`. This ensures absolute historical integrity for past games and line-ups.

## 4. State Management & Hooks
- **`useSeasons()`**: Fetches the `seasons` collection for the active user.
- **`useActiveSeason()`**: Tracks the selected season (defaults to `settings.activeSeasonId` or "legacy").
- **`usePlayers()` & `useGames()`**: Updated to accept `seasonId`. Filters the existing snapshot arrays client-side based on the `seasonId` (handling `undefined` as "legacy").

## 5. UI / UX Additions
1. **Season Selector (Header/Nav)**: A dropdown in `Navigation.tsx` to switch contexts.
2. **Settings Tab Updates**: A "Seasons Management" section to:
   - Create a new season.
   - Choose to "Start Empty" or "Copy Players from Current Season".
   - Set which season is the Default / Active one.
3. **Visual Cues**: If the user selects a season that is NOT their `activeSeasonId` (e.g., viewing the past), display a "Viewing Past Season" banner.

## 6. Edge Cases
- **Deleting Seasons**: Block deleting the *only* season. If a season is deleted, a Cloud Function or batch job must delete all associated players and games to prevent orphaned data (or warn the user they are about to permanently delete 50 games and 15 players).
- **Empty States**: If viewing a newly created season, ensure the "No Games Yet" and "No Players Yet" empty states clearly encourage them to add data for the *current* season.
