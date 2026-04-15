# Refactoring Plan: Baseball Lineup App

This plan outlines the steps to refactor the monolithic `App.tsx` (5,000+ lines) into a modular, maintainable, and scalable architecture.

## Goals
- **Improve Maintainability**: Smaller files are easier to read and debug.
- **Enhance Reusability**: Share components and logic across different views.
- **Better Separation of Concerns**: Decouple UI from business logic and data fetching.
- **Standardize Patterns**: Use custom hooks and service layers.

---

## Phase 1: Foundation & Infrastructure
*Goal: Extract non-component code to establish a clean base.*

### Step 1.1: Extract Types and Constants
- Create `src/types.ts` and move all interfaces (`Player`, `Game`, `TeamSettings`, etc.) and enums (`RSVPStatus`, `OperationType`).
- Create `src/constants.ts` and move `POSITION_ORDER`, `POSITIONS`, `POSITION_MAPPING`, and `fieldPositions`.
- **Deliverable**: `src/types.ts`, `src/constants.ts`.

### Step 1.2: Extract Utility Functions
- Create `src/lib/utils.ts` (or use existing).
- Move `getLocalDateString`, `getPositionAbbreviation`, and Firestore error handling logic.
- **Deliverable**: Cleaned up utility functions in `src/lib/`.

### Step 1.3: Extract Firebase Service Layer
- Create `src/services/firebaseService.ts`.
- Move direct Firestore calls (`addDoc`, `updateDoc`, `deleteDoc`) into named service functions (e.g., `updateGameLineup`, `deletePlayer`).
- **Deliverable**: `src/services/firebaseService.ts`.

---

## Phase 2: Logic & State Management
*Goal: Extract stateful logic into custom hooks.*

### Step 2.1: Create Data Hooks
- Create `src/hooks/usePlayers.ts`, `src/hooks/useGames.ts`, and `src/hooks/useSettings.ts`.
- Move `onSnapshot` listeners and state management for these entities into these hooks.
- **Deliverable**: Custom hooks in `src/hooks/`.

### Step 2.2: Extract Lineup Generation Logic
- Create `src/lib/lineupLogic.ts`.
- Move the complex `handleGenerateLineup` and `handleGenerateScrimmageLineup` functions.
- These should be pure functions or service calls that take data and return a new lineup.
- **Deliverable**: `src/lib/lineupLogic.ts`.

---

## Phase 3: Component Extraction (UI)
*Goal: Break down the massive JSX into functional components.*

### Step 3.1: Extract Common UI Components
- Create `src/components/ui/` (if not using shadcn).
- Extract `ErrorBoundary`, `DeleteConfirmationModal`, and custom buttons/inputs.
- **Deliverable**: Reusable UI components.

### Step 3.2: Extract Major View Components
- Create `src/components/SharedView.tsx`.
- Create `src/components/RosterTab.tsx`.
- Create `src/components/GamesTab.tsx`.
- Create `src/components/SettingsTab.tsx`.
- **Deliverable**: Top-level tab components.

### Step 3.3: Refactor Game Detail View
- Create `src/components/GameDetail/`.
- Extract `BattingOrderView.tsx` and `FieldingLineupView.tsx`.
- Extract `ScrimmageGroupManager.tsx`.
- **Deliverable**: Modularized game detail view.

---

## Phase 4: Final Integration
*Goal: Clean up App.tsx to be a simple router and layout container.*

### Step 4.1: Simplify App.tsx
- Use the new hooks and components.
- `App.tsx` should primarily handle routing and top-level layout (Header/Navigation).
- **Deliverable**: A lean `App.tsx` (< 200 lines).

### Step 4.2: Verification & Cleanup
- Run `npm run lint` and `npm run build` to ensure no regressions.
- Remove unused imports and dead code.
- **Deliverable**: Fully refactored and verified application.

---

## Implementation Strategy
Each step above can be performed as a single PR-like change. 
1. **Start with Phase 1** to provide types for subsequent steps.
2. **Move to Phase 2** to clean up the "brain" of the app.
3. **Finish with Phase 3 & 4** to transform the UI.
