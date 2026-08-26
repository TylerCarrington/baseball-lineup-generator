export interface StarterDrillData {
  category: string;
  title: string;
  summary: string;
  setup: string;
  steps: string;
  notes: string;
  youtubeUrl?: string;
}

export const ALL_CATEGORIES_STARTER_DRILLS: StarterDrillData[] = [
  // ==================== 1. BATTING & OFFENSE ====================
  {
    category: "Batting & Offense",
    title: "Rear-Hip Hinge & Load Tee Drill",
    summary: "Stay anchored on the inside of the rear foot with hands back at shoulder height and knob pointing toward catcher.",
    setup: "Place batting tee on front edge of home plate. Use standard bat and baseballs.",
    steps: "1. Assume athletic stance with feet slightly wider than shoulder-width.\n2. Hinge at the rear hip to load weight onto the inner back thigh while keeping hands quiet and high.\n3. Verify knob of bat points toward catcher's feet.\n4. Drive barrel through tee contact on a smooth plane.",
    notes: "Do not collapse onto the outside edge of the rear foot. Keep the core engaged.",
    youtubeUrl: "https://www.youtube.com/results?search_query=rear+hip+hinge+load+baseball+tee+drill"
  },
  {
    category: "Batting & Offense",
    title: "Stride Separation & Elastic Tension Drill",
    summary: "Execute a soft 2-3 inch forward stride with hands resisting forward movement to create elastic rubber-band tension.",
    setup: "Batting tee or soft toss station. Resistance band or visual stride marker optional.",
    steps: "1. Begin in balanced stance with 60/40 rear weight distribution.\n2. Initiate gentle 2-3 inch forward stride onto soft lead toe.\n3. Hold hands firmly back in slot to feel coil tension through front shoulder and torso.\n4. Uncoil hips explosively through contact.",
    notes: "Ensure the head stays centered between both feet during the stride rather than lunging forward.",
    youtubeUrl: "https://www.youtube.com/results?search_query=stride+separation+elastic+tension+hitting"
  },
  {
    category: "Batting & Offense",
    title: "Top Hand Extension & Impact Palm Drill",
    summary: "Drive top hand with palm facing upward and lead hand palm down through the contact point for maximum backspin.",
    setup: "Tee placed waist-high. Short one-hand training bat or standard bat.",
    steps: "1. Set up at contact point with top hand palm facing skyward and bottom hand palm facing ground.\n2. Drive through impact without rolling top wrist prematurely.\n3. Freeze on full two-arm extension in front of home plate.\n4. Repeat 10 reps focusing on pure backspin line drives.",
    notes: "Rolling wrists before contact leads to weak topspin ground balls. Keep palm up until extension.",
    youtubeUrl: "https://www.youtube.com/results?search_query=top+hand+palm+up+baseball+drill"
  },
  {
    category: "Batting & Offense",
    title: "Lead Arm Inside-Out Fence Drill",
    summary: "Keep hands tight inside the baseball to prevent casting or sweeping barrel around the hitting zone.",
    setup: "Stand with rear hip 12 inches away from a fence or net. Batting tee placed directly in front.",
    steps: "1. Take standard stance parallel to fence line.\n2. Swing through tee without allowing the barrel or hands to strike the fence behind you.\n3. Pull knob directly inside the ball's inner half.\n4. Drive baseball to opposite and middle fields.",
    notes: "Teaches a compact, efficient direct path and eliminates sweeping loop in the swing.",
    youtubeUrl: "https://www.youtube.com/results?search_query=fence+drill+inside+out+swing"
  },
  {
    category: "Batting & Offense",
    title: "Two-Strike Choke-Up Zone Contact Drill",
    summary: "Choke up 1 inch and widen stance to shorten swing and protect both edges of the plate.",
    setup: "Coach pitching front toss or live batting practice with randomized pitch locations.",
    steps: "1. Batter assumes two-strike approach: choke up 1-2 inches, widen base 2-3 inches, eliminate high leg kick.\n2. Track ball deep into the hitting zone.\n3. Shorten hand path and battle to foul off tough pitches and punch mistakes through gaps.\n4. Complete 10 two-strike pressure counts.",
    notes: "Mentality shifts from driving out of the park to hard contact and putting the ball in play.",
    youtubeUrl: "https://www.youtube.com/results?search_query=two+strike+hitting+approach+drill"
  },
  {
    category: "Batting & Offense",
    title: "Targeted Line Sacrifice & Push Bunting",
    summary: "Hold bat at top of strike zone and deaden softly down 1st or 3rd base foul line.",
    setup: "Home plate with target cones placed 15 feet down 1st and 3rd base lines.",
    steps: "1. Pivot or square early into bunting position.\n2. Hold bat at the top of the strike zone at a 45-degree angle with top hand at the trademark.\n3. Catch the ball on the wood and cushion softly toward target cones.\n4. Practice 5 bunts to 3B and 5 push bunts past charging pitcher toward 1B/2B.",
    notes: "Never reach for balls above the bat height. Lower body with knees to handle low pitches.",
    youtubeUrl: "https://www.youtube.com/results?search_query=sacrifice+bunting+targets+baseball"
  },
  {
    category: "Batting & Offense",
    title: "Full Hip Rotation & High Finish Drill",
    summary: "Complete hip rotation with chest expansion and balanced two-handed finish over lead shoulder.",
    setup: "Batting tee or live soft toss.",
    steps: "1. Initiate swing with back knee driving inward toward front instep.\n2. Rotate hips fully to face pitcher with belt buckle pointing directly at center field.\n3. Extend arms through contact and finish high with bat wrapped smoothly over front shoulder.\n4. Hold finish for 2 seconds to verify balance.",
    notes: "Check that the back heel is fully lifted off the ground ('squish the bug' / heel to sky).",
    youtubeUrl: "https://www.youtube.com/results?search_query=high+finish+hip+rotation+baseball"
  },

  // ==================== 2. PITCHING & THROWING ====================
  {
    category: "Pitching & Throwing",
    title: "Four-Seam Wrist Snap & Spin Drill",
    summary: "Fingers positioned across horseshoes with thumb centered underneath for clean 12-to-6 true backspin.",
    setup: "Pitchers work in pairs seated or kneeling 15 feet apart.",
    steps: "1. Grip baseball across the wide four-seam seams with fingertip pads on the stitches.\n2. Support elbow with glove hand and isolate forearm and wrist.\n3. Snap wrist downward to propel ball with true 12-to-6 backspin to partner.\n4. Observe rotation seam orientation in flight.",
    notes: "Avoid sliding thumb up the side of the ball which creates sideways cut spin.",
    youtubeUrl: "https://www.youtube.com/results?search_query=four+seam+wrist+snap+pitching"
  },
  {
    category: "Pitching & Throwing",
    title: "Hip Drift & Linear Momentum Pause Drill",
    summary: "Lead hip drifts 3-4 inches toward plate while knee is at peak balance driving linear momentum.",
    setup: "Pitching mound or flat ground rubber line.",
    steps: "1. Come to balance point with lead knee lifted chest-high.\n2. Allow lead hip to initiate forward drift toward home plate while staying closed.\n3. Pause briefly at drift initiation to feel back glute load.\n4. Explode down the mound into stride.",
    notes: "Do not open lead hip prematurely; drift with the side of the hip leading the way.",
    youtubeUrl: "https://www.youtube.com/results?search_query=hip+drift+linear+momentum+pitching"
  },
  {
    category: "Pitching & Throwing",
    title: "Scarecrow T-Position Separation Drill",
    summary: "Both elbows pinched back with thumbs down and ball facing away from target in high-cocked position.",
    setup: "Flat ground throw station at 45 feet.",
    steps: "1. Begin in wide stride stance.\n2. Break hands down and bring elbows up to shoulder level in a strong power 'T' / scarecrow pose.\n3. Check thumbs down, ball facing centerfield.\n4. Rotate torso and deliver throw into target.",
    notes: "Prevents inverted-W and promotes smooth, synchronized arm action.",
    youtubeUrl: "https://www.youtube.com/results?search_query=scarecrow+power+t+separation+pitching"
  },
  {
    category: "Pitching & Throwing",
    title: "Front-Shoulder Lock & Foot-Plant Drill",
    summary: "Keep lead shoulder pointing directly at target until front foot strikes ground.",
    setup: "Target net or catcher at 60 feet 6 inches.",
    steps: "1. Pitcher moves through windup or stretch delivery.\n2. Keep lead glove and shoulder tucked and locked toward catcher until front foot lands firmly.\n3. Feel torso twist and whip arm through release only after foot strike.",
    notes: "Opening front shoulder early causes pitches to miss high and arm to drag behind.",
    youtubeUrl: "https://www.youtube.com/results?search_query=front+shoulder+lock+foot+plant+pitching"
  },
  {
    category: "Pitching & Throwing",
    title: "Firm Lead-Leg Block & Stride Line Drill",
    summary: "Front leg acts as a stiff braking wall to transfer 100% of lower body kinetic energy up into arm.",
    setup: "Draw chalk line from pitching rubber to center of home plate.",
    steps: "1. Pitcher delivers pitch landing front heel directly on the chalk line.\n2. At foot strike, firmly post and extend lead knee backwards to create a stiff braking lever.\n3. Torso vaults over firm front leg through release.",
    notes: "Collapsing or bending the lead knee absorbs kinetic energy and reduces velocity.",
    youtubeUrl: "https://www.youtube.com/results?search_query=lead+leg+block+pitching+drill"
  },
  {
    category: "Pitching & Throwing",
    title: "Chest Tilt & Towel Snap Extension Drill",
    summary: "Upper torso tilts forward over front knee with arm snapping through out front.",
    setup: "Pitcher holds a 14-inch towel between index and middle fingers. Partner holds glove target.",
    steps: "1. Pitcher goes through full stride motion.\n2. Tilt chest over lead knee and whip towel to snap loudly against partner's target glove out front.\n3. Follow through cleanly with arm swinging across opposite hip.",
    notes: "Great warm-up and mechanics builder without arm fatigue.",
    youtubeUrl: "https://www.youtube.com/results?search_query=pitching+towel+snap+extension+drill"
  },
  {
    category: "Pitching & Throwing",
    title: "Quick-Pivot 1st & 2nd Pickoff Drill",
    summary: "Fast foot pivot and direct 45-degree stride to bag without tipping shoulders.",
    setup: "Pitching rubber with fielders stationed at 1st and 2nd bases.",
    steps: "1. Pitcher comes set in stretch position.\n2. Pivot rear foot on rubber while quickly gaining ground toward 1st base.\n3. Deliver chest-high throw to first baseman's glove tag area.\n4. Practice jump turn and inside-move pickoffs to 2nd base.",
    notes: "Ensure the stride foot clearly crosses the 45-degree line toward the base to avoid balks.",
    youtubeUrl: "https://www.youtube.com/results?search_query=pickoff+move+to+first+baseball+drill"
  },

  // ==================== 3. INFIELD DEFENSE ====================
  {
    category: "Infield & Ground Balls",
    title: "Split-Step Creep Hop Timing Drill",
    summary: "Split-step timing hop on pitcher release with chest over knees and weight on balls of feet.",
    setup: "Infielders stationed at their defensive spots. Coach mimics pitcher delivery at plate.",
    steps: "1. As pitcher begins leg lift, infielder takes 2 slow creep steps forward.\n2. As pitcher releases baseball, execute a soft split-step timing hop.\n3. Land with feet wide, chest over knees, and weight on balls of feet ready to explode in any direction.",
    notes: "Synchronizes defensive readiness with pitch contact.",
    youtubeUrl: "https://www.youtube.com/results?search_query=infield+split+step+creep+hop+drill"
  },
  {
    category: "Infield & Ground Balls",
    title: "Triangle Glove Apex Footwork Drill",
    summary: "Feet wide with glove presented out front forming an equilateral triangle with feet.",
    setup: "Fielders in ready stance with chalk triangle drawn on dirt.",
    steps: "1. Approach ground ball rhythmically with right-left foot pattern.\n2. Field with feet wider than shoulders and glove placed at the forward apex of the triangle.\n3. Maintain flat back and keep eyes behind the glove.",
    notes: "Fielding deep between the heels leads to balls bouncing off the chest.",
    youtubeUrl: "https://www.youtube.com/results?search_query=triangle+footwork+infield+fielding"
  },
  {
    category: "Infield & Ground Balls",
    title: "Alligator Trap & Belly Funnel Drill",
    summary: "Dominant hand hovers over glove pocket to trap bounce and funnel softly into belly button.",
    setup: "Infield line receiving rolling ground balls from coach 30 feet away.",
    steps: "1. Field ball at apex of triangle with soft hands.\n2. Hover throwing hand over top of glove in 'alligator' formation to secure the ball.\n3. Cushion and funnel both hands smoothly into the belly button.\n4. Separate hands into four-seam throwing grip at chest.",
    notes: "Soft hands absorb impact and create consistent exchange mechanics.",
    youtubeUrl: "https://www.youtube.com/results?search_query=alligator+hands+infield+funnel"
  },
  {
    category: "Infield & Ground Balls",
    title: "Bottom-Up Short Hop Glove Push Drill",
    summary: "Attack in-between short hops out front working from the ground upward with soft wrists.",
    setup: "Partners kneeling 10 feet apart on dirt with foam or flat training gloves.",
    steps: "1. Partner throws firm short hop bounce into dirt 1-2 feet in front of fielder.\n2. Fielder presents glove in dirt and pushes softly through the ball from bottom to top.\n3. Catch ball right after the bounce with fingers pointed down.",
    notes: "Never stab down at a short hop from above; always work upward from the ground.",
    youtubeUrl: "https://www.youtube.com/results?search_query=short+hop+infield+drill"
  },
  {
    category: "Infield & Ground Balls",
    title: "Double Play Underhand Feed & Pivot Drill",
    summary: "Chest-high underhand flips and wrist flicks for seamless middle infield turns across 2nd base.",
    setup: "Shortstop and second baseman stationed at double play depth around 2nd base bag.",
    steps: "1. SS fields grounder and delivers stiff-wrist underhand flip to 2B chest.\n2. 2B touches bag corner, plants, and fires accurate throw to 1B.\n3. Practice 4-6-3 turn with 2B backhand flip to SS.\n4. Complete 15 clean double play turns.",
    notes: "Keep flip waist/chest high without floating or spinning the ball.",
    youtubeUrl: "https://www.youtube.com/results?search_query=double+play+feeds+and+pivots+baseball"
  },
  {
    category: "Infield & Ground Balls",
    title: "Barehand & Scoop Slow Roller Charge Drill",
    summary: "Attack softly hit grounders on the run with barehand or glove scoop while maintaining balance.",
    setup: "Third basemen and shortstops lined up at normal depth. Coach rolls slow bouncers down the line.",
    steps: "1. Charge aggressively at 100% sprint in a low athletic posture.\n2. For slow rolling balls: field with bare hand off the right foot and deliver running throw to 1B.\n3. For bouncing balls: scoop with glove off left foot.\n4. Maintain forward momentum through release.",
    notes: "Field ball on the outside of the foot for clean throwing alignment.",
    youtubeUrl: "https://www.youtube.com/results?search_query=slow+roller+barehand+charge+infield"
  },
  {
    category: "Infield & Ground Balls",
    title: "First Base Heel-Anchor Stretch Drill",
    summary: "Stretch toward incoming throw keeping back heel anchored to inside base edge without crossing baseline.",
    setup: "First basemen on bag. Infielders throw from SS, 3B, and 2B positions.",
    steps: "1. 1B sets up with both heels touching inside edge of 1st base bag.\n2. Read incoming throw flight.\n3. Stretch lead leg directly toward the ball, keeping heel anchored to bag corner.\n4. Snatch ball with two hands and pull away from oncoming runner.",
    notes: "Do not commit to stretch too early before reading the ball's true flight path.",
    youtubeUrl: "https://www.youtube.com/results?search_query=first+base+stretch+footwork+drill"
  },

  // ==================== 4. OUTFIELD DEFENSE ====================
  {
    category: "Outfield & Fly Balls",
    title: "45-Degree Crossover Drop Step Pursuit Drill",
    summary: "Crossover drop step without backpedaling to track deep fly balls over head with explosive acceleration.",
    setup: "Outfielders stationed in grass 40 feet in front of coach.",
    steps: "1. Coach points right or left and calls 'Go!'.\n2. Outfielder immediately drops deep foot at 45-degree angle, crosses lead foot over, and accelerates back.\n3. Never backpedal on heels.\n4. Coach throws deep fly ball to test tracking at top speed.",
    notes: "Keep eyes level without head bobbing during pursuit.",
    youtubeUrl: "https://www.youtube.com/results?search_query=outfield+drop+step+crossover+drill"
  },
  {
    category: "Outfield & Fly Balls",
    title: "Outfield Communication & Pop-Fly Priority Drill",
    summary: "Call ball 3 times loudly; outfielder has absolute priority over infielders on shallow pop-ups.",
    setup: "Infielders and outfielders on field. Coach hits high pop-ups in the shallow outfield triangle.",
    steps: "1. Both fielders sprint toward ball.\n2. Outfielder calls 'Ball! Ball! Ball!' or 'I got it! I got it!'.\n3. Infielders yield immediately upon hearing outfielder's call.\n4. Non-fielding player points to ball and provides voice direction.",
    notes: "Outfielder coming in always has priority over infielder going out.",
    youtubeUrl: "https://www.youtube.com/results?search_query=outfield+communication+priority+drill"
  },
  {
    category: "Outfield & Fly Balls",
    title: "Crow-Hop Trajectory Cutoff Throw Drill",
    summary: "Drive through the ball with strong crow-hop to hit cutoff man chest-high on a direct flat trajectory.",
    setup: "Outfielders in deep right/center field. Cutoff infielder aligned at intermediate distance.",
    steps: "1. Outfielder fields ground ball or catches fly ball with forward momentum.\n2. Execute athletic crow-hop: back foot replaces front foot with explosive hop.\n3. Fire low, flat, two-seam throw directly at cutoff man's chest or head.\n4. Target hits cutoff on no more than 1 short hop.",
    notes: "High rainbow throws allow baserunners extra bases; keep throws on a crisp line.",
    youtubeUrl: "https://www.youtube.com/results?search_query=outfield+crow+hop+throw+drill"
  },
  {
    category: "Outfield & Fly Balls",
    title: "Catching on the Run Behind-the-Ball Drill",
    summary: "Position body slightly behind fly ball to create forward throwing momentum into the catch.",
    setup: "Outfielders catching fungo fly balls.",
    steps: "1. Track fly ball to drop location and arrive 1-2 steps early.\n2. Set up 2 steps behind the descending ball.\n3. Catch ball on glove side shoulder while taking aggressive forward steps toward target base.\n4. Seamlessly transition into crow-hop throw.",
    notes: "Catching ball flat-footed or leaning backward ruins throw power.",
    youtubeUrl: "https://www.youtube.com/results?search_query=catching+fly+ball+behind+ball+momentum"
  },

  // ==================== 5. CATCHING ====================
  {
    category: "Catching & Receiving",
    title: "Primary-to-Secondary Stance Transition Drill",
    summary: "Low relaxed squat for solo pitches; raise hips 2 inches with runners on base for explosive footwork.",
    setup: "Home plate with catcher in full gear. Pitcher delivering pitches.",
    steps: "1. Primary stance (no runners on base): low, relaxed squat, glove target presented low, bare hand protected behind back.\n2. Secondary stance (runners on base / 2 strikes): lift rear end 2 inches, widen feet, bring throwing hand behind glove.\n3. Practice quick transitions as coach calls base runner states.",
    notes: "Secondary stance must allow instant lateral blocking or explosive footwork for throwdowns.",
    youtubeUrl: "https://www.youtube.com/results?search_query=catcher+primary+secondary+stance+drill"
  },
  {
    category: "Catching & Receiving",
    title: "Quiet-Hand Framing & Pitch Presentation Drill",
    summary: "Beat ball to the spot and work slightly inward toward strike zone center without jerking glove.",
    setup: "Catcher receiving machine or coach fast toss at 30 feet.",
    steps: "1. Present steady target in strike zone.\n2. On pitch flight: beat ball to the spot with glove.\n3. Stick borderline pitch firmly with subtle 1-inch roll toward strike zone center.\n4. Hold target for umpire view for 1 full second without snapping or jerking.",
    notes: "Subtle framing wins strikes; wild glove movement alerts umpire to miss.",
    youtubeUrl: "https://www.youtube.com/results?search_query=catcher+framing+receiving+quiet+glove"
  },
  {
    category: "Catching & Receiving",
    title: "Dirt Ball 5-Hole Block & Recovery Drill",
    summary: "Drop knees into dirt with glove plugging 5-hole and chest angled down to bounce ball in front.",
    setup: "Catcher in secondary stance. Coach throws rubber balls into dirt 3-5 feet in front of plate.",
    steps: "1. On dirt pitch read: drop both knees simultaneously into dirt.\n2. Place glove face-up in the '5-hole' between knees with thumb touching dirt.\n3. Round shoulders and tuck chin to angle chest protector forward.\n4. Bounce ball 2-3 feet in front and pop up quickly to throw.",
    notes: "Chest angle ensures balls bounce softly back into view rather than ricocheting away.",
    youtubeUrl: "https://www.youtube.com/results?search_query=catcher+blocking+dirt+ball+drill"
  },
  {
    category: "Catching & Receiving",
    title: "Quick-Transfer Ear-Exchange Pop-Time Drill",
    summary: "Drive right foot forward to replace left foot with quick ear exchange and crisp overhand release.",
    setup: "Catcher at plate. Baserunner running to 2nd base. Target net at 2nd base.",
    steps: "1. Receive pitch in secondary stance.\n2. Drive right foot forward to replace left foot position.\n3. Bring ball directly from glove to right ear with short compact arm circle.\n4. Fire direct, low bullet throw to second base tag spot.\n5. Time total pop time from glove hit to 2B arrival.",
    notes: "Keep chest low through the throw; standing straight up wastes critical tenths of a second.",
    youtubeUrl: "https://www.youtube.com/results?search_query=catcher+pop+time+throwdown+to+second"
  },
  {
    category: "Catching & Receiving",
    title: "Home Plate Tag & Baseline Block Drill",
    summary: "Anchor in front of baseline and drop tag directly onto oncoming runner while protecting ball.",
    setup: "Home plate with catcher in gear. Baserunner sliding from 3rd base.",
    steps: "1. Receive incoming throw in front of the home plate baseline.\n2. Secure baseball firmly inside glove with bare hand wrapping pocket.\n3. Drop both knees to block path to plate and hold tag firmly on runner's lead foot.\n4. Show ball clearly to umpire after tag.",
    notes: "Never block plate without possession of the ball in accordance with safety rules.",
    youtubeUrl: "https://www.youtube.com/results?search_query=catcher+home+plate+tag+play"
  },

  // ==================== 6. BASE RUNNING ====================
  {
    category: "Base Running & Agility",
    title: "100% Home-to-First Sprint Breakdown Drill",
    summary: "Sprint at 100% through front edge of bag and execute athletic chop-step breakdown looking for overthrows.",
    setup: "Batters at home plate with stopwatch. First base bag on field.",
    steps: "1. Batter simulates swing and sprints at 100% effort toward 1st base.\n2. Touch front corner of the 1st base bag in stride.\n3. Execute 3 quick chop-steps to break down speed in foul territory.\n4. Look over right shoulder immediately for errant overthrows.\n5. Record baseline time under 4.3 seconds.",
    notes: "Never jump or lunge at 1st base; run through it smoothly at full stride.",
    youtubeUrl: "https://www.youtube.com/results?search_query=home+to+first+sprint+breakdown+baseball"
  },
  {
    category: "Base Running & Agility",
    title: "Banana Route & Bag Corner Slingshot Drill",
    summary: "Bow out into foul territory before bag and slingshot off inside corner toward next base.",
    setup: "Home to 2nd base running route with cones creating banana arc.",
    steps: "1. Sprint toward 1st base on extra-base hit.\n2. Bow out 3-4 feet into foul territory 15 feet before 1st base.\n3. Hit the inside corner of 1st base with left or right foot.\n4. Slingshot torso at a 45-degree angle directly in a straight line toward 2nd base.",
    notes: "Rounding wide after the bag wastes 3-5 steps; curve early before touching bag.",
    youtubeUrl: "https://www.youtube.com/results?search_query=banana+route+rounding+bases+baseball"
  },
  {
    category: "Base Running & Agility",
    title: "Secondary Lead & Dirt Ball Advance Drill",
    summary: "Take 2-3 aggressive shuffle steps on pitch release and advance instantly on balls in the dirt.",
    setup: "Baserunners on 1st and 2nd base. Pitcher delivering to catcher with occasional dirt balls.",
    steps: "1. Take standard primary lead (3 steps and a dive).\n2. As pitcher releases ball, take 2 aggressive shuffle steps forward.\n3. Land on balls of feet as ball crosses plate: read pitch in dirt or caught.\n4. On ball in dirt: explode instantly to next base without waiting.",
    notes: "Aggressive secondary leads create extra bases on wild pitches and passed balls.",
    youtubeUrl: "https://www.youtube.com/results?search_query=secondary+lead+dirt+ball+read+baseball"
  },
  {
    category: "Base Running & Agility",
    title: "Bent-Leg Figure-Four Sliding Drill",
    summary: "Tuck lead leg under with hands in air and chin tucked to chest to avoid injury.",
    setup: "Sliding mat or wet grass with socks/cleats off.",
    steps: "1. Sprint toward target bag.\n2. 5 feet before bag: tuck one leg under the other to form a figure-4 shape.\n3. Keep hands high in the air and chin tucked firmly into chest.\n4. Slide on back of thighs and buttocks into the base.\n5. Practice pop-up slide into base.",
    notes: "Never slide with fingers touching ground or knees slamming down first.",
    youtubeUrl: "https://www.youtube.com/results?search_query=figure+four+sliding+drill+baseball"
  },

  // ==================== 7. TEAM DEFENSE & SITUATIONS ====================
  {
    category: "Team Defense & Situations",
    title: "Full-Field Backup Rotation Drill",
    summary: "Right field backs up 1st base; Left field backs up 3rd base; Pitcher backs up 2nd base on every play.",
    setup: "Full defense on the field. Coach hits balls to various fielders with live throws.",
    steps: "1. On throw to 1B: RF sprints behind 1B foul line; Catcher trails runner down baseline.\n2. On throw to 3B: LF sprints behind 3B bag; Pitcher backs up 3B.\n3. On throw to 2B: CF and Pitcher rotate behind 2B.\n4. Coach throws wild balls to verify backup positioning.",
    notes: "Every player must move on every single play; no spectators on defense.",
    youtubeUrl: "https://www.youtube.com/results?search_query=baseball+defensive+backup+responsibilities"
  },
  {
    category: "Team Defense & Situations",
    title: "Double Cutoff & Relay Alignment Drill",
    summary: "Middle infielders align in straight tandem between outfield thrower and target base.",
    setup: "Full defense. Coach hits balls to deep outfield gaps.",
    steps: "1. Outfielder chases ball in deep gap.\n2. SS and 2B form straight tandem relay 30 feet apart aligned directly with home plate or 3B.\n3. Trailing infielder shouts 'Cut Home!' or 'Cut 3!' to direct throw.\n4. Relay executes clean catch and four-seam throw to plate.",
    notes: "Relay men must raise both hands high to create a clear visual target for outfielders.",
    youtubeUrl: "https://www.youtube.com/results?search_query=double+cutoff+and+relay+baseball"
  },
  {
    category: "Team Defense & Situations",
    title: "Corner-Charge Wheel Play Bunt Defense Drill",
    summary: "Corners charge while middle infielders rotate to cover bases on sacrifice and squeeze bunts.",
    setup: "Defense on field with runners on 1st & 2nd base. Batter bunts live.",
    steps: "1. On pitch release: 1B and 3B charge aggressively toward home plate.\n2. SS rotates to cover 2nd base; 2B rotates to cover 1st base.\n3. Catcher calls target base ('One!', 'Two!', 'Three!') based on bunt location.\n4. Fielder fields with barehand/glove and makes firm throw.",
    notes: "Clear communication from catcher prevents two fielders throwing to different bases.",
    youtubeUrl: "https://www.youtube.com/results?search_query=wheel+play+bunt+defense+baseball"
  },
  {
    category: "Team Defense & Situations",
    title: "Two-Throw Rundown Tag & Chase Drill",
    summary: "Close distance quickly, show high ball target, and tag runner out in two throws or fewer.",
    setup: "Fielders stationed at 1st and 2nd bases with a trapped baserunner in between.",
    steps: "1. Fielder with ball runs at full speed directly at baserunner to force commitment.\n2. Hold ball high out of glove to give partner clear visual target.\n3. When runner commits, deliver crisp chest throw to partner inside 10 feet.\n4. Tag runner out in 2 throws or fewer to avoid errors.",
    notes: "Runners should always be driven back toward the previous base, never toward next base.",
    youtubeUrl: "https://www.youtube.com/results?search_query=rundown+pickle+baseball+drill+two+throws"
  }
];

export function generateAllCategoriesCSV(): string {
  const headers = ['Category', 'Drill Title', 'Summary', 'Video URL', 'Setup', 'Steps', 'Notes'];
  const rows = ALL_CATEGORIES_STARTER_DRILLS.map(drill => {
    const escapeCSV = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
    return [
      escapeCSV(drill.category),
      escapeCSV(drill.title),
      escapeCSV(drill.summary),
      escapeCSV(drill.youtubeUrl || ''),
      escapeCSV(drill.setup),
      escapeCSV(drill.steps),
      escapeCSV(drill.notes)
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export const ALL_CATEGORIES_DRILLS_CSV = generateAllCategoriesCSV();
