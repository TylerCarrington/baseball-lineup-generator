# Drills Management Feature Plan

## 1. Overview
The goal is to create a robust "Drills Library" for coaches. Coaches can create, edit, and delete drills. These drills will act as a master template library that can be injected into individual practice agendas. 

## 2. Data Architecture
### `Drill` Type Definition
```typescript
export interface Drill {
  id: string;
  title: string;
  category?: string; // e.g., Infield, Outfield, Hitting, Pitching, Baserunning
  setup: string; // Required equipment, field placement, etc.
  steps: string; // Step-by-step execution 
  notes?: string; // Coaching points, common mistakes
  youtubeUrl?: string; // Raw link provided by the user
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
}
```

### Firestore Security Rules (Admin-Only Modifiers)
We must add a new `drills` collection to the rules with strict Admin-only write access:
- **Write:** ONLY the admin (`request.auth.token.email == 'tylercarringtonwa@gmail.com'`). This guarantees no other coach can modify the global list.
- **Read:** Any authenticated coach (`request.auth != null`) can read the global drills to use them in their practices.

### Practice Agenda Integration (`types.ts`)
We will append a `drillId?: string` to the existing `PracticeActivity` interface.
If a coach selects a drill from the library, we store the `drillId`. This allows us to pull up the drill's Setup, Steps, and YouTube video directly from the practice view!

---

## 3. Core UI/UX Implementation

### A. The "Drills Library" Page
- A new top-level tab in the main navigation (e.g., alongside Schedule, Roster, Lineup).
- **List View:** A responsive grid/list of "Drill Cards".
- **Filtering:** Filter chips by category (Hitting, Fielding, Pitching, etc.) and a Search bar.
- **Admin Access Control:** The "Add New Drill", "Edit", and "Delete" buttons will ONLY be rendered in the UI if the currently logged-in user's email exactly matches `tylercarringtonwa@gmail.com`. Other coaches will just see a clean, read-only library.

### B. Add/Edit Drill Form Modal
- Standard form inputs: `title` (text), `category` (select/combobox).
- `textarea` for `setup`, `steps`, and `notes`. (Must use `whitespace-pre-wrap` to respect line breaks).
- `input type="url"` for the YouTube link.

### C. The YouTube Embed Engine
Users paste all kinds of junk URLs (`youtu.be/...`, `youtube.com/watch?v=...`, `youtube.com/shorts/...`). We need a robust regex utility to extract the `VIDEO_ID` and convert it to a clean iframe URL: `https://www.youtube.com/embed/VIDEO_ID`.

### D. Practice Builder Integration
- Inside `PracticeAgendaView` or when adding a new `PracticeActivity`.
- Replace the simple text input for "Activity Name" with a searchable Dropdown/Combobox that says "Select from Library or Type Custom Name".
- If a library drill is selected, the Activity's `name` becomes the Drill's `title`, and the `drillId` is saved to the activity.

---

## 4. Vulnerability & Edge Case Analysis (Self-Attack & Fixes)

### 🔴 Attack 1: The "Deleted Drill" Breakage
**Vulnerability:** A coach adds "Infield Box Drill" to Tuesday's practice, then deletes the drill from their Library on Wednesday. Does Tuesday's practice crash or show an empty block?
**Fix:** We must capture a "snapshot" or fallback. When adding a drill to an activity, we save the `name` to the `PracticeActivity`. If the `drillId` is queried and returns `null` (because it was deleted), the practice still safely displays the Activity Name, it just hides the "View Drill Details" button. 

### 🔴 Attack 2: YouTube Iframe Mobile Overflow
**Vulnerability:** Iframes have fixed `width` and `height` attributes by default. On mobile screens, a 560px iframe will shatter the layout and cause horizontal scrolling.
**Fix:** We must wrap every YouTube iframe in a responsive aspect-ratio container using Tailwind:
```tsx
<div className="relative w-full aspect-video rounded-xl overflow-hidden">
  <iframe className="absolute top-0 left-0 w-full h-full" src="..." />
</div>
```

### 🔴 Attack 3: Long Text & Line Breaks
**Vulnerability:** Coaches will paste 5 paragraphs of drill steps into the `textarea`. When rendered in the UI, HTML strips the line breaks and creates an unreadable wall of text.
**Fix:** Wherever we render `setup`, `steps`, or `notes`, we must apply `className="whitespace-pre-wrap"` so browser rendering respects the `\n` carriage returns.

### 🔴 Attack 4: Light/Dark Mode Contrast with Empty States
**Vulnerability:** In dark mode, if a drill doesn't have a YouTube link or notes, empty grey boxes look broken.
**Fix:** Conditionally render sections. Only show the "Notes" or "Video" headers if that data actually exists.

### 🔴 Attack 5: Shared View / Read-Only Mode
**Vulnerability:** A parent is viewing the practice agenda via the public share link. They click an activity that has a `drillId`. Do they get a permission denied error because they don't own the drill?
**Fix:** The public `PracticeAgendaView` must be able to fetch the Drill. Two options: 
1. Store a full snapshot of the drill data *inside* the `PracticeActivity` (No extra fetch needed, 100% safe for shared views). **(Recommended)**
2. Update Firestore rules to allow read-only access to drills if `publicSchedule == true`.

**Decision for Attack 5:** **Snapshotting** the drill data directly into the `PracticeActivity` (adding `drillSetup`, `drillSteps`, `drillYoutubeUrl` to the `PracticeActivity` type) is significantly more resilient. It means historical practices remain perfectly intact even if the master drill library changes or is deleted!

---

## 5. Migration Strategy (Pre-Seeding Existing Drills)

Currently, the application relies on a hardcoded `DRILL_CATEGORIES` object in `PracticeAgendaView.tsx` which contains around 30 pre-defined drills (e.g., "Batting practice", "Infield/outfield drills", "Long toss"). To ensure users don't lose these ideas, we will migrate them into the new dynamic system.

### A. The Admin "Auto-Seed" Approach
Instead of seeding for every user individually, there is now only ONE global master drill library. We will create a mechanism so that you (the admin) can seed this database with the existing hardcoded 30 drills. 
- **Benefit:** The global database is instantly populated with editable drills, and other coaches immediately gain access to the populated list without having to build their own.

### B. Implementation Steps
1. Create a `seedDefaultDrills()` utility function in `firebaseService.ts`.
2. This function iterates through the existing `DRILL_CATEGORIES` dictionary.
3. For each drill (e.g., `"Batting practice"` under `"Hitting & Offense"`), it creates a new Firestore document in the global `drills` collection:
   ```json
   {
     "title": "Batting practice",
     "category": "Hitting & Offense",
     "setup": "Standard setup.",
     "steps": "Follow standard procedure.",
     "createdAt": "<timestamp>"
   }
   ```
4. In the `DrillsLibrary` component, run a check: If the global drills array is empty AND the logged-in user is `tylercarringtonwa@gmail.com`, render a "Seed Database" button that triggers this script.
---

## 6. Tools Feature Plan

### A. Navigation & Entry Point
- **"Tools" Button**: Positioned directly adjacent to the **"Add Drill"** button on the Drills Library header/toolbar.
- **Tools Page View**: Clicking "Tools" navigates to a clean, grid-based Baseball Coaching Tools landing page listing all available tools with quick launch cards.

---

### B. Core Tools Specification

#### 1. Pitch Counter Tool
- **Live Pitching Tracker**:
  - Direct touch buttons for **Balls**, **Strikes** (Swinging/Called), and **In-Play / Fouls**.
  - **Live Pitch Calculator**: Automatically updates total pitches count (`Total = Balls + Strikes + In-Play`).
  - **Strike Percentage**: Displays real-time strike % (`(Strikes + In-Play) / Total`).
- **Roster Integration**:
  - Optional dropdown selector to link the active pitch count session to a specific player from the team roster.
- **Session Saving & History**:
  - "Save Pitch Count Session" button saves data to Firestore under `pitchCountSessions` collection (fields: `id`, `date`, `playerId`, `playerName`, `balls`, `strikes`, `totalPitches`, `strikePercentage`, `notes`).
  - **History Log**: Scrollable timeline/table showing past saved pitch count sessions with filtering by player or date.

#### 2. Stopwatch Tool
- **Precision Timer**: Large high-contrast digital display showing minutes, seconds, and hundredths of a second (`00:00.00`).
- **Standard Controls**: **Start / Pause**, **Lap / Split**, and **Reset**.
- **Lap/Split History**: Displays a scrollable list of recorded split times (ideal for timing multiple base runners or rep splits).
- **Optional Player Tagging**: Ability to tag a recorded split time with a player's name from the roster.

