export interface StarterSectionData {
  id: string;
  name: string;
  description: string;
  color: string;
  order: number;
  articles: {
    id: string;
    title: string;
    summary: string;
    content: string;
    status: 'published' | 'draft';
    order: number;
    youtubeUrls?: string[];
  }[];
  checklists: {
    id: string;
    title: string;
    category?: string;
    description?: string;
    order: number;
    linkedArticleId?: string;
  }[];
}

export const STARTER_GUIDE_SECTIONS: StarterSectionData[] = [
  {
    id: 'batting',
    name: 'Batting',
    description: 'Swing mechanics, launch sequence, trigger steps, barrel path, and pitch recognition.',
    color: 'amber',
    order: 1,
    articles: [
      {
        id: 'batting-fundamentals',
        title: 'Batting Fundamentals',
        summary: 'The 6-stage kinematic hitting progression from pre-pitch setup through high finish.',
        status: 'published',
        order: 1,
        content: `### The 6-Stage Hitting Progression

#### 1. Get Ready
- **Elbow Back**: Back elbow relaxed and lifted slightly into a comfortable power position.
- **Twist Hip**: Slight internal rotation of the hips to build coil in the core.
- **Knob Towards Catcher**: Position the bat at roughly a 45-degree angle with the knob pointing down toward the catcher's feet.

---

#### 2. Trigger Step
- **Small Step Forward**: Controlled 2–4 inch soft stride directly toward the pitcher onto the inside ball of the front foot.
- **Hands Stay Back**: As the front foot strides forward, the hands resist forward movement and stay back at the rear shoulder (creating rubber-band tension).
- **Start to Tuck Elbow**: Rear elbow begins slotting down naturally alongside the rib cage.

---

#### 3. Launch Hips
- **Eyes Watching Ball**: Keep steady visual track of the baseball all the way into the contact zone.
- **Head Does Not Move**: The head acts as the still center of rotation; avoid drifting lunges forward.
- **Hands Stay Back**: Hips fire first to lead the swing while hands remain back until hips clear.

---

#### 4. Launch Hands
- **Front Hand Up, Back Hand Down**: Palm-up / palm-down relationship at point of contact.
- **Hands Stay Tight to Body**: Keep the hands inside the baseball to prevent casting or looping around the ball.
- **Head Stays Steady**: Chin transitions from front shoulder before swing to back shoulder at finish.

---

#### 5. Extend
- **Head Looks Down Arms**: Gaze stays locked right down the barrel at point of contact.
- **Front Foot Weight on Heel**: Front leg locks/posts firmly to transfer all lower body power upward into the barrel.

---

#### 6. Finish
- **Hands Finish High**: Complete the rotation with hands finishing high over the lead shoulder with full chest expansion.`
      }
    ],
    checklists: [
      { id: 'bat-1', title: 'Load & coil balance', category: 'Fundamentals', order: 1, linkedArticleId: 'batting-fundamentals' },
      { id: 'bat-2', title: 'Trigger step with hands back', category: 'Fundamentals', order: 2, linkedArticleId: 'batting-fundamentals' },
      { id: 'bat-3', title: 'Player pitch recognition & timing', category: 'Fundamentals', order: 3, linkedArticleId: 'batting-fundamentals' },
      { id: 'bat-4', title: 'Lead hand path & inside-out swing', category: 'Fundamentals', order: 4, linkedArticleId: 'batting-fundamentals' },
      { id: 'bat-5', title: 'Finish high over front shoulder', category: 'Fundamentals', order: 5, linkedArticleId: 'batting-fundamentals' },
      { id: 'bat-6', title: 'Hands together & door-knocking knuckles', category: 'Fundamentals', order: 6, linkedArticleId: 'batting-fundamentals' }
    ]
  },
  {
    id: 'pitching',
    name: 'Pitching',
    description: 'Arm care, lower-half power generation, kinematic sequencing, release consistency, and pitch control.',
    color: 'sky',
    order: 2,
    articles: [
      {
        id: 'pitching-fundamentals',
        title: 'Pitching Fundamentals (Legs & Arms Mechanics)',
        summary: 'Comprehensive kinematic delivery sequence covering lower body drift/drop/block and upper body arm spiral.',
        status: 'published',
        order: 1,
        content: `### Lower Half Mechanics (Legs)

#### 1. Drift
- **Lift Leg**: Lift the lead knee to waist height in a balanced, upright posture.
- **Don't Rotate Back**: Avoid excessive counter-rotation or turning your back to the hitter.
- **Hips Move Forward**: The lead hip should begin drifting forward 3–4 inches toward home plate while the leg is still at peak balance.

---

#### 2. Drop
- **Level Hips**: Keep the hips level and parallel to the mound; do not tilt the front hip up early.
- **Get Depth (Squat)**: Ride the back glute and knee into a controlled hinge/squat without collapsing inward.
- **Don't Counter Rotate**: Keep front foot and knee aligned along the center line.

---

#### 3. Rotate
- **Hip-Shoulder Separation**: Start getting the hips open and rotated toward the plate *before* the front foot strikes the ground.
- **Land in Lunge Position**: Land with the lead foot slightly closed (about 5-10 degrees inward) on the center target line.
- **Key Drills**: Practice "Rotate Hips First Drill" and "Second Base Pickoff Drill".

---

#### 4. Block
- **Firm Front Leg**: Stiff, locked front leg acts as a firm braking wall to transfer 100% of forward kinetic energy up through the core and arm.
- **No Energy Leaks**: Ensure the front knee does not bend or collapse outward upon landing.

---

### Upper Half Mechanics (Arms)

#### 1. Separate
- **Hips Before Shoulders**: Ensure hips have fired before the upper torso uncoils.
- **Keep Shoulder Closed**: Lead shoulder stays pointing directly at the target until front foot strike.
- **Torso Alignment**: Torso remains upright or slightly back, never lunging early.

---

#### 2. Load
- **Elbows Pinched Back**: Scapular load with both elbows pulled back gently to brace the shoulder blades.
- **Arm Stays Back**: Allow the throwing arm to stay behind the torso while the chest drives forward.

---

#### 3. Spiral
- **Elbow Spirals In**: Throwing elbow spirals inward toward the rib cage and drives forward above shoulder height.
- **Rotate Around Glove**: Keep the glove tucked firmly at the armpit/chest to rotate the torso around the glove rather than pulling it away.
- **Back Elbow Drives Forward**: High elbow position with relaxed wrist and loose grip on the baseball seams.

---

#### 4. Throw & Decelerate
- **Chest Tilt Forward**: Upper body tilts forward over the firm front knee.
- **Spine Curved Back & Whip**: Spine whip transfers elastic energy through release point, with the arm naturally finishing across the opposite knee.`
      }
    ],
    checklists: [
      { id: 'pit-1', title: 'Lean & hip drift momentum', category: 'Pitching', order: 1, linkedArticleId: 'pitching-fundamentals' },
      { id: 'pit-2', title: 'Glove work & front side tuck', category: 'Pitching', order: 2, linkedArticleId: 'pitching-fundamentals' },
      { id: 'pit-3', title: 'Closed shoulder until foot plant', category: 'Pitching', order: 3, linkedArticleId: 'pitching-fundamentals' },
      { id: 'pit-4', title: 'Land on line with firm front block', category: 'Pitching', order: 4, linkedArticleId: 'pitching-fundamentals' },
      { id: 'pit-5', title: 'Extension & chest tilt over front leg', category: 'Pitching', order: 5, linkedArticleId: 'pitching-fundamentals' },
      { id: 'pit-6', title: 'Scarecrow / Power T separation', category: 'Pitching', order: 6, linkedArticleId: 'pitching-fundamentals' }
    ]
  },
  {
    id: 'catching',
    name: 'Catching',
    description: 'Receiving, framing, secondary stance, ball blocking in the dirt, throwing down to bases, and plate protection.',
    color: 'rose',
    order: 3,
    articles: [
      {
        id: 'catching-fundamentals',
        title: 'Catching Fundamentals & Stances',
        summary: 'Primary and secondary stances, soft hands receiving, drop-and-block mechanics, and footwork on steals.',
        status: 'published',
        order: 1,
        content: `### 1. Stances & Target Presentation
- **Primary Stance (Nobody on Base)**: Low, relaxed squat with knees out, feet flat, sitting on calves to present a large, low target for the pitcher.
- **Secondary Stance (Runners on Base / 2 Strikes)**: Hips raised slightly, feet wider, throwing hand tucked safely behind the glove or back with thumb folded inside fingers.

---

### 2. Receiving & Soft Hands
- Receive the pitch with a strong, quiet glove. Catch the ball out front and work slightly back toward the center of the strike zone (sticking the pitch without jerking).

---

### 3. Blocking the Ball in the Dirt
- **Drop to Both Knees**: Replace feet with knees instantly, dropping knees into the dirt.
- **Glove in 5-Hole**: Drive the glove down between the knees with the palm facing out to plug the five-hole.
- **Chest Tilted Forward**: Round your shoulders, tuck chin into chest, and angle the chest protector down so all deflections bounce 1–2 feet in front of home plate.

---

### 4. Throws to Bases & Steal Defense
- **Throwing to 2nd & 3rd Base**: Jump turn or jab step with quick ball transfer right at the right ear; stay low and drive throw on a flat line.
- **Stealing Home**: Protect the plate by anchoring right in front of the line, keeping eyes on incoming runner while securing the catch.`
      }
    ],
    checklists: [
      { id: 'cat-1', title: 'Throw to third base footwork', category: 'Catching', order: 1, linkedArticleId: 'catching-fundamentals' },
      { id: 'cat-2', title: 'Ball in dirt – blocking stance & glove in 5-hole', category: 'Catching', order: 2, linkedArticleId: 'catching-fundamentals' },
      { id: 'cat-3', title: 'Throws back to pitcher with crisp pace', category: 'Catching', order: 3, linkedArticleId: 'catching-fundamentals' },
      { id: 'cat-4', title: 'Ball in front recovery & barehand scoop', category: 'Catching', order: 4, linkedArticleId: 'catching-fundamentals' },
      { id: 'cat-5', title: 'Stealing home & plate tag awareness', category: 'Catching', order: 5, linkedArticleId: 'catching-fundamentals' },
      { id: 'cat-6', title: 'Giving a solid target & pitch receiving', category: 'Catching', order: 6, linkedArticleId: 'catching-fundamentals' }
    ]
  },
  {
    id: 'fielding',
    name: 'Fielding',
    description: 'Infield and outfield positional discipline, footwork, backups, cutoffs, and glove work.',
    color: 'emerald',
    order: 4,
    articles: [
      {
        id: 'fielding-fundamentals',
        title: 'Fielding Fundamentals & Team Defense',
        summary: 'Core defensive stance, two-hand receiving, glove presentation, and full-field backup discipline.',
        status: 'published',
        order: 1,
        content: `### Defensive Stance & Ready Position
1. **Athletic Stance**: Feet wider than shoulder-width, knees bent, chest tilted slightly forward, weight balanced on the balls of the feet.
2. **Creep Step / Hop Timing**: As the pitcher reaches release point, take a light split-step or creep step so you are moving on every single pitch.
3. **Glove Presentation**: Keep fingers down and open, wrist relaxed in front of the body. Never hide the glove behind your knees.

---

### Infield Ground Ball Mechanics
- **Alligator Hands**: Field the ball out in front with the glove hand on the ground and the throwing hand hovering just above the glove to secure the ball immediately upon impact.
- **Charging the Ball**: On softly hit grounders, attack aggressively with controlled momentum rather than letting the ball dictate the hop.
- **First Base Extension**: First basemen must stretch toward the throw, keeping the heel on the inside edge of the bag without crossing over the baseline.
- **Force Outs vs. Tag Plays**: At bases on force plays, receive with two hands while keeping a foot anchored to the bag. On tag plays, straddle the bag and drop the glove directly in front of the base letting the runner slide into the tag.

---

### Pop Flies & Outfield Communication
- **"I Got It!" Protocol**: Call the ball loudly and repeatedly ("I got it! I got it! I got it!"). The fielder calling it has absolute priority; all other fielders peel away and yell "Take it! Take it!".
- **Tagging Up Awareness**: On fly balls with runners on base, outfielders must catch the ball with forward momentum toward home plate or third base to prepare for the throw.
- **Cut-Off Alignment**: Middle infielders align themselves directly between the outfielder's arm and the target base, raising their hands as a high visual target and yelling "Relay!" or listening for "Cut 2 / Cut 3 / Cut 4 / Let it go!".

---

### Full Team Backup Responsibilities
Never stand still on a batted ball. Every fielder moves on every play:
- **Throws to 1st Base**: Right fielder sprints to backup overthrows behind first base.
- **Throws to 3rd Base**: Left fielder sprints behind 3rd base along the foul line.
- **Throws to 2nd Base**: Pitcher or center fielder backs up throws to second from behind the bag.`
      }
    ],
    checklists: [
      { id: 'fld-1', title: 'Backups: First – Right field', category: 'Backups', order: 1, linkedArticleId: 'fielding-fundamentals' },
      { id: 'fld-2', title: 'Backups: Third – Left field', category: 'Backups', order: 2, linkedArticleId: 'fielding-fundamentals' },
      { id: 'fld-3', title: 'Backups: Pitcher – 2nd and Short', category: 'Backups', order: 3, linkedArticleId: 'fielding-fundamentals' },
      { id: 'fld-4', title: 'Pop Flies: "I got it" Communication', category: 'Pop Flies', order: 4, linkedArticleId: 'fielding-fundamentals' },
      { id: 'fld-5', title: 'Pop Flies: Tagging up & momentum', category: 'Pop Flies', order: 5, linkedArticleId: 'fielding-fundamentals' },
      { id: 'fld-6', title: 'Cut Off & Relay positioning', category: 'General Fielding', order: 6, linkedArticleId: 'fielding-fundamentals' },
      { id: 'fld-7', title: 'Ready Position & Pre-pitch hop', category: 'General Fielding', order: 7, linkedArticleId: 'fielding-fundamentals' },
      { id: 'fld-8', title: 'Force out vs Tag plays distinction', category: 'General Fielding', order: 8, linkedArticleId: 'fielding-fundamentals' },
      { id: 'fld-9', title: 'Alligator hands receiving', category: 'General Fielding', order: 9, linkedArticleId: 'fielding-fundamentals' },
      { id: 'fld-10', title: 'Athletic stance & balance', category: 'General Fielding', order: 10, linkedArticleId: 'fielding-fundamentals' },
      { id: 'fld-11', title: 'Charging the ball on slow rollers', category: 'General Fielding', order: 11, linkedArticleId: 'fielding-fundamentals' },
      { id: 'fld-12', title: 'Moving on every single play', category: 'General Fielding', order: 12, linkedArticleId: 'fielding-fundamentals' },
      { id: 'fld-13', title: 'First base extension & footwork', category: 'General Fielding', order: 13, linkedArticleId: 'fielding-fundamentals' },
      { id: 'fld-14', title: 'Bunting defense & coverage', category: 'General Fielding', order: 14, linkedArticleId: 'fielding-fundamentals' }
    ]
  },
  {
    id: 'base-running',
    name: 'Base Running',
    description: 'Aggressive instincts, rounding turns, secondary leads, stealing timing, and safe sliding.',
    color: 'indigo',
    order: 5,
    articles: [
      {
        id: 'baserunning-fundamentals',
        title: 'Base Running Fundamentals & Instincts',
        summary: 'Running through first base, banana turn angles, secondary leads, and reading the dirt ball.',
        status: 'published',
        order: 1,
        content: `### 1. Running Through First Base
- **Sprint Through the Bag**: Never decelerate before touching first base. Run at 100% speed through the front edge of the bag.
- **Touch the Front Edge**: Hit the front corner of the base with the ball of your foot.
- **Look Right & Break Down**: After crossing the bag, break down your steps with feet wide and glance to the right foul territory to check for overthrows.

---

### 2. Rounding Bases & Banana Cuts
- When an extra-base hit occurs, peel 3–5 feet into foul territory before 1st base (banana path) to create a straight-line vector into 2nd base.
- Hit the inside corner of each bag with your foot and push off toward the next base.

---

### 3. Secondary Leads & Dirt Ball Reads
- **Secondary Lead Timing**: As the pitcher's arm delivers the ball, take 2–3 aggressive shuffle steps toward the next base so your weight lands on the balls of your feet right as the ball enters the hitting zone.
- **Dirt Ball Read**: If the pitch hits the dirt, take off instantly without waiting for a coach to tell you.

---

### 4. Sliding Safely
- **Figure-Four Slide**: Tuck one leg under with the knee bent outwards, hands held up in the air (never braced on the dirt), and chin tucked into the chest to protect the head.`
      }
    ],
    checklists: [
      { id: 'br-1', title: 'Stealing jumps & pitcher cadence', category: 'Running', order: 1, linkedArticleId: 'baserunning-fundamentals' },
      { id: 'br-2', title: 'Run through first base & break down', category: 'Running', order: 2, linkedArticleId: 'baserunning-fundamentals' },
      { id: 'br-3', title: 'Figure-four sliding technique', category: 'Running', order: 3, linkedArticleId: 'baserunning-fundamentals' },
      { id: 'br-4', title: 'Secondary lead & dirt ball reaction', category: 'Running', order: 4, linkedArticleId: 'baserunning-fundamentals' }
    ]
  }
];
