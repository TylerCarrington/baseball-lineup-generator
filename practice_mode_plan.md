# Plan: Practice Mode Implementation

This plan outlines the steps to introduce "Practice Mode" into the application, transforming the concept of a "Game" into a more flexible "Event" system.

---

## Phase 1: Data Model and Event Generalization
**Goal:** Align the backend and types to handle both Games and Practices under a unified "Event" structure.

1. **Update Types:**
    - Rename/Extend `Game` interface to `Event`.
    - Add `type: 'game' | 'practice'`.
    - Add `duration` (minutes), `opponent` (optional), `location` (optional).
    - Define `PracticeActivity`: 
        - `{ id, name, duration, type: 'team' | 'groups', groupMap?: Record<number, string> }`
        - `groupMap` will allow mapping group index (1-4) to specific drill names if needed, or if empty, it's a simple rotation.
    - Add `practiceAgenda: PracticeActivity[]`.
    - Ensure `isLocked` (Published state) applies to both Games and Practices.
2. **Database Migration:**
    - Update Firestore logic to support the new fields and types.
3. **UI: "New Event" Entry Point:**
    - Change "New Game" button to "New Event".
    - Create a "Select Event Type" step (Game vs Practice) at the start of the creation flow.

**Verification:**
- [ ] Confirm "New Game" button text in the Schedule tab is now "New Event".
- [ ] Clicking "New Event" presents a clear choice between "Game" and "Practice".
- [ ] Selecting "Game" redirects to the existing game creation flow with no regressions.

## Phase 2: Practice Creation & Agenda Logic
**Goal:** Build the specific form and time calculation logic for practices.

1. **Practice Form:**
    - Inputs: Date, Start Time.
    - Duration Dropdown: 60, 75, 90 (default), 105, 120 minutes (15 min increments).
    - Initializer: Automatically populate `practiceAgenda` with "Warmups (10m)" and "Game (10m)" (both removable).
2. **Agenda Builder (Admin View):**
    - List view of activities with drag-and-drop reordering.
    - "Add Activity" modal: name, duration, and type (Whole Team vs Group).
    - Support for "Simultaneous drills": If set to Group mode, allow naming different activities for different groups for that time slot.
    - Live time calculation: Show the "Start Time" for every item based on cumulative durations.
    - Visual indicator for remaining time vs practice duration.

**Verification:**
- [ ] Successfully create a "Practice" event and see it in the list.
- [ ] Verify the agenda defaults to Warmups and Game.
- [ ] Add a new activity and verify the "Start Time" labels update correctly to show the full sequence.
- [ ] Test that removing an activity updates the subsequent start times.

## Phase 3: Group Management (Practices & Scrimmages)
**Goal:** Implement the 1-4 group system for both Practice activities and Scrimmage modes.

1. **Universal Group Configuration:**
    - Allow configuring "Number of Groups" (1-4) for **both** Scrimmage games and Practices.
    - Update the UI to allow changing this number on the fly.
2. **Group Assignment Interface:**
    - Use the existing drag-and-drop logic for player assignments into the specified number of groups.
    - Ensure players marked as "OUT" are excluded.

**Verification:**
- [ ] Create a Scrimmage game and change the number of groups to 3; verify 3 group columns appear.
- [ ] In a Practice event, assign players to 4 different groups.
- [ ] Mark a player as "NO" RSVP and verify they disappear from the group assignment options.

## Phase 4: Display & Shared View
**Goal:** Make practices visible and useful for parents and players.

1. **Schedule Tab Updates:**
    - Update list cards to distinguish between Games and Practices (icons/colors).
    - Show "Duration" and "Location" for practices.
2. **Practice Shared View:**
    - A specific layout for practices showing:
        - The Full Agenda/Timeline with calculated start times.
        - Group Assignments.
        - RSVP section.
    - Only show the agenda if the practice is `Published` (`isLocked`).

**Verification:**
- [ ] View the main Schedule tab and confirm Practices have a distinct visual style (e.g., Clipboard icon or different color).
- [ ] Access the Shared View for a Practice while "Draft" (Unpublished) and verify the agenda is hidden.
- [ ] Publish the Practice and verify parents can see the full timeline and which group their child is in.

## Phase 5: Refinement & Validation
1. **Validation Constraints:**
    - Prevent overlap of activities if we implement a strictly linear timeline.
    - Ensure `isLocked` toggles visibility and editing permissions correctly.
2. **Cleanup:**
    - Verify "New Event" flow doesn't break existing Game features (Batting order, Scorekeeping).
    - Update any navigation paths from `/games/` to `/events/` or keep as is for backward compatibility.

**Verification:**
- [ ] Perform a full end-to-end test: Create a Game, set a lineup, then create a Practice. Ensure both coexist in the same list correctly.
- [ ] Confirm "Published" state locks editing on both the Game lineup and the Practice agenda.
- [ ] Verify time calculation in the agenda doesn't break if an activity is set to 0 or extremely long durations.
