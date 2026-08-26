# Unified Shared Portal Refactor Plan

## 1. Objective
Currently, the shared experience is fragmented. A coach must share separate links for Events (`/shared/:uid`), Drills (`/shared/drills/:uid`), and Guides (`/shared/guides/:uid`). 

This refactor will unify these disjointed views into a single **Public Portal Layout**. Anyone with a link to the team's portal will see a unified navigation menu allowing them to self-discover the schedule, drills, and coaching guides.

## 2. URL Architecture & Routing Updates

We will migrate away from the manual short-circuit routing in `App.tsx` and utilize proper nested React Router configuration (`HashRouter`).

**New Routing Structure:**
*   **Base (Auto-Redirect):** `/shared/:uid` ➔ Redirects to `/shared/:uid/schedule`
*   **Schedule / Games:** `/shared/:uid/schedule` (Displays `SharedView`)
*   **Drills Library:** `/shared/:uid/drills` (Displays `PublicDrillsView`)
*   **Coaching Guides:** `/shared/:uid/guides` (Displays `PublicGuidesView`)
*   **Tools:** `/shared/:uid/tools` (Displays `PublicToolsView`)

*Note: As approved, legacy links that do not match this `/:uid/:tab` format may break in favor of this cleaner, unified approach.*

## 3. UI/UX Changes

### A. The `PublicPortalLayout` Component
We will create a new master layout component (`src/components/PublicPortalLayout.tsx`) that wraps all public views.
*   **Header:** Displays the Team Name (fetched via `uid`), a generic public title, and a Dark Mode toggle.
*   **Navigation Menu:**
    *   **Mobile:** A sticky bottom tab bar (using Lucide icons like `Calendar`, `Dumbbell`, `BookOpen`) for easy thumb access.
    *   **Desktop:** A clean, horizontal navigation bar below the header.
*   **Print CSS:** The header and navigation will apply the `print:hidden` Tailwind class. This guarantees that when a user prints a Game Lineup or a Coaching Guide, the navigation UI is excluded from the paper.

### B. Refactoring Existing Child Views
Because the new layout handles the outer padding, dark mode toggles, and navigation, the child components will be simplified:
*   **`SharedView.tsx` (Schedule):** 
    *   Remove its standalone header and dark mode toggle.
    *   Rely on the `uid` passed down from the layout router rather than manually parsing `location.pathname.split('/')`.
*   **`PublicDrillsView.tsx` & `PublicGuidesView.tsx`:** 
    *   Remove custom header/back buttons.
    *   Standardize padding to fit inside the `PublicPortalLayout` container.
    *   Switch to standard `useParams<{ uid: string }>()` extraction.

## 4. Quality & Issue Review (Self-Audit)

Before implementing, we have reviewed the plan against core requirements:

| Requirement | Audit / Solution |
| :--- | :--- |
| **Mobile Responsiveness** | **Pass.** The layout will utilize a fixed `bottom-0` tab bar on mobile screens (`block sm:hidden`) and a top flex-row navigation on desktop (`hidden sm:flex`). This guarantees excellent thumb reachability on phones. |
| **Dark Mode Contrast** | **Pass.** Navigation active states will explicitly avoid black text on dark backgrounds. We will use safe highlight colors (e.g., `text-blue-600 dark:text-blue-400` for active tabs, and `text-slate-500 dark:text-slate-400` for inactive). |
| **Print Functionality** | **Pass.** By applying `print:hidden` strictly to the `<nav>` and header containers, we ensure the core content (Rosters, Guides, Drills) expands to full width on paper, preserving the existing print logic. |
| **Images in Guides** | **Pass.** Public guides rely on standard Markdown URL parsing (`react-markdown`). Since image URLs are either absolute Firebase Storage links or external URLs, they do not require application-level authentication. Viewers will see images flawlessly. |
| **Read-Only Enforcement** | **Pass.** The layout will NOT expose the authenticated `user` object to the child views. Operations like "Add Drill", "Edit Guide", or "Delete Game" remain safely guarded behind `isAdmin` checks (which will evaluate to `false` in this public context) and Firestore security rules. |

## 5. Implementation Steps
1. Create `PublicPortalLayout.tsx`.
2. Update `App.tsx` routing to use `<Route path="/shared/:uid/*" element={<PublicPortalLayout />} />`.
3. Strip standalone headers/toggles from `SharedView`, `PublicDrillsView`, and `PublicGuidesView`.
4. Update `SettingsTab.tsx` so the "Copy Public Link" button copies the new base URL format (`#/shared/${user.uid}/schedule`).
