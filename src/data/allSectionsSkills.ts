export interface StarterSkillItem {
  sectionName: string;
  category: string;
  title: string;
  description: string;
  linkedDrillTitle?: string;
  status?: string;
}

export const ALL_SECTIONS_STARTER_SKILLS: StarterSkillItem[] = [
  // ==================== 1. BATTING ====================
  {
    sectionName: "Batting",
    category: "Stance & Balance",
    title: "Load & Coil Balance",
    description: "Stay anchored on inside of rear foot with hands back at shoulder height and knob pointing toward catcher.",
    linkedDrillTitle: "Rear-Hip Hinge & Load Tee Drill",
    status: "To Cover"
  },
  {
    sectionName: "Batting",
    category: "Launch Sequence",
    title: "Trigger Step with Hands Back",
    description: "Soft 2-3 inch forward stride with hands resisting forward movement to create elastic rubber-band tension.",
    linkedDrillTitle: "Stride Separation & Elastic Tension Drill",
    status: "To Cover"
  },
  {
    sectionName: "Batting",
    category: "Swing Path",
    title: "Palm-Up Palm-Down Contact",
    description: "Drive top hand with palm facing upward and lead hand palm down through the contact point for maximum backspin.",
    linkedDrillTitle: "Top Hand Extension & Impact Palm Drill",
    status: "To Cover"
  },
  {
    sectionName: "Batting",
    category: "Swing Path",
    title: "Lead Hand Path & Inside-Out Swing",
    description: "Keep hands tight inside the baseball to prevent casting or sweeping barrel around the hitting zone.",
    linkedDrillTitle: "Lead Arm Inside-Out Fence Drill",
    status: "To Cover"
  },
  {
    sectionName: "Batting",
    category: "Approach",
    title: "Two-Strike Battle Approach",
    description: "Choke up 1 inch and widen stance to shorten swing and protect both edges of the plate.",
    linkedDrillTitle: "Two-Strike Choke-Up Zone Contact Drill",
    status: "To Cover"
  },
  {
    sectionName: "Batting",
    category: "Bunting",
    title: "Sacrifice & Push Bunting",
    description: "Hold bat at top of strike zone and deaden softly down 1st or 3rd base foul line.",
    linkedDrillTitle: "Targeted Line Sacrifice & Push Bunt Drill",
    status: "To Cover"
  },
  {
    sectionName: "Batting",
    category: "Finish",
    title: "High Finish Over Front Shoulder",
    description: "Complete hip rotation with chest expansion and balanced two-handed finish over lead shoulder.",
    linkedDrillTitle: "Full Hip Rotation & High Finish Drill",
    status: "To Cover"
  },

  // ==================== 2. PITCHING ====================
  {
    sectionName: "Pitching",
    category: "Mechanics",
    title: "Four-Seam Grip & Wrist Snap",
    description: "Fingers positioned across horseshoes with thumb centered underneath for clean 12-to-6 true backspin.",
    linkedDrillTitle: "Four-Seam Wrist Snap & Spin Drill",
    status: "To Cover"
  },
  {
    sectionName: "Pitching",
    category: "Lower Half",
    title: "Lean & Hip Drift Momentum",
    description: "Lead hip drifts 3-4 inches toward plate while knee is at peak balance driving linear momentum.",
    linkedDrillTitle: "Hip Drift & Linear Momentum Pause Drill",
    status: "To Cover"
  },
  {
    sectionName: "Pitching",
    category: "Upper Body",
    title: "Scarecrow / Power T Separation",
    description: "Both elbows pinched back with thumbs down and ball facing away from target in high-cocked position.",
    linkedDrillTitle: "Scarecrow T-Position Separation Drill",
    status: "To Cover"
  },
  {
    sectionName: "Pitching",
    category: "Delivery",
    title: "Closed Shoulder until Foot Plant",
    description: "Keep lead shoulder pointing directly at target until front foot strikes ground.",
    linkedDrillTitle: "Front-Shoulder Lock & Foot-Plant Drill",
    status: "To Cover"
  },
  {
    sectionName: "Pitching",
    category: "Delivery",
    title: "Land on Line with Firm Front Block",
    description: "Front leg acts as a stiff braking wall to transfer 100% of lower body kinetic energy up into arm.",
    linkedDrillTitle: "Firm Lead-Leg Block & Stride Line Drill",
    status: "To Cover"
  },
  {
    sectionName: "Pitching",
    category: "Extension",
    title: "Chest Tilt & Towel Snap Follow Through",
    description: "Upper torso tilts forward over front knee with arm snapping through out front.",
    linkedDrillTitle: "Chest Tilt & Towel Snap Extension Drill",
    status: "To Cover"
  },
  {
    sectionName: "Pitching",
    category: "Pickoffs",
    title: "Quick-Step Pickoff Move to 1st & 2nd",
    description: "Fast foot pivot and direct 45-degree stride to bag without tipping shoulders.",
    linkedDrillTitle: "Quick-Pivot 1st & 2nd Pickoff Drill",
    status: "To Cover"
  },

  // ==================== 3. INFIELD ====================
  {
    sectionName: "Infield",
    category: "Stance & Timing",
    title: "Athletic Ready Position & Creep Hop",
    description: "Split-step timing hop on pitcher release with chest over knees and weight on balls of feet.",
    linkedDrillTitle: "Split-Step Creep Hop Timing Drill",
    status: "To Cover"
  },
  {
    sectionName: "Infield",
    category: "Footwork",
    title: "Triangle Footwork & Glove Apex Presentation",
    description: "Feet wide with glove presented out front forming an equilateral triangle with feet.",
    linkedDrillTitle: "Triangle Glove Apex Footwork Drill",
    status: "To Cover"
  },
  {
    sectionName: "Infield",
    category: "Hands",
    title: "Alligator Hands & Funnel to Belly",
    description: "Dominant hand hovers over glove pocket to trap bounce and funnel softly into belly button.",
    linkedDrillTitle: "Alligator Trap & Belly Funnel Drill",
    status: "To Cover"
  },
  {
    sectionName: "Infield",
    category: "Hands",
    title: "Short Hop Pickups & Glove Push",
    description: "Attack in-between short hops out front working from the ground upward with soft wrists.",
    linkedDrillTitle: "Bottom-Up Short Hop Glove Push Drill",
    status: "To Cover"
  },
  {
    sectionName: "Infield",
    category: "Double Plays",
    title: "6-4-3 / 4-6-3 Double Play Feeds & Pivots",
    description: "Chest-high underhand flips and wrist flicks for seamless middle infield turns across 2nd base.",
    linkedDrillTitle: "Double Play Underhand Feed & Pivot Drill",
    status: "To Cover"
  },
  {
    sectionName: "Infield",
    category: "Approach",
    title: "Charging Slow Rollers with Momentum",
    description: "Attack softly hit grounders on the run with barehand or glove scoop while maintaining balance.",
    linkedDrillTitle: "Barehand & Scoop Slow Roller Charge Drill",
    status: "To Cover"
  },
  {
    sectionName: "Infield",
    category: "Positioning",
    title: "First Base Stretch & Heel on Bag",
    description: "Stretch toward incoming throw keeping back heel anchored to inside base edge without crossing baseline.",
    linkedDrillTitle: "First Base Heel-Anchor Stretch Drill",
    status: "To Cover"
  },

  // ==================== 4. OUTFIELD ====================
  {
    sectionName: "Outfield",
    category: "Footwork",
    title: "45-Degree Drop Step & Angle Pursuit",
    description: "Crossover drop step without backpedaling to track deep fly balls over head with explosive acceleration.",
    linkedDrillTitle: "45-Degree Crossover Drop Step Pursuit Drill",
    status: "To Cover"
  },
  {
    sectionName: "Outfield",
    category: "Communication",
    title: "I Got It! Loud Call & Priorities",
    description: "Call ball 3 times loudly; outfielder has absolute priority over infielders on shallow pop-ups.",
    linkedDrillTitle: "Outfield Communication & Pop-Fly Priority Drill",
    status: "To Cover"
  },
  {
    sectionName: "Outfield",
    category: "Throws",
    title: "Cutoff Alignment & Crow-Hop Throws",
    description: "Drive through the ball with strong crow-hop to hit cutoff man chest-high on a direct flat trajectory.",
    linkedDrillTitle: "Crow-Hop Trajectory Cutoff Throw Drill",
    status: "To Cover"
  },
  {
    sectionName: "Outfield",
    category: "Catching",
    title: "Catching on the Run Behind the Ball",
    description: "Position body slightly behind fly ball to create forward throwing momentum into the catch.",
    linkedDrillTitle: "Catching on the Run Behind-the-Ball Drill",
    status: "To Cover"
  },

  // ==================== 5. CATCHING ====================
  {
    sectionName: "Catching",
    category: "Stances",
    title: "Primary & Secondary Stance Transitions",
    description: "Low relaxed squat for solo pitches; raise hips 2 inches with runners on base for explosive footwork.",
    linkedDrillTitle: "Primary-to-Secondary Stance Transition Drill",
    status: "To Cover"
  },
  {
    sectionName: "Catching",
    category: "Receiving",
    title: "Quiet Glove & Borderline Pitch Framing",
    description: "Beat ball to the spot and work slightly inward toward strike zone center without jerking glove.",
    linkedDrillTitle: "Quiet-Hand Framing & Pitch Presentation Drill",
    status: "To Cover"
  },
  {
    sectionName: "Catching",
    category: "Blocking",
    title: "Dirt Ball 5-Hole Drop & Chest Angle",
    description: "Drop knees into dirt with glove plugging 5-hole and chest angled down to bounce ball in front.",
    linkedDrillTitle: "Dirt Ball 5-Hole Block & Recovery Drill",
    status: "To Cover"
  },
  {
    sectionName: "Catching",
    category: "Steals",
    title: "Pop Time Transfer & Throwdown to 2nd",
    description: "Drive right foot forward to replace left foot with quick ear exchange and crisp overhand release.",
    linkedDrillTitle: "Quick-Transfer Ear-Exchange Pop-Time Drill",
    status: "To Cover"
  },
  {
    sectionName: "Catching",
    category: "Plate Plays",
    title: "Plate Tag Plays & Home Protection",
    description: "Anchor in front of baseline and drop tag directly onto oncoming runner while protecting ball.",
    linkedDrillTitle: "Home Plate Tag & Baseline Block Drill",
    status: "To Cover"
  },

  // ==================== 6. BASE RUNNING ====================
  {
    sectionName: "Base Running",
    category: "Sprint",
    title: "Home to First Sprint & Breakdown",
    description: "Sprint at 100% through front edge of bag and execute athletic chop-step breakdown looking for overthrows.",
    linkedDrillTitle: "100% Home-to-First Sprint Breakdown Drill",
    status: "To Cover"
  },
  {
    sectionName: "Base Running",
    category: "Turns",
    title: "Banana Turn Route & Bag Corner Touch",
    description: "Bow out into foul territory before bag and slingshot off inside corner toward next base.",
    linkedDrillTitle: "Banana Route & Bag Corner Slingshot Drill",
    status: "To Cover"
  },
  {
    sectionName: "Base Running",
    category: "Leads",
    title: "Secondary Lead & Dirt Ball Reaction",
    description: "Take 2-3 aggressive shuffle steps on pitch release and advance instantly on balls in the dirt.",
    linkedDrillTitle: "Secondary Lead & Dirt Ball Advance Drill",
    status: "To Cover"
  },
  {
    sectionName: "Base Running",
    category: "Sliding",
    title: "Figure-Four Slide Technique",
    description: "Tuck lead leg under with hands in air and chin tucked to chest to avoid injury.",
    linkedDrillTitle: "Bent-Leg Figure-Four Sliding Drill",
    status: "To Cover"
  },

  // ==================== 7. TEAM DEFENSE ====================
  {
    sectionName: "Team Defense",
    category: "Backups",
    title: "Full Field Overthrow Backups",
    description: "Right field backs up 1st base; Left field backs up 3rd base; Pitcher backs up 2nd base on every play.",
    linkedDrillTitle: "Full-Field Backup Rotation Drill",
    status: "To Cover"
  },
  {
    sectionName: "Team Defense",
    category: "Relays",
    title: "Double Cutoff & Relay Positioning",
    description: "Middle infielders align in straight tandem between outfield thrower and target base.",
    linkedDrillTitle: "Double Cutoff & Relay Alignment Drill",
    status: "To Cover"
  },
  {
    sectionName: "Team Defense",
    category: "Bunt Defense",
    title: "Wheel Play & Bunt Coverage",
    description: "Corners charge while middle infielders rotate to cover bases on sacrifice and squeeze bunts.",
    linkedDrillTitle: "Corner-Charge Wheel Play Bunt Defense Drill",
    status: "To Cover"
  },
  {
    sectionName: "Team Defense",
    category: "Rundowns",
    title: "Pickle & Two-Throw Rundown Execution",
    description: "Close distance quickly, show high ball target, and tag runner out in two throws or fewer.",
    linkedDrillTitle: "Two-Throw Rundown Tag & Chase Drill",
    status: "To Cover"
  }
];

export const ALL_SECTIONS_SKILLS_CSV = `Section,Category,Skill Title,Description,Linked Drill,Status
Batting,Stance & Balance,Load & Coil Balance,Stay anchored on inside of rear foot with hands back at shoulder height and knob pointing toward catcher.,Rear-Hip Hinge & Load Tee Drill,To Cover
Batting,Launch Sequence,Trigger Step with Hands Back,Soft 2-3 inch forward stride with hands resisting forward movement to create elastic rubber-band tension.,Stride Separation & Elastic Tension Drill,To Cover
Batting,Swing Path,Palm-Up Palm-Down Contact,Drive top hand with palm facing upward and lead hand palm down through the contact point for maximum backspin.,Top Hand Extension & Impact Palm Drill,To Cover
Batting,Swing Path,Lead Hand Path & Inside-Out Swing,Keep hands tight inside the baseball to prevent casting or sweeping barrel around the hitting zone.,Lead Arm Inside-Out Fence Drill,To Cover
Batting,Approach,Two-Strike Battle Approach,Choke up 1 inch and widen stance to shorten swing and protect both edges of the plate.,Two-Strike Choke-Up Zone Contact Drill,To Cover
Batting,Bunting,Sacrifice & Push Bunting,Hold bat at top of strike zone and deaden softly down 1st or 3rd base foul line.,Targeted Line Sacrifice & Push Bunt Drill,To Cover
Batting,Finish,High Finish Over Front Shoulder,Complete hip rotation with chest expansion and balanced two-handed finish over lead shoulder.,Full Hip Rotation & High Finish Drill,To Cover
Pitching,Mechanics,Four-Seam Grip & Wrist Snap,Fingers positioned across horseshoes with thumb centered underneath for clean 12-to-6 true backspin.,Four-Seam Wrist Snap & Spin Drill,To Cover
Pitching,Lower Half,Lean & Hip Drift Momentum,Lead hip drifts 3-4 inches toward plate while knee is at peak balance driving linear momentum.,Hip Drift & Linear Momentum Pause Drill,To Cover
Pitching,Upper Body,Scarecrow / Power T Separation,Both elbows pinched back with thumbs down and ball facing away from target in high-cocked position.,Scarecrow T-Position Separation Drill,To Cover
Pitching,Delivery,Closed Shoulder until Foot Plant,Keep lead shoulder pointing directly at target until front foot strikes ground.,Front-Shoulder Lock & Foot-Plant Drill,To Cover
Pitching,Delivery,Land on Line with Firm Front Block,Front leg acts as a stiff braking wall to transfer 100% of lower body kinetic energy up into arm.,Firm Lead-Leg Block & Stride Line Drill,To Cover
Pitching,Extension,Chest Tilt & Towel Snap Follow Through,Upper torso tilts forward over front knee with arm snapping through out front.,Chest Tilt & Towel Snap Extension Drill,To Cover
Pitching,Pickoffs,Quick-Step Pickoff Move to 1st & 2nd,Fast foot pivot and direct 45-degree stride to bag without tipping shoulders.,Quick-Pivot 1st & 2nd Pickoff Drill,To Cover
Infield,Stance & Timing,Athletic Ready Position & Creep Hop,Split-step timing hop on pitcher release with chest over knees and weight on balls of feet.,Split-Step Creep Hop Timing Drill,To Cover
Infield,Footwork,Triangle Footwork & Glove Apex Presentation,Feet wide with glove presented out front forming an equilateral triangle with feet.,Triangle Glove Apex Footwork Drill,To Cover
Infield,Hands,Alligator Hands & Funnel to Belly,Dominant hand hovers over glove pocket to trap bounce and funnel softly into belly button.,Alligator Trap & Belly Funnel Drill,To Cover
Infield,Hands,Short Hop Pickups & Glove Push,Attack in-between short hops out front working from the ground upward with soft wrists.,Bottom-Up Short Hop Glove Push Drill,To Cover
Infield,Double Plays,6-4-3 / 4-6-3 Double Play Feeds & Pivots,Chest-high underhand flips and wrist flicks for seamless middle infield turns across 2nd base.,Double Play Underhand Feed & Pivot Drill,To Cover
Infield,Approach,Charging Slow Rollers with Momentum,Attack softly hit grounders on the run with barehand or glove scoop while maintaining balance.,Barehand & Scoop Slow Roller Charge Drill,To Cover
Infield,Positioning,First Base Stretch & Heel on Bag,Stretch toward incoming throw keeping back heel anchored to inside base edge without crossing baseline.,First Base Heel-Anchor Stretch Drill,To Cover
Outfield,Footwork,45-Degree Drop Step & Angle Pursuit,Crossover drop step without backpedaling to track deep fly balls over head with explosive acceleration.,45-Degree Crossover Drop Step Pursuit Drill,To Cover
Outfield,Communication,I Got It! Loud Call & Priorities,Call ball 3 times loudly; outfielder has absolute priority over infielders on shallow pop-ups.,Outfield Communication & Pop-Fly Priority Drill,To Cover
Outfield,Throws,Cutoff Alignment & Crow-Hop Throws,Drive through the ball with strong crow-hop to hit cutoff man chest-high on a direct flat trajectory.,Crow-Hop Trajectory Cutoff Throw Drill,To Cover
Outfield,Catching,Catching on the Run Behind the Ball,Position body slightly behind fly ball to create forward throwing momentum into the catch.,Catching on the Run Behind-the-Ball Drill,To Cover
Catching,Stances,Primary & Secondary Stance Transitions,Low relaxed squat for solo pitches; raise hips 2 inches with runners on base for explosive footwork.,Primary-to-Secondary Stance Transition Drill,To Cover
Catching,Receiving,Quiet Glove & Borderline Pitch Framing,Beat ball to the spot and work slightly inward toward strike zone center without jerking glove.,Quiet-Hand Framing & Pitch Presentation Drill,To Cover
Catching,Blocking,Dirt Ball 5-Hole Drop & Chest Angle,Drop knees into dirt with glove plugging 5-hole and chest angled down to bounce ball in front.,Dirt Ball 5-Hole Block & Recovery Drill,To Cover
Catching,Steals,Pop Time Transfer & Throwdown to 2nd,Drive right foot forward to replace left foot with quick ear exchange and crisp overhand release.,Quick-Transfer Ear-Exchange Pop-Time Drill,To Cover
Catching,Plate Plays,Plate Tag Plays & Home Protection,Anchor in front of baseline and drop tag directly onto oncoming runner while protecting ball.,Home Plate Tag & Baseline Block Drill,To Cover
Base Running,Sprint,Home to First Sprint & Breakdown,Sprint at 100% through front edge of bag and execute athletic chop-step breakdown looking for overthrows.,100% Home-to-First Sprint Breakdown Drill,To Cover
Base Running,Turns,Banana Turn Route & Bag Corner Touch,Bow out into foul territory before bag and slingshot off inside corner toward next base.,Banana Route & Bag Corner Slingshot Drill,To Cover
Base Running,Leads,Secondary Lead & Dirt Ball Reaction,Take 2-3 aggressive shuffle steps on pitch release and advance instantly on balls in the dirt.,Secondary Lead & Dirt Ball Advance Drill,To Cover
Base Running,Sliding,Figure-Four Slide Technique,Tuck lead leg under with hands in air and chin tucked to chest to avoid injury.,Bent-Leg Figure-Four Sliding Drill,To Cover
Team Defense,Backups,Full Field Overthrow Backups,Right field backs up 1st base; Left field backs up 3rd base; Pitcher backs up 2nd base on every play.,Full-Field Backup Rotation Drill,To Cover
Team Defense,Relays,Double Cutoff & Relay Positioning,Middle infielders align in straight tandem between outfield thrower and target base.,Double Cutoff & Relay Alignment Drill,To Cover
Team Defense,Bunt Defense,Wheel Play & Bunt Coverage,Corners charge while middle infielders rotate to cover bases on sacrifice and squeeze bunts.,Corner-Charge Wheel Play Bunt Defense Drill,To Cover
Team Defense,Rundowns,Pickle & Two-Throw Rundown Execution,"Close distance quickly, show high ball target, and tag runner out in two throws or fewer.",Two-Throw Rundown Tag & Chase Drill,To Cover`;
