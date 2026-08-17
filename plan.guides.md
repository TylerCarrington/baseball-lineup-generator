# Coaching Guides — Feature Plan

## 1. Overview

A new area of Lineup+ where a coach can build a living reference library for their team: organized sections (Pitching, Hitting, Fielding, and any custom sections they add), articles within each section that combine written detail with photos and YouTube video, and a per-section skills checklist so a coach can confirm they've covered everything they intended to before the season starts.

This is a knowledge/reference feature, distinct from the existing Practice Agendas & Drill Library (which is about scheduling and running practice sessions). Guides are about capturing and organizing coaching knowledge over time.

## 2. Goals

- Give a coach a place to document how they teach pitching, hitting, fielding, and anything else, in their own words.
- Let that documentation grow over multiple seasons rather than being rebuilt each year.
- Let a coach define "what does a complete season of coverage look like" via checklists, and track progress against it.
- Keep the structure flexible — sections aren't fixed to baseball/softball fundamentals only.

## 3. Non-Goals (for now)

- No hosting/uploading of video files directly — only embedding existing YouTube links.
- No league- or organization-wide shared guide library — scope stays at the team level unless revisited later.
- No formal certification, sign-off, or compliance tracking tied to checklist completion.
- No public or parent/player-facing view in the first version.

## 4. Core Concepts

- **Guide** — the overall collection of content for a team; not really a separate object so much as the umbrella name for everything below.
- **Section** — a named category (e.g., Pitching, Hitting, Fielding, or something custom like "Catching" or "Mental Game").
- **Article** — a single page inside a section: a title, written content, photos, and optional YouTube embeds.
- **Skill Checklist** — a list of checkable items attached to a section, used to track whether that section's coaching points have been covered.

## 5. Guiding Principles

These fell out of working through the failure modes below, and are worth stating up front because they shape almost every decision after this point:

1. **Archive, don't delete.** Sections and articles are never silently destroyed — removing something moves it out of the way, not into the void. This avoids the single biggest source of "I lost my work" problems.
2. **Checklists and articles are linked but not dependent.** A checklist item can point to an article for reference, but neither one requires the other to exist. This keeps the checklist usable even for things a coach hasn't written up yet, and keeps articles useful even if they're not tied to a specific checklist point.
3. **Content persists across seasons; only checklist progress resets.** A coach shouldn't have to rebuild their pitching guide every year. But "did we cover this yet" is a seasonal question, so completion state resets while the underlying content stays put.
4. **Team-level, not coach-level.** Guides and checklist state belong to the team, not to an individual coach's account, so they survive coaching staff changes and are shared across any coach with access.
5. **Draft before published.** Half-finished articles shouldn't be visible as if they were finished ones.

## 6. Functional Areas

### 6.1 Sections

- Ships with starter sections (Pitching, Hitting, Fielding) that are fully editable and removable — they're a starting point, not a fixed structure.
- Coach can add new custom sections at any time, with a name and short description.
- Sections can be renamed, reordered, and archived.
- Creating a section with a name very close to an existing one (e.g., "Hitting" vs. "Batting") should prompt a gentle warning, to reduce accidental duplication.

### 6.2 Articles

- Created within a section; each has a title, formatted written content, photos, and optional YouTube video embeds.
- Support for a draft state (visible only to editors) and a published state (visible to anyone with view access to the guide).
- Articles can be reordered within their section.
- Basic edit history — who last changed it and when, with the ability to revert — to protect against accidental overwrites.

### 6.3 Skills Checklist

- Each section has its own checklist of coaching points to cover.
- Checklist items can optionally link to a specific article for reference, but don't have to.
- Progress is shown per section (e.g., "6 of 9 covered") and rolled up for the whole guide.
- Checklist items persist across seasons; the checked/unchecked state resets at the start of a new season so last year's completion doesn't create false confidence this year.
- Completion is a shared, team-level state — any coach checking an item off reflects team readiness, not personal progress.

## 7. Key User Flows

- **Building a guide from scratch:** coach opens Guides, sees starter sections already in place, edits or replaces the default content, adds photos/video to articles, and defines checklist items as they go.
- **Pre-season readiness check:** coach opens each section's checklist, reviews what's outstanding, and either checks items off or jumps into the linked article to finish documenting that point.
- **Adding new coverage mid-season:** coach creates a new custom section (e.g., "Baserunning"), is prompted to optionally add checklist items for it, and starts writing articles.

## 8. Edge Cases & Failure Modes

| Category | Risk | Mitigation |
|---|---|---|
| Structure | Section sprawl — too many custom sections make navigation hard | Reordering and archiving keep the active list manageable; no hard cap, but archived sections drop out of the main view |
| Structure | Duplicate/near-duplicate sections created by accident | Warn on creation if a similar name already exists; allow rename later to consolidate |
| Structure | Orphaned articles when a section is removed | Archiving a section archives its articles with it rather than deleting them; nothing is permanently removed without a separate, explicit confirmation |
| Authoring | Lost in-progress edits (navigating away, connectivity drop) | Continuous autosave of drafts; published content is unaffected since drafts stay separate until explicitly published |
| Authoring | Accidental overwrite or deletion of finished content | Lightweight edit history with revert capability; confirmation prompts before destructive actions |
| Authoring | Two coaches editing the same article at the same time | Show an indicator when someone else is actively editing, and warn before saving over changes made since the editor was opened |
| Media | YouTube video later goes private, deleted, or the link breaks | Show a clear "video unavailable" state instead of a broken embed, with an easy way to swap in a new link |
| Media | Large, unoptimized phone-camera photos slow things down or eat storage | Reasonable per-article photo limits and automatic size handling on upload |
| Media | Off-topic or inappropriate media added by a coach with edit access | Rely on the same access controls already governing who can edit team content; revisit if guides ever become shareable beyond one team |
| Checklist | Checklist item checked off without real content backing it, or an article exists with no matching checklist item | Keep the two decoupled by design — linking is optional, so this is an acceptable and expected state rather than a bug to prevent |
| Checklist | Prior season's completion state creates false confidence this season | Checklist completion resets at each season boundary; item definitions and article content do not |
| Checklist | Ambiguous ownership when a team has multiple coaches | Checklist completion is shared/team-level, consistent with how other team data already works in the app |
| Checklist | New custom section has no checklist, undermining "cover everything" goal | Prompt (not force) the coach to add checklist items right after creating a section |
| Lifecycle | Coach doesn't want to rebuild guides every season | Guide content lives at the team level and persists indefinitely; only checklist check-marks reset |
| Lifecycle | Blank-page problem for coaches starting fresh | Ship default starter sections and example checklist items for Pitching, Hitting, and Fielding |
| Environment | Guides used at the field with unreliable connectivity | Text and checklist state stay usable offline-tolerant/low-bandwidth; video embeds are treated as best-effort and don't block the rest of the page from loading |
| Access | Unclear who beyond the coaching staff can view or edit | Explicit read/edit permission tiers rather than defaulting to fully open or fully locked down |
| Scale | Finding specific content gets harder as the library grows | Search/filter across sections and articles becomes necessary once the library grows past a handful of pages |

## 9. Interactions With Existing Features

- **Drill Library overlap:** articles about hitting or fielding mechanics may naturally reference specific drills. Worth deciding whether guide articles can cross-link to existing drills rather than duplicating that content.
- **Dugout sheets / print-friendly output:** the app already generates printable game materials. Whether guides also need a printable/exportable form (e.g., handing a printed checklist to an assistant coach) is worth deciding rather than assuming.
- **Roster & team scoping:** guides should scope to a team the same way rosters and practice plans do, so multi-team coaches don't see everything mixed together.

## 10. Open Questions

- Should guides ever be shareable or copyable across teams/leagues for club-level standardization, or stay strictly per-team? Yes, I would like to be able to share this with my other coaches, parents and players
- Should players or parents ever get read-only access to specific articles (e.g., a hitting mechanics writeup), or is this coach-only? Only I should have access to edit
- Should guide articles cross-link into the existing Drill Library, or stay a fully separate space? Let me link to specific drills
- Is checklist completion meant to surface elsewhere in the app as a "season readiness" indicator, or is it just a private tracking tool for the coach? I would like to be able to track season readiness
- Is a printable/exportable version of a guide or checklist needed, consistent with the app's existing print-friendly materials? That can be extra

## 11. Suggested Phased Rollout

**Phase 1 (MVP)**
- Default starter sections; ability to add, rename, reorder, and archive sections.
- Articles with written content, photos, and YouTube embeds; draft/published states.
- Per-section checklist with team-level, season-resetting completion.

**Phase 2**
- Edit history with revert.
- Search/filter across sections and articles.
- Cross-linking between guide articles and the Drill Library.
- Handling for broken/unavailable video embeds.

**Phase 3**
- Decisions from the open questions above: cross-team sharing/templates, read-only access for parents/players, printable export, and any reporting on checklist completion over time.


**Phase 4**
Load in the following content into the database as a one time action organized into sections
Practice Skills to Cover

1.  Fielding 
    
    1.  Backups 
        
        1.  First – Right field 
            
        2.  Third – Left field 
            
        3.  Pitcher – 2nd and Short 
            
    2.  Pop Flies 
        
        1.  "I got it" 
            
        2.  Tagging up 
            
    3.  Cut Off 
        
    4.  Ready Position 
        
    5.  Force out vs tag players 
        
    6.  Alligator hands 
        
    7.  Athletic stance 
        
    8.  Charging the ball 
        
    9.  Moving on every play 
        
    10.  First base extension 
        
    11.  Bunting 
        
2.  Batting 
    
    1.  Load 
        
    2.  Trigger step 
        
    3.  Player pitch 
        
    4.  Lead hand 
        
    5.  Finish high 
        
    6.  Hands together 
        
3.  Base running 
    
    1.  Stealing 
        
    2.  Run through first 
        
    3.  Sliding 
        
    4.  Secondary lead 
        
4.  Pitching 
    
    1.  Lean 
        
    2.  Glove work 
        
    3.  Closed shoulder 
        
    4.  Land on line 
        
    5.  Extension 
        
    6.  Scarecrow 
        
5.  Catching 
    
    1.  Throw to third 
        
    2.  Ball in dirt – blocking stance 
        
    3.  Throws back to pitcher 
        
    4.  Ball in front 
        
    5.  Stealing home 
        
    6.  Giving a good target 
        

 Batting Fundamentals
---------------------

1.  Get ready 
    
    1.  elbow back 
        
    2.  Twist hip 
        
    3.  knob towards catcher 
        
2.  Trigger Step 
    
    1.  Small step forward,  
        
    2.  Hands stay back 
        
    3.  Start to tuck elbo 
        
3.  Launch Hips 
    
    1.  Eyes watching ball 
        
    2.  Head does not move 
        
    3.  Hands stay back 
        
4.  Launch Hands 
    
    1.  Front hand up, back hand down 
        
    2.  Hands stay tight to body 
        
    3.  Head stays steady 
        
5.  Extend 
    
    1.  Head looks down arms 
        
    2.  Front foot weight on heel 
        
6.  Finish 
    
    1.  Hands finish high 
        

Pitching Fundamentals
---------------------

Legs 

1.  Drift 
    
    1.  Lift leg 
        
    2.  Don't rotate back 
        
    3.  Hips should start to move forward 3-4 inches 
        
2.  Drop 
    
    1.  Level hips, straight up, don't tilt hips up 
        
    2.  Get depth, squat 
        
    3.  Don't counter rotate 
        
3.  Rotate 
    
    1.  Start to get hips rotated before landing 
        
    2.  Land in lunge position 
        
    3.  Practice rotate hips first drill 
        
    4.  Practice second base pickoff drill 
        
4.  Block 
    
    1.  Stiff front leg transferring energy 
        
    2.  Angle shouldn't leak energy 
        

Arms 

1.  Separate 
    
    1.  Hips rotated before shoulders 
        
    2.  Keep shoulder closed 
        
    3.  Torso back or even, not forward 
        
2.  Load 
    
    1.  Elbows pinched back 
        
    2.  Let arm stay back while torso rotates 
        
3.  Spiral 
    
    1.  Elbow spirals in towards hip 
        
    2.  Rotate around glove instead of torso 
        
    3.  Back elbow drives forward 
        
4.  Throw 
    
    1.  Continue to tilt forward 
        
    2.  Spine curved back a bit to whip through


---

## 12. Technical Architecture & Implementation Plan

### 12.1 Database & Firestore Schema Design

To ensure multi-season longevity, collaborative coach access, and seamless seasonal resets, data is organized into clean, typed collections with strict ownership and security rules.

#### A. Collections Schema
1. **`guideSections` (`/guideSections/{sectionId}`)**
   - `id`: `string` (unique section ID)
   - `uid`: `string` (team owner / coach user ID)
   - `teamId`?: `string` (optional team scoping)
   - `name`: `string` (e.g., "Fielding", "Batting", "Base running", "Pitching", "Catching")
   - `description`?: `string` (short purpose summary)
   - `order`: `number` (manual sorting sequence)
   - `isArchived`: `boolean` (soft delete / archival flag)
   - `color`?: `string` (accent theme: emerald, amber, indigo, sky, rose)
   - `createdAt`: `FieldValue | string`
   - `updatedAt`: `FieldValue | string`

2. **`guideArticles` (`/guideArticles/{articleId}`)**
   - `id`: `string` (unique article ID)
   - `sectionId`: `string` (parent section reference)
   - `uid`: `string` (author / owner user ID)
   - `teamId`?: `string`
   - `title`: `string` (e.g., "Batting Fundamentals", "Pitching Mechanics: Legs & Arms")
   - `summary`?: `string` (quick high-level coaching takeaway)
   - `content`: `string` (Markdown-supported rich text body with headings, bullet points, and cues)
   - `status`: `'draft' | 'published'`
   - `order`: `number` (sorting index within section)
   - `photos`?: `Array<{ url: string; caption?: string }>`
   - `youtubeUrls`?: `string[]` (validated YouTube links for video demonstrations)
   - `drillIds`?: `string[]` (IDs of linked drills from the Drill Library)
   - `isArchived`: `boolean`
   - `lastEditedBy`?: `{ uid: string; displayName: string; timestamp: any }`
   - `history`?: `Array<{ timestamp: any; editorName: string; summary: string }>`
   - `createdAt`: `FieldValue | string`
   - `updatedAt`: `FieldValue | string`

3. **`guideChecklists` (`/guideChecklists/{checklistId}`)**
   - `id`: `string` (unique item ID)
   - `sectionId`: `string` (parent section reference)
   - `uid`: `string`
   - `teamId`?: `string`
   - `title`: `string` (e.g., "Backups: First – Right field", "Trigger Step", "Blocking stance")
   - `description`?: `string` (optional detail/cue)
   - `category`?: `string` (optional sub-grouping, e.g., "Backups", "Pop Flies", "Legs", "Arms")
   - `order`: `number`
   - `linkedArticleId`?: `string` (optional link to deep-dive article)
   - `linkedDrillId`?: `string` (optional link to Drill Library item)
   - `isArchived`: `boolean`
   - `createdAt`: `FieldValue | string`

4. **`guideProgress` (`/guideProgress/{progressId}`)**
   - `id`: `string` (composite key: `${seasonId}_${checklistId}`)
   - `uid`: `string` (owner user ID)
   - `seasonId`: `string` (scopes checkmarks to the active season for automatic seasonal reset)
   - `checklistId`: `string`
   - `sectionId`: `string`
   - `isCompleted`: `boolean`
   - `completedAt`?: `FieldValue | string`
   - `completedBy`?: `{ uid: string; displayName: string }`
   - `notes`?: `string`

#### B. Firestore Security Rules
- **Helper Validations**: Add `isValidGuideSection`, `isValidGuideArticle`, `isValidGuideChecklist`, and `isValidGuideProgress` to `firestore.rules`.
- **Authorization**:
  - **Read**: Authenticated users can read their own guides; shared/public view mode allows read access for team players/parents via team share tokens.
  - **Write**: Only authenticated team coaches (`isDocOwner()` or `isAdmin()`) can create, update, or archive guide sections, articles, and checklists. Any coach on the team can update `guideProgress` checkmarks.

---

### 12.2 Desktop vs. Mobile Responsive UX Architecture

| Viewport | Layout Strategy | Interaction Model |
|---|---|---|
| **Desktop (`lg` / `xl`)** | **Split 2-Column Master-Detail Layout**<br>• **Left Sidebar (340px)**: Section list with progress bars, Season Readiness meter widget, quick filter/search, and "+ New Section" button.<br>• **Main Stage**: Section header, view toggle (`Articles` vs. `Skills Checklist` vs. `All`), article cards with video previews, and interactive checklist items with linked drill pills. | Hover states, keyboard navigation, drag/drop reordering handles, split-pane instant previews, and floating action toolbars. |
| **Mobile (`< md`)** | **Stacked Tabbed Navigation Flow**<br>• **Top Horizontal Carousel**: Sticky pill selector for sections with active indicators and completion badges.<br>• **Sub-nav Segmented Switcher**: Toggle between `Articles` and `Skills Checklist`.<br>• **Touch Cards**: Minimum 44px touch targets, full-width swipeable cards, quick-check circles, and full-screen modal overlays for editing. | Single-thumb friendly controls, bottom action sheets for article actions, modal slide-ins for editors, and responsive embedded video aspect ratios (`16:9`). |

---

### 12.3 Dark vs. Light Theme Design Specification

- **Light Mode**:
  - Canvas: `bg-slate-50` with high-contrast `text-slate-900`.
  - Cards: `bg-white` with subtle `border-slate-200/80` and gentle shadow `shadow-xs`.
  - Accents: Emerald primary (`bg-emerald-600`, `text-emerald-700`), Indigo for drills (`bg-indigo-50`, `text-indigo-600`), and Amber for checklist cues (`bg-amber-50`, `text-amber-700`).
- **Dark Mode**:
  - Canvas: `dark:bg-slate-950` with crisp `dark:text-slate-100`.
  - Cards: `dark:bg-slate-900` with `dark:border-slate-800` and `dark:hover:border-slate-700`.
  - Accents: Emerald glow (`dark:text-emerald-400`, `dark:bg-emerald-950/40`), Indigo badges (`dark:bg-indigo-950/40`, `dark:text-indigo-400`).
- **Typography & Accessibility**:
  - Heading font: Bold/Black display typography with tight tracking (`tracking-tight`).
  - Body text: 16px baseline with generous line height (`leading-relaxed`) ensuring WCAG AA contrast (>4.5:1).

---

### 12.4 Core Component Breakdown

1. **`src/components/Guides/GuidesTab.tsx`** (Main Entry & Controller)
   - Manages active section state, search query, view mode (`articles` | `checklist` | `all`), and season progress calculations.
   - Displays the **Season Readiness Summary Card** showing total skills covered vs. total planned.
   - Includes quick search to filter across all guide articles and checklist items simultaneously.

2. **`src/components/Guides/SectionList.tsx`** (Section Navigator)
   - Lists active sections with real-time completion percentages (e.g., "Fielding • 9/11 Skills").
   - Supports creating new sections, inline renaming, archiving, and order rearrangement.
   - Includes near-duplicate warning detection (e.g., warns if coach types "Batting" when "Hitting" exists).

3. **`src/components/Guides/ArticleCard.tsx` & `ArticleDetailView.tsx`**
   - Displays article title, author/editor metadata, published/draft status badge, and Markdown content.
   - Responsive media embed container for YouTube videos with safe fallback if offline or video is private.
   - Direct badge links to connected Drill Library items (opens `DrillDetailModal`).

4. **`src/components/Guides/ArticleEditorModal.tsx`**
   - Rich Markdown authoring interface with real-time live preview toggle.
   - YouTube URL input with instant video title/thumbnail verification.
   - Image attachment upload/URL inputs with captions.
   - Multi-select picker to cross-link existing Drills from the Drill Library.
   - Draft vs. Published toggle and autosave buffer to prevent lost work.

5. **`src/components/Guides/SkillsChecklistView.tsx`**
   - Grouped checklist categorized by skill area (e.g., Backups, Pop Flies, Mechanics).
   - One-click checkmark toggling tied to the active season.
   - Shows who checked off the item and when.
   - Linked article jump-links ("Read Guide") and drill badges ("View Drill").
   - "+ Add Skill Point" fast inline input.

6. **`src/components/Guides/PrintGuideView.tsx`**
   - Clean, high-contrast, black-and-white print layout for coach binder exports and dugout reference sheets.

---

### 12.5 Drill Library Cross-Linking & Interoperability

- **Bi-directional Reference**: Guide articles and checklist points can tag one or more `drillId`s.
- **In-Place Inspection**: Clicking any linked drill badge opens the application's existing `DrillDetailModal`, enabling coaches to review setups, coaching points, and video demonstrations without leaving their guide.
- **Drill Library Shortcut**: Drills in the library can show "Referenced in Coaching Guides: Batting Fundamentals" to help coaches connect theory to practice.

---

### 12.6 Sharing & Permissions Model (Parents, Players & Assistants)

- **Head Coach (Editor)**: Full create, edit, reorder, archive, and publish permissions across all sections and articles.
- **Assistant Coaches (Checklist Collaborators)**: Can check off seasonal checklist items and create notes during practices.
- **Parents & Players (Read-Only)**:
  - Accessible via a dedicated shareable link (`/shared/guides/:teamId` or toggle in Team Settings).
  - Clean, distraction-free view displaying only **Published** articles and fundamentals (drafts are hidden).
  - Ideal for sending hitting/pitching mechanics homework before cage sessions.

---

### 12.7 Seasonal Reset & Multi-Season Longevity Workflow

1. **Persistent Knowledge Base**: All Sections, Articles, and Checklist definitions remain permanently in place across seasons.
2. **Season-Scoped Progress**: `guideProgress` documents are keyed by `${seasonId}_${checklistId}`.
3. **Switching Seasons**: When the coach selects a different season in the top navigation bar, the checklist instantly reflects the completion state of that selected season.
4. **New Season Rollover**: When a new season is created (e.g., "Spring 2026"), the checklist starts at 0% complete, allowing the coaching staff to track coverage from day 1 without altering the underlying guide content.

---

### 12.8 Phase 4 Starter Content Seeding Engine

To eliminate the "blank page" problem, a one-time automatic or one-click initialization script will populate the database with the complete fundamentals and skills checklist from Phase 4:

1. **Fielding Section** (11 Checklist items):
   - Backups (First – Right field; Third – Left field; Pitcher – 2nd and Short)
   - Pop Flies ("I got it", Tagging up)
   - Cut Off, Ready Position, Force out vs tag players, Alligator hands, Athletic stance, Charging the ball, Moving on every play, First base extension, Bunting.
2. **Batting Section** (6 Checklist items + "Batting Fundamentals" Article):
   - Checklist: Load, Trigger step, Player pitch, Lead hand, Finish high, Hands together.
   - Deep-dive Article: Complete 6-step hitting progression (*1. Get ready, 2. Trigger Step, 3. Launch Hips, 4. Launch Hands, 5. Extend, 6. Finish*).
3. **Base Running Section** (4 Checklist items):
   - Stealing, Run through first, Sliding, Secondary lead.
4. **Pitching Section** (6 Checklist items + "Pitching Fundamentals" Article):
   - Checklist: Lean, Glove work, Closed shoulder, Land on line, Extension, Scarecrow.
   - Deep-dive Article: Complete Pitching Kinematic Sequence (*Legs: Drift, Drop, Rotate, Block; Arms: Separate, Load, Spiral, Throw*).
5. **Catching Section** (6 Checklist items):
   - Throw to third, Ball in dirt – blocking stance, Throws back to pitcher, Ball in front, Stealing home, Giving a good target.

---

### 12.9 Edge Cases, Offline Handling & Failure Safeguards

- **Section Sprawl & Duplication**: Warning prompt if a new section name has >80% similarity to an existing active section.
- **Zero Data Loss Rule**: Deleting a section or article performs a soft archive (`isArchived = true`). An "Archived Items" tray allows 1-click restoration.
- **Broken Video Handling**: Safe placeholder component if a YouTube URL is deleted or private, with an inline "Update Video URL" button for coaches.
- **Offline / Low-Connectivity Tolerance**: Local state caching via Firestore offline persistence; draft content is preserved in `localStorage` until successfully committed.
- **Concurrent Edit Protection**: Timestamp check before saving articles to warn if another coach updated the draft concurrently.