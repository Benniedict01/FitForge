import type { BodyPart, Equipment, ExerciseDefinition, Experience } from "./schema";

type Muscle = Exclude<BodyPart, "Full Body">;
type Pattern = ExerciseDefinition["pattern"];
const catalog: ExerciseDefinition[] = [];
function add(
  id: string,
  name: string,
  muscles: Muscle[],
  equipment: Equipment,
  difficulty: Experience,
  pattern: Pattern,
  instructions: string[],
  mode?: ExerciseDefinition["mode"],
) {
  catalog.push({ id, name, muscles, equipment, difficulty, pattern, instructions, mode });
}

// BODYWEIGHT — no bench, pull-up bar, chair, towel, or other hidden equipment.
add("bw-push-up", "Push-up", ["Chest", "Triceps"], "Bodyweight", "Intermediate", "push", [
  "Set your hands slightly wider than your shoulders and brace your torso.",
  "Lower your chest with your elbows at roughly 45 degrees, then press the floor away.",
  "Keep a straight line from head to heels. Use the knee variation if form breaks.",
]);
add("bw-knee-push-up", "Knee push-up", ["Chest", "Triceps"], "Bodyweight", "Beginner", "push", [
  "Start on your knees with your hands just wider than shoulder-width.",
  "Keep your hips in line with your shoulders as you lower your chest.",
  "Press up smoothly without locking your elbows forcefully.",
]);
add("bw-wall-push-up", "Wall push-up", ["Chest", "Triceps"], "Bodyweight", "Beginner", "push", [
  "Place your palms on a stable wall at shoulder height and step back slightly.",
  "Bend your elbows to bring your chest toward the wall.",
  "Push away with a braced torso. Move closer to the wall to make it easier.",
]);
add(
  "bw-push-up-hold",
  "Bottom push-up hold",
  ["Chest", "Triceps"],
  "Bodyweight",
  "Advanced",
  "push",
  [
    "Lower into a push-up until your chest is just above the floor.",
    "Hold a rigid body line while breathing steadily.",
    "Use your knees or stop the hold if your lower back sags.",
  ],
  "time",
);
add("bw-prone-pull", "Prone lat pull-down", ["Back"], "Bodyweight", "Beginner", "pull", [
  "Lie face down with your arms extended overhead and your forehead hovering comfortably.",
  "Draw your elbows toward your ribs, squeezing your back without lifting your chest high.",
  "Reach forward slowly. Keep your neck neutral throughout.",
]);
add(
  "bw-reverse-snow-angel",
  "Reverse snow angel",
  ["Back", "Shoulders"],
  "Bodyweight",
  "Beginner",
  "pull",
  [
    "Lie face down with your arms beside your hips and palms facing down.",
    "Hover your hands slightly and sweep your arms toward overhead through a comfortable range.",
    "Return slowly while keeping your ribs and hips grounded.",
  ],
);
add("bw-prone-w", "Prone W raise", ["Back", "Shoulders"], "Bodyweight", "Beginner", "pull", [
  "Lie face down and bend your elbows to form a W with your arms.",
  "Gently draw your shoulder blades together and lift your hands a little.",
  "Pause, then lower without shrugging or arching your lower back.",
]);
add(
  "bw-back-extension",
  "Gentle prone back extension",
  ["Back", "Glutes"],
  "Bodyweight",
  "Beginner",
  "hinge",
  [
    "Lie on your stomach with your hands by your sides and feet grounded.",
    "Lift your upper chest only a few centimetres while looking down.",
    "Lower with control. Do not force your spine into a deep arch.",
  ],
);
add(
  "bw-pike-push-up",
  "Pike push-up",
  ["Shoulders", "Triceps"],
  "Bodyweight",
  "Intermediate",
  "push",
  [
    "Start in an inverted V with your hips high and palms shoulder-width apart.",
    "Bend your elbows and lower your head toward the space just ahead of your hands.",
    "Press back up, keeping pressure through your palms and a pain-free shoulder range.",
  ],
);
add(
  "bw-shoulder-tap",
  "Kneeling shoulder tap",
  ["Shoulders", "Abs/Core"],
  "Bodyweight",
  "Beginner",
  "core",
  [
    "Start on hands and knees and brace your abdomen.",
    "Lift one hand to tap the opposite shoulder without rotating your hips.",
    "Alternate sides slowly. One tap on each side is one rep.",
  ],
);
add(
  "bw-arm-circle",
  "Controlled arm circle",
  ["Shoulders"],
  "Bodyweight",
  "Beginner",
  "isolation",
  [
    "Stand tall and hold your arms out to your sides at shoulder height.",
    "Make small, controlled circles, switching direction halfway through.",
    "Keep your shoulders away from your ears and shorten the set if you feel pinching.",
  ],
  "time",
);
add(
  "bw-self-curl",
  "Self-resisted biceps curl",
  ["Biceps"],
  "Bodyweight",
  "Beginner",
  "isolation",
  [
    "Place one palm on the wrist of your other arm, with the working elbow by your side.",
    "Curl the working hand up while the opposite palm provides gentle resistance.",
    "Lower slowly against that same resistance, then switch arms.",
  ],
  "side",
);
add(
  "bw-curl-hold",
  "Self-resisted curl hold",
  ["Biceps"],
  "Bodyweight",
  "Beginner",
  "isolation",
  [
    "Bend one elbow to 90 degrees, palm up, and place your opposite hand on that wrist.",
    "Gently push down as the bent arm resists without moving.",
    "Breathe normally. Split the timed hold evenly between arms.",
  ],
  "time",
);
add(
  "bw-slow-curl",
  "Slow self-resisted hammer curl",
  ["Biceps"],
  "Bodyweight",
  "Beginner",
  "isolation",
  [
    "Keep the working thumb pointing up and the elbow tucked beside your ribs.",
    "Use your opposite palm to gently resist the wrist as you curl.",
    "Take three seconds up and three seconds down. Repeat on the other arm.",
  ],
  "side",
);
add("bw-wall-triceps", "Wall triceps extension", ["Triceps"], "Bodyweight", "Beginner", "push", [
  "Face a stable wall and place your palms at eye level, close to shoulder-width.",
  "Bend at the elbows to bring your forearms toward the wall while keeping your body straight.",
  "Straighten your arms to press away. Stand closer to reduce the challenge.",
]);
add(
  "bw-close-knee",
  "Close-grip knee push-up",
  ["Triceps", "Chest"],
  "Bodyweight",
  "Beginner",
  "push",
  [
    "Set your knees on the floor with your palms under your shoulders.",
    "Keep your elbows close to your ribs as you lower your torso.",
    "Press up smoothly, keeping your shoulders and hips in one line.",
  ],
);
add("bw-diamond", "Close-grip push-up", ["Triceps", "Chest"], "Bodyweight", "Advanced", "push", [
  "Take a plank position with your hands slightly inside shoulder-width.",
  "Lower with your elbows tucked and wrists comfortable.",
  "Press the floor away without letting your hips sag. Use the knee variation as needed.",
]);
add("bw-squat", "Bodyweight squat", ["Legs", "Glutes"], "Bodyweight", "Beginner", "squat", [
  "Stand with your feet about shoulder-width and toes turned slightly out.",
  "Sit down between your hips, keeping your heels grounded and knees tracking over your toes.",
  "Drive through your whole foot to stand. Use a depth you can control.",
]);
add(
  "bw-reverse-lunge",
  "Reverse lunge",
  ["Legs", "Glutes"],
  "Bodyweight",
  "Beginner",
  "squat",
  [
    "Stand tall and take a controlled step backward.",
    "Lower both knees through a comfortable range while keeping your front heel down.",
    "Press through the front foot to return, then repeat on the other side.",
  ],
  "side",
);
add(
  "bw-split-squat",
  "Split squat",
  ["Legs", "Glutes"],
  "Bodyweight",
  "Beginner",
  "squat",
  [
    "Set your feet in a staggered stance with enough width to balance.",
    "Lower your back knee toward the floor while keeping your torso tall.",
    "Push through the front foot to rise. Finish the reps before switching sides.",
  ],
  "side",
);
add("bw-calf-raise", "Standing calf raise", ["Legs"], "Bodyweight", "Beginner", "isolation", [
  "Stand with your feet hip-width on level ground.",
  "Rise onto the balls of your feet without rolling your ankles outward.",
  "Pause at the top and lower your heels slowly.",
]);
add("bw-bridge", "Glute bridge", ["Glutes"], "Bodyweight", "Beginner", "hinge", [
  "Lie on your back with your knees bent and feet flat, close to your hips.",
  "Exhale and drive through your heels to lift your hips.",
  "Squeeze your glutes without arching your back, then lower slowly.",
]);
add(
  "bw-single-bridge",
  "Single-leg glute bridge",
  ["Glutes"],
  "Bodyweight",
  "Intermediate",
  "hinge",
  [
    "Lie on your back, plant one foot, and lift the other knee toward your chest.",
    "Press through the planted heel to raise your hips while keeping your pelvis level.",
    "Lower smoothly and complete both sides.",
  ],
  "side",
);
add(
  "bw-side-raise",
  "Side-lying leg raise",
  ["Glutes"],
  "Bodyweight",
  "Beginner",
  "isolation",
  [
    "Lie on your side with your legs straight and hips stacked.",
    "Lift the top leg a short distance without turning your toes toward the ceiling.",
    "Lower slowly and repeat on both sides.",
  ],
  "side",
);
add(
  "bw-dead-bug",
  "Dead bug",
  ["Abs/Core"],
  "Bodyweight",
  "Beginner",
  "core",
  [
    "Lie on your back with your arms up and knees bent at 90 degrees.",
    "Exhale and slowly lower your opposite arm and leg while keeping your lower back comfortable against the floor.",
    "Return and alternate sides. Shorten the reach if your back arches.",
  ],
  "side",
);
add(
  "bw-plank",
  "Forearm plank",
  ["Abs/Core"],
  "Bodyweight",
  "Beginner",
  "core",
  [
    "Place your elbows below your shoulders and extend your legs behind you.",
    "Brace your abdomen and glutes while keeping your body in a straight line.",
    "Breathe steadily. Drop your knees if you cannot keep the position.",
  ],
  "time",
);
add(
  "bw-bird-dog",
  "Bird dog",
  ["Abs/Core", "Back"],
  "Bodyweight",
  "Beginner",
  "core",
  [
    "Begin on your hands and knees with a neutral spine.",
    "Reach one arm and the opposite leg away without rotating your pelvis.",
    "Pause, return, and alternate sides with slow control.",
  ],
  "side",
);
add(
  "bw-side-plank",
  "Side plank",
  ["Abs/Core"],
  "Bodyweight",
  "Intermediate",
  "core",
  [
    "Lie on your side and place your elbow directly under your shoulder.",
    "Lift your hips so your body forms a straight line. Bend your knees to make it easier.",
    "Keep breathing and split the hold evenly between sides.",
  ],
  "time",
);
add("bw-reverse-crunch", "Reverse crunch", ["Abs/Core"], "Bodyweight", "Beginner", "core", [
  "Lie on your back with your knees bent and arms by your sides.",
  "Exhale and gently curl your pelvis so your hips lift a little from the floor.",
  "Lower slowly without swinging your legs or pulling on your neck.",
]);

// DUMBBELLS — all movements work on the floor or standing; no bench is assumed.
add(
  "db-floor-press",
  "Dumbbell floor press",
  ["Chest", "Triceps"],
  "Dumbbells",
  "Beginner",
  "push",
  [
    "Lie on the floor with your knees bent and dumbbells above your chest.",
    "Lower with your elbows 30–45 degrees from your torso until your upper arms touch the floor gently.",
    "Pause briefly, then press up without bouncing. Start with a load you can position safely.",
  ],
);
add(
  "db-squeeze-press",
  "Dumbbell squeeze press",
  ["Chest", "Triceps"],
  "Dumbbells",
  "Beginner",
  "push",
  [
    "Lie on the floor holding two light dumbbells together above your chest.",
    "Keep gentle inward pressure as you lower toward your chest.",
    "Press up slowly while keeping your wrists straight.",
  ],
);
add(
  "db-alternating-press",
  "Alternating dumbbell floor press",
  ["Chest", "Triceps"],
  "Dumbbells",
  "Intermediate",
  "push",
  [
    "Lie on the floor with both dumbbells held above your chest.",
    "Lower one arm until the upper arm touches the floor, keeping the other arm steady.",
    "Press back up and alternate without twisting your torso.",
  ],
  "side",
);
add("db-row", "Dumbbell bent-over row", ["Back", "Biceps"], "Dumbbells", "Beginner", "pull", [
  "Soften your knees, hinge at your hips, and keep your spine neutral.",
  "Pull both dumbbells toward your lower ribs with your elbows close to your body.",
  "Lower with control and avoid using momentum.",
]);
add(
  "db-single-row",
  "Single-arm dumbbell row",
  ["Back", "Biceps"],
  "Dumbbells",
  "Beginner",
  "pull",
  [
    "Take a staggered stance and support your free forearm on your front thigh.",
    "Hinge forward and row the dumbbell toward your hip without rotating your torso.",
    "Lower fully with control and repeat on the other side.",
  ],
  "side",
);
add(
  "db-reverse-fly",
  "Dumbbell reverse fly",
  ["Back", "Shoulders"],
  "Dumbbells",
  "Beginner",
  "pull",
  [
    "Hinge forward with soft knees and hold a light dumbbell in each hand.",
    "With slightly bent elbows, open your arms out to the sides.",
    "Stop around torso height and lower slowly, avoiding a shrug.",
  ],
);
add(
  "db-shoulder-press",
  "Dumbbell shoulder press",
  ["Shoulders", "Triceps"],
  "Dumbbells",
  "Beginner",
  "push",
  [
    "Stand tall and start with the dumbbells at shoulder height, palms comfortable.",
    "Brace your abdomen and press overhead through a pain-free range.",
    "Lower slowly. Do not lean back to finish the rep.",
  ],
);
add(
  "db-lateral-raise",
  "Dumbbell lateral raise",
  ["Shoulders"],
  "Dumbbells",
  "Beginner",
  "isolation",
  [
    "Hold light dumbbells at your sides with a small bend in your elbows.",
    "Lift your arms slightly in front of your body, stopping at or below shoulder height.",
    "Lower slowly and keep your neck relaxed.",
  ],
);
add("db-front-raise", "Dumbbell front raise", ["Shoulders"], "Dumbbells", "Beginner", "isolation", [
  "Stand with a light dumbbell in each hand and your ribs stacked over your hips.",
  "Raise your arms forward to shoulder height without swinging.",
  "Pause briefly, then lower under control.",
]);
add("db-curl", "Dumbbell biceps curl", ["Biceps"], "Dumbbells", "Beginner", "isolation", [
  "Stand tall with your palms facing forward and elbows close to your ribs.",
  "Curl the dumbbells without moving your upper arms or leaning backward.",
  "Lower fully and slowly while keeping your wrists neutral.",
]);
add("db-hammer-curl", "Dumbbell hammer curl", ["Biceps"], "Dumbbells", "Beginner", "isolation", [
  "Hold the dumbbells with your palms facing each other.",
  "Curl toward your shoulders while keeping your elbows at your sides.",
  "Lower slowly without swinging your torso.",
]);
add(
  "db-concentration-curl",
  "Standing concentration curl",
  ["Biceps"],
  "Dumbbells",
  "Beginner",
  "isolation",
  [
    "Hinge slightly forward and rest your working elbow against your inner thigh.",
    "Curl one light dumbbell while keeping the shoulder still.",
    "Lower with control, complete the reps, and switch arms.",
  ],
  "side",
);
add(
  "db-triceps-extension",
  "Dumbbell overhead triceps extension",
  ["Triceps"],
  "Dumbbells",
  "Beginner",
  "isolation",
  [
    "Hold one light dumbbell securely with both hands above your head.",
    "Keep your ribs down and bend your elbows to lower it behind your head through a comfortable range.",
    "Straighten your elbows without arching your back. Skip this if overhead movement is uncomfortable.",
  ],
);
add(
  "db-triceps-kickback",
  "Dumbbell triceps kickback",
  ["Triceps"],
  "Dumbbells",
  "Beginner",
  "isolation",
  [
    "Hinge at your hips and hold your upper arms beside your torso.",
    "Straighten your elbows to move the dumbbells backward without swinging.",
    "Pause and bend your elbows slowly, keeping your upper arms still.",
  ],
);
add(
  "db-floor-triceps",
  "Dumbbell lying triceps extension",
  ["Triceps"],
  "Dumbbells",
  "Intermediate",
  "isolation",
  [
    "Lie on the floor holding light dumbbells above your shoulders with palms facing in.",
    "Bend only your elbows to lower the weights beside your head.",
    "Extend smoothly, keeping your shoulders stable and the weights clear of your face.",
  ],
);
add(
  "db-goblet-squat",
  "Dumbbell goblet squat",
  ["Legs", "Glutes"],
  "Dumbbells",
  "Beginner",
  "squat",
  [
    "Hold one dumbbell close to your chest with your feet shoulder-width apart.",
    "Sit down between your hips while keeping your heels grounded.",
    "Stand by pushing through your whole foot. Choose a depth you can control.",
  ],
);
add(
  "db-reverse-lunge",
  "Dumbbell reverse lunge",
  ["Legs", "Glutes"],
  "Dumbbells",
  "Beginner",
  "squat",
  [
    "Hold light dumbbells by your sides and stand tall.",
    "Step back and lower both knees through a comfortable range.",
    "Drive through your front foot to return and repeat on each side.",
  ],
  "side",
);
add("db-calf-raise", "Dumbbell calf raise", ["Legs"], "Dumbbells", "Beginner", "isolation", [
  "Stand on level ground holding dumbbells by your sides.",
  "Rise smoothly onto the balls of your feet while keeping your ankles aligned.",
  "Pause, then lower slowly. Use bodyweight if balance is difficult.",
]);
add(
  "db-rdl",
  "Dumbbell Romanian deadlift",
  ["Glutes", "Legs", "Back"],
  "Dumbbells",
  "Beginner",
  "hinge",
  [
    "Hold the dumbbells in front of your thighs and soften your knees.",
    "Push your hips back, letting the weights travel close to your legs.",
    "Stop when you feel a comfortable hamstring stretch, then stand by squeezing your glutes. Keep your back neutral.",
  ],
);
add("db-bridge", "Dumbbell glute bridge", ["Glutes"], "Dumbbells", "Beginner", "hinge", [
  "Lie on your back, knees bent, with a light dumbbell secured comfortably across your hips.",
  "Hold the weight in place and press through your heels to raise your hips.",
  "Squeeze your glutes without arching your lower back, then lower slowly.",
]);
add("db-sumo-squat", "Dumbbell sumo squat", ["Glutes", "Legs"], "Dumbbells", "Beginner", "squat", [
  "Take a comfortable wide stance with toes slightly out, holding one dumbbell in front.",
  "Lower between your hips with your knees following your toes.",
  "Push through your feet to stand without locking your knees forcefully.",
]);
add(
  "db-suitcase-march",
  "Dumbbell suitcase march",
  ["Abs/Core"],
  "Dumbbells",
  "Beginner",
  "core",
  [
    "Hold one dumbbell by your side and stand tall without leaning toward it.",
    "Slowly march in place while keeping your hips level and abdomen braced.",
    "Switch the weight to the other hand halfway through the timed set.",
  ],
  "time",
);
add(
  "db-dead-bug",
  "Dumbbell dead bug",
  ["Abs/Core"],
  "Dumbbells",
  "Beginner",
  "core",
  [
    "Lie on your back, holding one light dumbbell securely above your chest with both hands.",
    "Keep the weight steady and alternate lowering one bent leg toward the floor.",
    "Exhale as the leg lowers. Keep your lower back comfortable against the floor.",
  ],
  "side",
);
add(
  "db-core-hold",
  "Dumbbell front-rack march",
  ["Abs/Core"],
  "Dumbbells",
  "Intermediate",
  "core",
  [
    "Hold light dumbbells at your shoulders with your ribs stacked over your pelvis.",
    "March slowly in place without leaning backward or shifting your hips.",
    "Keep breathing and use a light enough load to maintain an upright posture.",
  ],
  "time",
);

// BARBELL — conservative setup and technique cues; a light training bar is valid.
add("bb-floor-press", "Barbell floor press", ["Chest", "Triceps"], "Barbell", "Beginner", "push", [
  "Use a safely positioned light bar and a competent spotter. If you cannot set up safely, substitute a push-up.",
  "Lie on the floor and lower the bar until your upper arms gently touch down.",
  "Keep your wrists stacked over your elbows and press without bouncing.",
]);
add(
  "bb-close-press",
  "Close-grip barbell floor press",
  ["Triceps", "Chest"],
  "Barbell",
  "Intermediate",
  "push",
  [
    "Use a light bar, a safe setup, and a competent spotter; otherwise use a close-grip knee push-up.",
    "Take a shoulder-width grip and lower with your elbows close to your torso.",
    "Let your upper arms touch the floor gently, then press up under control.",
  ],
);
add("bb-row", "Barbell bent-over row", ["Back", "Biceps"], "Barbell", "Beginner", "pull", [
  "Hold a light bar with your hands just outside your legs and hinge at the hips.",
  "Brace your torso and row toward your lower ribs without jerking.",
  "Lower the bar with control while maintaining a neutral spine.",
]);
add(
  "bb-underhand-row",
  "Underhand barbell row",
  ["Back", "Biceps"],
  "Barbell",
  "Intermediate",
  "pull",
  [
    "Take a comfortable underhand grip on a light bar and hinge forward.",
    "Pull toward your waist with your elbows close to your sides.",
    "Lower slowly and avoid bending your wrists or rounding your back.",
  ],
);
add(
  "bb-press",
  "Barbell overhead press",
  ["Shoulders", "Triceps"],
  "Barbell",
  "Intermediate",
  "push",
  [
    "Begin with a light bar safely at shoulder height. Do not attempt a heavy clean to set up.",
    "Brace your abdomen and press overhead without leaning backward.",
    "Lower smoothly through a pain-free range. Use a lighter movement if setup or control is uncertain.",
  ],
);
add(
  "bb-front-raise",
  "Light barbell front raise",
  ["Shoulders"],
  "Barbell",
  "Beginner",
  "isolation",
  [
    "Use a very light training bar and stand with your ribs stacked over your hips.",
    "Raise it in front of you to no higher than shoulder height with slightly bent elbows.",
    "Lower slowly. A standard bar may be too heavy; use bodyweight arm circles instead if needed.",
  ],
);
add("bb-curl", "Barbell biceps curl", ["Biceps"], "Barbell", "Beginner", "isolation", [
  "Hold a light bar with a comfortable underhand grip around shoulder-width.",
  "Curl without letting your elbows drift forward or your torso swing.",
  "Lower under control. Stop if the straight grip causes wrist discomfort.",
]);
add("bb-reverse-curl", "Reverse barbell curl", ["Biceps"], "Barbell", "Intermediate", "isolation", [
  "Take a light overhand grip on the bar, hands shoulder-width apart.",
  "Curl while keeping your elbows by your ribs and wrists straight.",
  "Lower slowly. Use a much lighter load than a standard curl.",
]);
add(
  "bb-triceps",
  "Lying barbell triceps extension",
  ["Triceps"],
  "Barbell",
  "Intermediate",
  "isolation",
  [
    "Lie on the floor with a very light bar securely above your shoulders and a spotter if needed.",
    "Bend your elbows to lower the bar toward the space behind the top of your head, keeping it clear of your face.",
    "Extend slowly. Substitute wall triceps extensions if you cannot control the load or setup.",
  ],
);
add(
  "bb-deadlift",
  "Barbell deadlift",
  ["Legs", "Glutes", "Back"],
  "Barbell",
  "Intermediate",
  "hinge",
  [
    "Start with the bar over your midfoot at a height you can reach without rounding your back.",
    "Brace, keep the bar close, and push the floor away to stand.",
    "Lower by hinging at your hips and bending your knees. Get technique coaching before adding heavy load.",
  ],
);
add(
  "bb-rdl",
  "Barbell Romanian deadlift",
  ["Glutes", "Legs", "Back"],
  "Barbell",
  "Beginner",
  "hinge",
  [
    "Start standing with a light bar held close to your thighs and knees soft.",
    "Push your hips back and lower only as far as you can keep a neutral spine.",
    "Stand by driving your hips forward without leaning backward at the top.",
  ],
);
add("bb-bridge", "Barbell glute bridge", ["Glutes"], "Barbell", "Intermediate", "hinge", [
  "Use a light bar with padded contact across your hips and a safe way to position and remove it.",
  "Lie on your back with feet flat, hold the bar steady, and lift your hips.",
  "Squeeze your glutes without arching your lower back, then lower with control.",
]);
add("bb-rollout", "Kneeling barbell rollout", ["Abs/Core"], "Barbell", "Advanced", "core", [
  "Use a bar with freely rolling, securely fastened round plates on a stable, clear surface.",
  "Kneel, brace, and roll forward only as far as you can avoid arching your back.",
  "Pull back using your abdomen. Substitute a forearm plank if you cannot control the movement.",
]);
add(
  "bb-front-hold",
  "Light barbell front hold",
  ["Abs/Core", "Shoulders"],
  "Barbell",
  "Beginner",
  "core",
  [
    "Hold a very light training bar in front of your upper thighs with elbows softly bent.",
    "Move the bar a few centimetres forward while bracing your abdomen and keeping your ribs down.",
    "Hold without leaning back; use a bodyweight plank if the bar is too heavy.",
  ],
  "time",
);

// MACHINES — each named machine is explicitly identified, with controlled ranges.
add("mc-chest", "Machine chest press", ["Chest", "Triceps"], "Machines", "Beginner", "push", [
  "Adjust the seat so the handles are around mid-chest height.",
  "Keep your back against the pad and press forward without locking your elbows forcefully.",
  "Return slowly through a comfortable shoulder range.",
]);
add("mc-fly", "Pec deck fly", ["Chest"], "Machines", "Beginner", "isolation", [
  "Adjust the seat so your upper arms are just below shoulder height.",
  "Bring the handles together with a small bend in your elbows.",
  "Open slowly and stop before you feel strain at the front of your shoulders.",
]);
add("mc-row", "Seated machine row", ["Back", "Biceps"], "Machines", "Beginner", "pull", [
  "Adjust the seat and chest pad so you can reach the handles comfortably.",
  "Pull toward your lower ribs while keeping your shoulders down.",
  "Return with control without rounding your lower back.",
]);
add("mc-pulldown", "Lat pull-down machine", ["Back", "Biceps"], "Machines", "Beginner", "pull", [
  "Secure your thighs under the pad and take a comfortable grip.",
  "Pull the handles toward your upper chest with your elbows down.",
  "Return slowly. Never pull behind your neck or jerk the weight.",
]);
add(
  "mc-shoulder",
  "Machine shoulder press",
  ["Shoulders", "Triceps"],
  "Machines",
  "Beginner",
  "push",
  [
    "Adjust the seat so the handles begin around shoulder height.",
    "Keep your back supported and press up through a pain-free range.",
    "Lower with control without arching your lower back.",
  ],
);
add("mc-lateral", "Machine lateral raise", ["Shoulders"], "Machines", "Beginner", "isolation", [
  "Adjust the machine so its pivot aligns comfortably with your shoulders.",
  "Lift your upper arms out to the sides, stopping at shoulder height or below.",
  "Lower slowly and keep your neck relaxed.",
]);
add("mc-curl", "Machine preacher curl", ["Biceps"], "Machines", "Beginner", "isolation", [
  "Adjust the seat so your upper arms rest comfortably on the pad.",
  "Curl the handles without lifting your elbows off the support.",
  "Lower slowly and avoid forcefully straightening your elbows.",
]);
add("mc-biceps", "Seated biceps curl machine", ["Biceps"], "Machines", "Beginner", "isolation", [
  "Align the seat and handles with the machine's instructions and your elbow position.",
  "Keep your shoulders relaxed as you bend your elbows.",
  "Return under control using a light load and a comfortable range.",
]);
add("mc-triceps", "Machine triceps extension", ["Triceps"], "Machines", "Beginner", "isolation", [
  "Adjust the seat and arm support so your elbows align with the machine's pivot.",
  "Press the handles away by straightening your elbows.",
  "Return slowly while keeping your upper arms supported.",
]);
add(
  "mc-dip",
  "Seated triceps press machine",
  ["Triceps", "Chest"],
  "Machines",
  "Beginner",
  "push",
  [
    "Sit upright with your feet planted and take hold of the handles.",
    "Press down with elbows close to your torso, staying in a comfortable shoulder range.",
    "Return slowly without shrugging your shoulders.",
  ],
);
add("mc-leg-press", "Leg press", ["Legs", "Glutes"], "Machines", "Beginner", "squat", [
  "Set your feet about shoulder-width on the platform and secure the safety stops.",
  "Lower through a range that keeps your pelvis and back against the pad.",
  "Press through your whole foot without locking your knees forcefully.",
]);
add("mc-leg-curl", "Seated leg curl", ["Legs"], "Machines", "Beginner", "isolation", [
  "Align your knees with the machine's pivot and secure the thigh pad.",
  "Curl your heels down and back while keeping your hips against the seat.",
  "Return slowly without letting the weight stack slam.",
]);
add("mc-extension", "Leg extension", ["Legs"], "Machines", "Beginner", "isolation", [
  "Adjust the seat so your knees align with the pivot and the pad sits above your ankles.",
  "Straighten your knees through a comfortable range using a light load.",
  "Lower slowly and stop if you feel knee pain.",
]);
add("mc-glute", "Glute drive machine", ["Glutes"], "Machines", "Beginner", "hinge", [
  "Follow the machine's setup instructions and secure the hip pad or belt.",
  "Plant your feet and extend your hips by squeezing your glutes.",
  "Lower slowly while keeping your ribs down and avoiding a lower-back arch.",
]);
add("mc-abduction", "Hip abduction machine", ["Glutes"], "Machines", "Beginner", "isolation", [
  "Sit with your back supported and position the pads against the outside of your knees.",
  "Open your legs through a comfortable range without rocking your torso.",
  "Bring the pads back slowly and keep the weight controlled.",
]);
add("mc-crunch", "Abdominal crunch machine", ["Abs/Core"], "Machines", "Beginner", "core", [
  "Adjust the seat and supports according to the machine's instructions.",
  "Exhale and gently curl your ribs toward your pelvis using your abdomen.",
  "Return slowly without pulling through your arms or forcing your neck forward.",
]);
add(
  "mc-core",
  "Light abdominal machine hold",
  ["Abs/Core"],
  "Machines",
  "Beginner",
  "core",
  [
    "Set up an abdominal crunch machine with a light, manageable load.",
    "Curl slightly and hold a comfortable braced position without straining your neck.",
    "Breathe steadily and return slowly when the hold ends.",
  ],
  "time",
);

// CABLE — named stations use their standard handles or rope attachments.
add("cb-chest", "Standing cable chest press", ["Chest", "Triceps"], "Cable", "Beginner", "push", [
  "Set two pulleys around chest height and take a staggered stance.",
  "Press the handles forward with your elbows comfortably below shoulder height.",
  "Return slowly without letting the cables pull your shoulders far backward.",
]);
add("cb-fly", "Cable chest fly", ["Chest"], "Cable", "Beginner", "isolation", [
  "Set the handles around chest height and step into a stable split stance.",
  "Keep a small elbow bend and bring your hands together in front of your chest.",
  "Open slowly, stopping within a comfortable shoulder range.",
]);
add("cb-row", "Standing cable row", ["Back", "Biceps"], "Cable", "Beginner", "pull", [
  "Set a pulley around lower-chest height and stand with soft knees.",
  "Brace your torso and pull the handle toward your lower ribs.",
  "Reach forward slowly without rounding your lower back.",
]);
add(
  "cb-pulldown",
  "Kneeling cable lat pull-down",
  ["Back", "Biceps"],
  "Cable",
  "Beginner",
  "pull",
  [
    "Use a high pulley and kneel in a stable position with a light load.",
    "Pull the handle toward your upper chest with your elbows moving downward.",
    "Return slowly without leaning backward or pulling behind your neck.",
  ],
);
add(
  "cb-lateral",
  "Single-arm cable lateral raise",
  ["Shoulders"],
  "Cable",
  "Beginner",
  "isolation",
  [
    "Stand side-on to a low pulley and hold the handle in your outside hand.",
    "Raise your arm out to the side, stopping at shoulder height or below.",
    "Lower slowly while keeping your torso still, then switch sides.",
  ],
  "side",
);
add("cb-face-pull", "Cable face pull", ["Shoulders", "Back"], "Cable", "Beginner", "pull", [
  "Set a rope attachment near eye level and stand tall with a light load.",
  "Pull the rope toward your forehead, separating your hands while keeping your shoulders relaxed.",
  "Return slowly without arching your back.",
]);
add("cb-curl", "Cable biceps curl", ["Biceps"], "Cable", "Beginner", "isolation", [
  "Face a low pulley with a comfortable underhand grip on its handle.",
  "Curl with your elbows at your sides and your torso still.",
  "Lower under control without letting the stack slam.",
]);
add("cb-rope-curl", "Cable rope hammer curl", ["Biceps"], "Cable", "Beginner", "isolation", [
  "Attach a rope to a low pulley and hold it with your palms facing in.",
  "Curl the ends upward while keeping your upper arms still.",
  "Lower slowly and avoid leaning back.",
]);
add("cb-pushdown", "Cable triceps push-down", ["Triceps"], "Cable", "Beginner", "isolation", [
  "Use a high pulley and keep your elbows close to your sides.",
  "Straighten your elbows to press the handle downward.",
  "Return slowly while keeping your upper arms still and shoulders relaxed.",
]);
add(
  "cb-overhead",
  "Cable overhead triceps extension",
  ["Triceps"],
  "Cable",
  "Intermediate",
  "isolation",
  [
    "Face away from a low pulley with a rope held securely behind your head.",
    "Brace your torso and extend your elbows through a pain-free range.",
    "Lower slowly. Use a push-down if the overhead position is uncomfortable.",
  ],
);
add("cb-squat", "Cable squat", ["Legs", "Glutes"], "Cable", "Beginner", "squat", [
  "Face a low pulley, hold its handle at chest height, and step back until the cable is taut.",
  "Sit into a controlled squat while keeping your heels on the floor.",
  "Stand smoothly without leaning backward or letting the cable pull you forward.",
]);
add(
  "cb-reverse-lunge",
  "Cable reverse lunge",
  ["Legs", "Glutes"],
  "Cable",
  "Intermediate",
  "squat",
  [
    "Face a low pulley and hold the handle close to your torso using a light load.",
    "Step back into a controlled lunge, maintaining balance.",
    "Push through your front foot to stand and complete both sides.",
  ],
  "side",
);
add("cb-pullthrough", "Cable pull-through", ["Glutes", "Legs"], "Cable", "Beginner", "hinge", [
  "Face away from a low pulley with a rope held between your legs.",
  "Soften your knees and push your hips backward while keeping your spine neutral.",
  "Stand by squeezing your glutes, keeping the cable clear of your body.",
]);
add(
  "cb-kickback",
  "Cable glute kickback",
  ["Glutes"],
  "Cable",
  "Beginner",
  "isolation",
  [
    "Secure the station's ankle cuff to a low pulley and hold the frame for balance.",
    "Extend the working leg slightly backward without arching your spine.",
    "Return slowly and complete both sides using a light load.",
  ],
  "side",
);
add(
  "cb-pallof",
  "Cable Pallof press",
  ["Abs/Core"],
  "Cable",
  "Beginner",
  "core",
  [
    "Stand side-on to a chest-height pulley and hold the handle at your sternum.",
    "Press your hands forward while resisting rotation through your torso.",
    "Bring your hands back slowly and complete both sides.",
  ],
  "side",
);
add("cb-crunch", "Kneeling cable crunch", ["Abs/Core"], "Cable", "Intermediate", "core", [
  "Kneel beneath a high pulley with a rope held beside your head.",
  "Exhale and curl your ribs toward your pelvis without pulling with your arms.",
  "Return slowly; keep the load light enough to avoid jerking or neck strain.",
]);

// RESISTANCE BANDS — these variations require no external anchor.
add("rb-chest", "Band chest press", ["Chest", "Triceps"], "Resistance Bands", "Beginner", "push", [
  "Inspect the band for damage, then pass it across your upper back, below your neck.",
  "Hold the ends securely beside your chest and press forward.",
  "Return slowly. Keep the band away from your face and do not exceed its stretch limit.",
]);
add(
  "rb-squeeze",
  "Band forward press hold",
  ["Chest", "Triceps"],
  "Resistance Bands",
  "Beginner",
  "push",
  [
    "Pass a light band across your upper back and grip both ends securely.",
    "Press forward to a comfortable position, keeping your wrists straight.",
    "Hold while breathing steadily; keep tension below the band's stretch limit.",
  ],
  "time",
);
add("rb-row", "Seated band row", ["Back", "Biceps"], "Resistance Bands", "Beginner", "pull", [
  "Sit with soft knees and securely loop a long band around the middle of both shod feet.",
  "Check that the band cannot slip, then pull toward your waist with your chest tall.",
  "Return slowly. Keep the band well below your face and use light tension.",
]);
add(
  "rb-pullapart",
  "Band pull-apart",
  ["Back", "Shoulders"],
  "Resistance Bands",
  "Beginner",
  "pull",
  [
    "Hold a light band in front of your chest with soft elbows.",
    "Separate your hands through a comfortable range while keeping your shoulders down.",
    "Return slowly. Inspect the band and avoid stretching it toward your face.",
  ],
);
add(
  "rb-press",
  "Band shoulder press",
  ["Shoulders", "Triceps"],
  "Resistance Bands",
  "Beginner",
  "push",
  [
    "Stand securely on the middle of a long band and hold the ends at shoulder height.",
    "Press up through a comfortable range without leaning back.",
    "Lower slowly. Choose a light band and stay within its safe stretch limit.",
  ],
);
add(
  "rb-lateral",
  "Band lateral raise",
  ["Shoulders"],
  "Resistance Bands",
  "Beginner",
  "isolation",
  [
    "Stand on the centre of a light long band and hold its ends securely.",
    "Raise your arms out to the sides to shoulder height or below.",
    "Lower slowly without shrugging. Use very light tension.",
  ],
);
add("rb-curl", "Band biceps curl", ["Biceps"], "Resistance Bands", "Beginner", "isolation", [
  "Stand on the middle of a long band and hold each end with palms forward.",
  "Curl upward with your elbows by your ribs and wrists straight.",
  "Lower slowly, keeping your feet firmly on the band.",
]);
add("rb-hammer", "Band hammer curl", ["Biceps"], "Resistance Bands", "Beginner", "isolation", [
  "Stand securely on a long band and grip the ends with your thumbs pointing upward.",
  "Curl without swinging or letting your upper arms move forward.",
  "Lower under control and avoid exceeding the band's stretch limit.",
]);
add(
  "rb-triceps",
  "Band overhead triceps extension",
  ["Triceps"],
  "Resistance Bands",
  "Beginner",
  "isolation",
  [
    "Hold one end of a light band behind your lower back and the other above your head.",
    "Keep the upper elbow steady and extend the top arm through a comfortable range.",
    "Return slowly, then switch sides. Keep the band away from your face.",
  ],
  "side",
);
add(
  "rb-kickback",
  "Band triceps kickback",
  ["Triceps"],
  "Resistance Bands",
  "Beginner",
  "isolation",
  [
    "Stand securely on a long light band and hinge forward with a neutral back.",
    "Keep your upper arms beside your torso and straighten your elbows backward.",
    "Bend slowly while keeping the band anchored under your feet.",
  ],
);
add("rb-squat", "Band squat", ["Legs", "Glutes"], "Resistance Bands", "Beginner", "squat", [
  "Stand on a long band with your feet shoulder-width and hold the ends securely by your shoulders.",
  "Lower into a comfortable squat with your heels grounded.",
  "Stand smoothly. Use light tension and stay within the band's stretch limit.",
]);
add(
  "rb-goodmorning",
  "Band good morning",
  ["Legs", "Glutes", "Back"],
  "Resistance Bands",
  "Beginner",
  "hinge",
  [
    "Stand on the centre of a long band and hold the ends at your shoulders; do not loop it around your neck.",
    "Soften your knees and push your hips backward with a neutral spine.",
    "Stand by squeezing your glutes, keeping a firm grip on the band.",
  ],
);
add(
  "rb-side-step",
  "Mini-band lateral walk",
  ["Glutes", "Legs"],
  "Resistance Bands",
  "Beginner",
  "squat",
  [
    "Place a suitable mini loop band above your knees and take a shallow squat stance.",
    "Step sideways with small, controlled steps while keeping your knees aligned with your toes.",
    "Take equal steps in both directions without dragging your feet.",
  ],
  "side",
);
add("rb-bridge", "Banded glute bridge", ["Glutes"], "Resistance Bands", "Beginner", "hinge", [
  "Place a suitable mini loop band above your knees and lie on your back with feet flat.",
  "Gently press your knees outward and lift your hips by squeezing your glutes.",
  "Lower slowly without arching your back or letting your knees collapse inward.",
]);
add(
  "rb-core-march",
  "Band-resisted dead bug",
  ["Abs/Core"],
  "Resistance Bands",
  "Beginner",
  "core",
  [
    "Lie on your back with a light mini loop band around both feet and knees bent.",
    "Brace gently and extend one leg a short distance while the other stays still.",
    "Alternate without arching your back. Use bodyweight if the band slips.",
  ],
  "side",
);
add(
  "rb-core-hold",
  "Band pull-apart core hold",
  ["Abs/Core", "Shoulders"],
  "Resistance Bands",
  "Beginner",
  "core",
  [
    "Stand tall and hold a light band in front of your chest with soft elbows.",
    "Apply gentle outward tension while keeping your ribs over your pelvis.",
    "Hold and breathe steadily without leaning back or shrugging.",
  ],
  "time",
);

export const EXERCISES: readonly ExerciseDefinition[] = catalog;
export const EXERCISES_BY_ID = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]));
