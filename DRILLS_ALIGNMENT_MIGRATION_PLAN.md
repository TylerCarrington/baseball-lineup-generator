# Drills & Guides Category Alignment Migration Plan (Revised)

To create a cohesive coaching experience, this plan details how to align the **Drills Library** categories, color palettes, and data structures with the **Coaching Guides** and **Skills Checklists**. 

This revised plan incorporates feedback to eliminate `"Teamwork & Situational"`, re-assigning those drills directly to `"Fielding & Defense"`, and transforming `"Situational scrimmage"` into a core `"Scrimmage"` drill under `"Games & Competitions"`.

---

## 1. Revised Category Alignment Mapping

To establish cognitive consistency across the application, we will unify category names, icons, and color themes while simplifying the coaching taxonomy.

| Coaching Guide Category | Current Drill Category | Proposed Unified Category Name | Theme Color | Icon Name |
| :--- | :--- | :--- | :--- | :--- |
| **Batting** | Hitting & Offense | **Batting & Offense** | `amber` | `Flame` / `Target` |
| **Pitching** | Throwing & Pitching | **Pitching & Throwing** | `sky` | `Activity` / `TrendingUp` |
| **Catching** | *None (Missing)* | **Catching** | `rose` | `Shield` |
| **Fielding** | Fielding & Defense | **Fielding & Defense** | `emerald` | `Compass` |
| **Base Running** | Base Running | **Base Running** | `indigo` | `Navigation` / `Zap` |
| *N/A (Utility)* | Conditioning & Warm-Up | **Conditioning & Warm-Up** | `slate` (neutral) | `Dumbbell` |
| *N/A (Utility)* | Teamwork & Situational | **[REMOVED]** *(Most drills migrate to Fielding & Defense)* | - | - |
| *N/A (Utility)* | Games & Competitions | **Games & Competitions** | `orange` | `Trophy` |

---

## 2. Specific Drill Transformations

### A. Teamwork -> Fielding Migration
All drills previously categorized under `"Teamwork & Situational"` will be updated as follows:
* **Relay Throwing / Cutoffs**: Migrates to **"Fielding & Defense"**.
* **Pickoff Coverage & Defense**: Migrates to **"Fielding & Defense"**.
* **Bunt Defense Rotations**: Migrates to **"Fielding & Defense"**.
* **Double Play Turners**: Migrates to **"Fielding & Defense"**.

### B. "Situational scrimmage" -> "Scrimmage"
* **Current Drill**: `"Situational scrimmage"` (under `"Teamwork & Situational"`).
* **Migration Target**: Renamed to **`"Scrimmage"`** and moved directly under **`"Games & Competitions"`**.
* **Structure & Details**: 
  * *Setup*: Full roster divided into two equal squads, or offense/defense units. Coach at home plate with a fungo bat.
  * *Steps*: Play out realistic game situations (e.g. runner on 1st with 1 out, down by 1 in the 6th inning). The defense works on situational alignment, while the offense practices executing team goals (bunts, hit-and-runs, driving the ball deep).
  * *Notes*: Award bonus points to the offense for execution (e.g. advancing runners) and to the defense for correct mental plays even if the runner is safe.

---

## 3. Catcher Position Drill Addition
To pre-populate the newly created **Catching** category, we will seed these standard catcher-specific drills:

### 1. "Soft Hands Framing" (Receiving)
* **Setup**: Catcher in primary stance, pitcher/coach at 15–20 feet with tennis balls or light baseballs.
* **Steps**: Coach throws soft pitches to outer borders of the strike zone. Catcher receives ball cleanly, gently rotating wrist slightly back to the center of the zone to "present" a solid strike.
* **Notes**: Avoid snapping or jerking. Maintain a quiet, stable body frame and let the glove work from the outside-in.

### 2. "Drop & Block Dirt Balls" (Blocking)
* **Setup**: Catcher in secondary stance, coach at 30 feet with standard baseballs.
* **Steps**: Coach bounces balls in the dirt left, right, and center. Catcher drives knees straight down, places glove in the "5-hole" (between knees), rounds shoulders, and slants chest protector forward.
* **Notes**: Keep eyes tracked down on the ball. The goal is to absorb energy so the ball rebounds softly right in front of the plate.

### 3. "Ear-to-Ear Steal Defense" (Throwdowns)
* **Setup**: Catcher in secondary stance, pitcher on the mound. Coach triggers simulated runner.
* **Steps**: On pitch arrival, catcher pops up with a quick jump-turn, brings ball to the right ear, and makes a flat-line throw to 2nd base bag.
* **Notes**: Minimize windup. Hand-to-glove transfer must happen right in front of the chest, pushing the ball directly back past the ear.

---

## 4. Interactive Theme Definitions

Below are the refined color variables to inject into `src/lib/drillCategories.ts` so that active filter states and badge borders match the existing display schemes:

### Batting & Offense (`amber`)
* **Badge**: `bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30`
* **Icon Box**: `bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400`
* **Active Filter**: `bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25`
* **Inactive Filter**: `bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50`

### Pitching & Throwing (`sky`)
* **Badge**: `bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30`
* **Icon Box**: `bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400`
* **Active Filter**: `bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/25`
* **Inactive Filter**: `bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50/50`

### Catching (`rose`)
* **Badge**: `bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30`
* **Icon Box**: `bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400`
* **Active Filter**: `bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25`
* **Inactive Filter**: `bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50`

### Fielding & Defense (`emerald`)
* **Badge**: `bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30`
* **Icon Box**: `bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400`
* **Active Filter**: `bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25`
* **Inactive Filter**: `bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50`

### Base Running (`indigo`)
* **Badge**: `bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/30`
* **Icon Box**: `bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400`
* **Active Filter**: `bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25`
* **Inactive Filter**: `bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50`

---

## 5. Default Practice Agenda Block Fixes

When a coach creates a brand new Practice event (via the event wizard), the application pre-populates two default agenda blocks to guide scheduling:
* **Warmups**: Currently mapped to category `"Conditioning & Warm-Up"`.
* **Game**: Currently mapped to category `"Teamwork & Situational"`.

To align with the unified taxonomy:
1. **Warmups** will remain mapped to **`"Conditioning & Warm-Up"`** (slate theme).
2. **Game** will be updated to map to **`"Games & Competitions"`** (orange theme), matching the removal of `"Teamwork & Situational"`.

*Target Code to Modify:* `src/components/CreateGameView.tsx` (specifically updating the hardcoded list `eventAgenda` in the creation loop).

---

## 6. Next Implementation Steps
Once you review and approve:
1. **Source Update**: We will edit `src/lib/drillCategories.ts` to export the refined categories array and update theme maps.
2. **Migration Code**: We will update load handlers (and pre-seeded setup functions) to seamlessly translate `"Teamwork & Situational"` to `"Fielding & Defense"`, and `"Situational scrimmage"` to `"Scrimmage"` under `"Games & Competitions"`.
3. **Agenda Initializer**: Update `src/components/CreateGameView.tsx` to use `"Games & Competitions"` for the default Game block.
4. **Seeding Catching**: Write a background seed routine to add the three catcher drills.
