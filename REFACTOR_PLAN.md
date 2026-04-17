# Refactoring Plan: Baseball Lineup App

This plan outlines the steps to refactor the monolithic `App.tsx` (5,000+ lines) into a modular, maintainable, and scalable architecture.

## Goals
- **Improve Maintainability**: Smaller files are easier to read and debug.
- **Enhance Reusability**: Share components and logic across different views.
- **Better Separation of Concerns**: Decouple UI from business logic and data fetching.
- **Standardize Patterns**: Use custom hooks and service layers.

---

## Phase 1: Foundation & Infrastructure (✅ Completed)
*Goal: Extract non-component code to establish a clean base.*

### Step 1.1: Extract Types and Constants (✅)
- Create `src/types.ts` and move all interfaces (`Player`, `Game`, `TeamSettings`, etc.) and enums (`RSVPStatus`, `OperationType`).
- Create `src/constants.ts` and move `POSITION_ORDER`, `POSITIONS`, `POSITION_MAPPING`, and `fieldPositions`.

### Step 1.2: Extract Utility Functions (✅)
- Create `src/lib/utils.ts` (or use existing).
- Move `getLocalDateString`, `getPositionAbbreviation`, and Firestore error handling logic.

### Step 1.3: Extract Firebase Service Layer (✅)
- Create `src/services/firebaseService.ts`.
- Move direct Firestore calls (`addDoc`, `updateDoc`, `deleteDoc`) into named service functions (e.g., `updateGameLineup`, `deletePlayer`).

---

## Phase 2: Logic & State Management (✅ Completed)
*Goal: Extract stateful logic into custom hooks.*

### Step 2.1: Create Data Hooks (✅)
- Create `src/hooks/usePlayers.ts`, `src/hooks/useGames.ts`, and `src/hooks/useSettings.ts`.
- Move `onSnapshot` listeners and state management for these entities into these hooks.

### Step 2.2: Extract Lineup Generation Logic (✅)
- Create `src/lib/lineupLogic.ts`.
- Move the complex `handleGenerateLineup` and `handleGenerateScrimmageLineup` functions.
- These should be pure functions or service calls that take data and return a new lineup.

---

## Phase 3: Component Extraction (UI) (🔄 In Progress)
*Goal: Break down the massive JSX into functional components.*

### Step 3.1: Extract Common UI Components (✅)
- Create `src/components/ui/` (if not using shadcn).
- Extract `ErrorBoundary`, `DeleteConfirmationModal`, and custom buttons/inputs.

### Step 3.2: Extract Major View Components (✅)
- Create `src/components/SharedView.tsx`.
- Create `src/components/RosterTab.tsx`.
- Create `src/components/GamesTab.tsx`.
- Create `src/components/SettingsTab.tsx`.

### Step 3.3: Refactor Game Detail Sub-Components (✅)
- Create `src/components/GameDetail/`.
- Extract `BattingOrderView.tsx`
- Extract `FieldingLineupView.tsx`.
- Extract `ScrimmageGroupManager.tsx`.

### Step 3.4: Extract GameHeader Component (✅ Completed)
- Create `src/components/GameDetail/GameHeader.tsx`.
- Move the game metadata display (Opponent, Date, Time, Location) and the "Back to Games" navigation from the detail view in `App.tsx`.
- **Deliverable**: A dedicated component for game information.

### Step 3.5: Extract RSVPManager Component (✅ Completed)
- Create `src/components/GameDetail/RSVPManager.tsx`.
- Extract the RSVP editing interface, including the "Edit RSVPs" button and the logic/UI for saving player availability changes.
- **Deliverable**: A component focused solely on managing player attendance for a specific game.

### Step 3.6: Extract GameDetailTabs Navigation (✅ Completed)
- Create `src/components/GameDetail/GameDetailTabs.tsx`.
- Extract the tab switching UI (Batting Order/Groups vs Field Lineup) and the associated logic, including the complex notification badges (alert circles) for scrimmage issues.
- **Deliverable**: A standalone component for navigating sub-views within a game.

### Step 3.7: Extract useGameDetail UI Hook (✅ Completed)
- Create `src/hooks/useGameDetail.ts`.
- Move game-specific UI state (edit forms, tab switching, local batting order, cell selection, and scrimmage backups) out of `App.tsx`.
- Include UI logic such as resetting edit states upon game selection.
- **Deliverable**: A custom hook that isolates the complex UI state of the game detail view from the main App component.

### Step 3.8: Extract ScrimmageGroupsView Component (✅ Completed)
- Create `src/components/GameDetail/ScrimmageGroupsView.tsx`.
- Extract the complex logic for grouping players into scrimmage groups (Groups 1-4 + Unassigned) and the layout for displaying their inning-by-inning positions.
- **Deliverable**: A dedicated component for the "Groups" tab. Do not update `App.tsx` yet.

---

## Phase 4: Game Detail Orchestration (⏳ Pending)
*Goal: Systematically finalize the Game Detail view extraction by integrating the pieces slowly to prevent massive diff errors.*

### Step 4.1: Swap ScrimmageGroupsView inline (✅ Completed)
- Replace the massive inline JSX block for the Scrimmage Groups view in `App.tsx` with the new `<ScrimmageGroupsView />` component.
- Carefully pass the required props to avoid breaking the UI.

### Step 4.2: Create GameDetailView Wrapper (✅ Completed)
- Create `src/components/GameDetail/GameDetailView.tsx`.
- Define the props and structure to house `GameHeader`, `RSVPManager`, `GameDetailTabs`, `BattingOrderView`, `FieldingLineupView`, `ScrimmageGroupsView`, and `ScrimmageGroupManager`.
- Also include the "Back to Schedule" footer button.
- **Do not update `App.tsx` in this step**. Build the standalone module first.

### Step 4.3: Integrate GameDetailView into App.tsx (✅ Completed)
- Replace the final remaining game detail conditional render logic in `App.tsx` with a single `<GameDetailView />` call.
- Pass the necessary hooks and references into it.
- **Deliverable**: A fully decoupled game detail view!

---

## Phase 5: Data Layer & Routing (🔄 In Progress)
*Goal: Clean up App.tsx to be a simple router and layout container.*

### Step 5.1: Move Handlers out of App.tsx (✅ Completed)
- Move the remaining handler functions (e.g., `handleAddPlayer`, `handleUpdateGameRSVP`, `handleCreateGame`) out of `App.tsx`.
- These should be moved either into the respective view components (`RosterTab`, `GamesTab`) or into the custom hooks (`usePlayers`, `useGames`).
- **Deliverable**: `App.tsx` no longer acts as a massive controller passing down dozens of props.

### Step 5.2: Implement React Router (✅ Completed)
- Replace the manual `activeTab` and `selectedGameId` state-based routing with proper `react-router-dom` `<Routes>` and `<Route>` components.
- Define routes for `/`, `/roster`, `/games`, `/games/:id`, and `/settings`.
- **Deliverable**: Standardized routing architecture.

### Step 5.3: Simplify App.tsx (✅ Completed)
- Use the new hooks, components, and routes.
- `App.tsx` should primarily handle top-level layout (Header/Navigation) and the `<Routes>` container.
- **Deliverable**: A lean `App.tsx` (< 200 lines).

### Step 5.4: Verification & Cleanup (✅ Completed)
- Run `npm run lint` and `npm run build` to ensure no regressions.
- Remove unused imports and dead code.
- **Deliverable**: Fully refactored and verified application.

### Step 5.5: Extract Authentication Logic (✅ Completed)
- Create a `src/hooks/useAuth.ts` hook.
- Move `onAuthStateChanged`, `signInWithPopup`, and `signOut` logic out of `App.tsx`.
- **Deliverable**: `App.tsx` no longer imports `firebase/auth` directly for state management and exclusively uses the hook.

### Step 5.6: Decouple Data Fetching from SharedView (✅ Completed)
- Create a `src/hooks/useSharedData.ts` hook that accepts an `ownerId`.
- Move the `onSnapshot` queries for settings, games, and players from `SharedView.tsx` into this hook.
- **Deliverable**: `SharedView.tsx` relies completely on the new hook for unauthenticated data fetching.

---

## Phase 6: Unify Shared UI Components (✅ Completed)
*Goal: Systematically deduplicate the UI in SharedView by extracting common pieces and supporting a `readOnly` state on existing components.*

### Step 6.1: Universal Game Header (✅ Completed)
- Refactor `GameHeader.tsx` to support a `readOnly` prop.
- Make edit-focused props (like `onBack` or setters) optional.
- Replace the inline header markup in `SharedView.tsx` with this `<GameHeader readOnly={true} />`.
- **Deliverable**: A single shared title/metadata block.
- **Verify**: Log out or open an incognito window, visit the shared link, and confirm the game title, date, time, and opponent/location show up correctly without any edit buttons. Check the logged-in game view to ensure normal editing is untouched.

### Step 6.2: Universal Game Tabs (✅ Completed)
- Update `GameDetailTabs.tsx` to support `readOnly` (hiding any edit-specific warning alerts).
- Replace the tab switching logic and markup in `SharedView.tsx`.
- **Deliverable**: Unified navigation between "Batting" and "Fielding" across the app.
- **Verify**: Visit both game tabs in shared and game views and ensure tabs (Batting/Fielding/Groups) still switch views correctly. In shared view, ensure warning badges (like scrimmage alerts) are hidden or non-interactive.

### Step 6.3: Read-Only Batting Order (✅ Completed)
- Update `BattingOrderView.tsx` to accept a `readOnly` flag.
- Conditionally render the drag-and-drop contexts (`DndContext`, `SortableContext`). If `readOnly`, just render static rows without drag handles or edit dropdowns.
- Replace the batting order list in `SharedView.tsx`.
- **Deliverable**: Unified rendering of the lineup list.
- **Verify**: In the shared view, confirm the batting order list renders correctly but cannot be dragged or reordered. Check the logged-in game view to ensure drag-and-drop functions normal.

### Step 6.4: Extract Isolated Lineup Cell Component (✅ Completed)
- Create a `src/components/common/LineupCell.tsx` component.
- Extract the complex single-cell logic (Select dropdowns vs ReadOnly Abbreviation text) out of `FieldingLineupView.tsx`.
- **Deliverable**: Smaller, encapsulated grid logic.
- **Verify**: In the logged-in game view, assign players to grid positions and confirm the dropdowns and lock icons still work as expected.

---

## Phase 7: Optimization & Polish (⏳ Pending)
*Goal: Ensure the refactored app is performant and robust.*

### Step 7.1: Fielding Grid & LineupCell Optimization (✅ Completed)
- Use `React.memo` for `src/components/common/LineupCell.tsx`.
- Refactor `FieldingLineupView.tsx` to use `useMemo` for any complex validation logic (e.g., the "Fix Lineup" button visibility checks).
- **Verify**: Assign a player in the fielding grid and ensure only affected cells (and not the entire grid) re-render (use React DevTools Profiler).

### Step 7.2: Batting Order Performance Fix (✅ Completed)
- Refactor `BattingOrderView.tsx` to pre-calculate player positions across all innings using `useMemo` to avoid `O(N*M)` loops inside the JSX map.
- Memoize individual player rows.
- **Verify**: Change an RSVP status in a large roster and ensure the update feels instantaneous.

### Step 7.3: Roster Tab & Data Sorting (✅ Completed)
- Memoize the sorted player list in `RosterTab.tsx`.
- Extract player items into a memoized sub-component to prevent full list re-renders during name/jersey editing.
- **Verify**: Edit a player's name and ensure the "Add Player" form or other player cards don't jitter or lag.

---

## Phase 8: Accessibility & UX Audit (⏳ Pending)
*Goal: Ensure the application is usable by everyone, including keyboard-only users and screen-reader users.*

### Step 8.1: Semantic HTML & Table Optimization
- **Components**: `FieldingLineupView.tsx`, `ScrimmageGroupsView.tsx`.
- **Changes**: Ensure the lineup grid uses semantic `<table>`, `<thead>`, `<tbody>`, `<tr>`, and `<th>`. Add `scope="col"` and `scope="row"` to header cells.
- **Verify**: Inspect the DOM structure in browser dev tools. Use a screen reader (e.g., VoiceOver, NVDA) to navigate the grid and verify it correctly announces the position and inning for each cell.

### Step 8.2: Icon-Only Button Clarity
- **Components**: `GameHeader.tsx`, `FieldingLineupView.tsx`, `ScrimmageGroupManager.tsx`, `BattingOrderView.tsx`.
- **Changes**: Add `aria-label` or `title` to all icon-only buttons (e.g., Lock/Unlock icons, Refresh, Trash, ChevronUp/Down).
- **Verify**: Tab through buttons and verify that screen readers announce a descriptive name (e.g., "Move player up" instead of just "Button").

### Step 8.3: Form & Label Association
- **Components**: `RosterTab.tsx`, `RSVPManager.tsx`, `SettingsTab.tsx`.
- **Changes**: Ensure every `<input>` has a matching `<label>` (using `htmlFor` and `id`). For complex selections like position checkboxes, use `<fieldset>` and `<legend>`.
- **Verify**: Click on a label text and ensure the corresponding input or checkbox receives focus.

### Step 8.4: Focus Management & Interactive States
- **Components**: `LineupCell.tsx`, `GameDetailTabs.tsx`, `Navigation.tsx`.
- **Changes**:
  - Define a distinct `:focus-visible` ring style in `index.css` for keyboard navigation.
  - Implement "Escape" key handling to close the `LineupCell` player dropdown.
  - Ensure the active tab in `GameDetailTabs` has `aria-selected="true"`.
- **Verify**: Navigate exclusively with the `Tab` key. Ensure you can open a cell dropdown, navigate its options with tab, and close it with `Esc`.

### Step 8.5: UX Loading & Error Feedback
- **Components**: `App.tsx`, `SharedView.tsx`, `ui/Button.tsx`.
- **Changes**:
  - Implement a visible loading spinner or skeleton during initial Firebase data fetch.
  - Add "loading" states to buttons for async actions (like `Generate Lineup`).
  - Use `aria-live="polite"` regions for toast notifications (if custom).
- **Verify**: Simulate slow 3G network in DevTools. Ensure the user isn't looking at a blank screen while data loads and that buttons provide clear feedback when clicked.

---

## Implementation Strategy
Each step above can be performed as a single PR-like change. 
1. **Start with Phase 1** to provide types for subsequent steps.
2. **Move to Phase 2** to clean up the "brain" of the app.
3. **Finish with Phase 3 & 4 & 6** to transform the UI and routing.
4. **Conclude with Phase 5, 7 & 8** for final polish.
