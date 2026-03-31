import type { CyclePhase } from "@/utils/constants";

export type PhaseGuidePhase = {
  phase: CyclePhase;
  title: string;
  daysLabel: string;
  phaseLabel: string;
  energyLabel: string;
  recoveryLabel: string;
  trainingLoadLabel: string;
  summary: string;
  biologySummary: string;
  trainingSummary: string;
  doItems: string[];
  avoidItems: string[];
  whyItMatters: string;
};

export const phaseGuideSummary = {
  title: "Train in alignment with your cycle",
  intro:
    "The two CycleFit phase guides follow the same pattern: hormones shift your energy, recovery, and training capacity across the month. The goal is not rigid rules. It is better timing, better recovery, and more consistency.",
  note:
    "A 28-day cycle is only an average. Your own phase lengths can shift, but the overall hormonal pattern and training implications still apply."
} as const;

export const phaseGuidePrinciples = [
  "Use your cycle as a planning signal, not a strict set of limits.",
  "Higher energy phases support harder loading. Lower energy phases reward recovery and steady work.",
  "Track how you feel over time so your own data can refine the guide."
] as const;

export const phaseGuidePhases: PhaseGuidePhase[] = [
  {
    phase: "menstrual",
    title: "Menstrual",
    daysLabel: "Days 1-5",
    phaseLabel: "Rest & restore",
    energyLabel: "Low to moderate",
    recoveryLabel: "Slower",
    trainingLoadLabel: "Light to gentle",
    summary: "Low hormone levels, lower energy availability, and cramping can make this the quietest phase of the cycle.",
    biologySummary:
      "Oestrogen and progesterone are at their monthly low while the uterine lining sheds. Blood loss and inflammation can make effort feel heavier, even when the work is not objectively harder.",
    trainingSummary:
      "Bias toward low-intensity movement and honest recovery choices. Walking, mobility, restorative yoga, breathwork, and light Pilates are the clearest fit here.",
    doItems: ["Gentle mobility and stretching", "Slow walks or easy movement", "Recovery-focused Pilates or yoga"],
    avoidItems: ["Max-effort lifting", "Hard intervals", "Pushing through fatigue just to stay on plan"],
    whyItMatters:
      "Respecting the lower-capacity days helps you carry more energy into the stronger phases instead of starting them depleted."
  },
  {
    phase: "follicular",
    title: "Follicular",
    daysLabel: "Days 6-13",
    phaseLabel: "Build & explore",
    energyLabel: "Rising to high",
    recoveryLabel: "Fast",
    trainingLoadLabel: "Moderate to high",
    summary: "Rising oestrogen, lower inflammation, and faster recovery make this the clearest window for building momentum.",
    biologySummary:
      "Follicles develop, oestrogen rises, and the body trends toward better mood, better trainability, and stronger recovery capacity than in the early cycle.",
    trainingSummary:
      "Use this phase for progressive overload, skill practice, strength work, and higher-intensity sessions while movement quality is still sharp.",
    doItems: ["Compound strength lifts", "HIIT or sprint intervals", "New skills and harder progressions"],
    avoidItems: ["Holding back out of habit", "Skipping nutrition support for harder sessions", "Letting improved energy go unused"],
    whyItMatters:
      "When motivation and recovery are both favorable, this is the most practical phase to push adaptation and build confidence."
  },
  {
    phase: "ovulation",
    title: "Ovulation",
    daysLabel: "Days 14-16",
    phaseLabel: "Perform & peak",
    energyLabel: "Peak",
    recoveryLabel: "Fast",
    trainingLoadLabel: "Maximum",
    summary: "Oestrogen, LH, and testosterone peak together here, creating the strongest performance window of the month for many athletes.",
    biologySummary:
      "Power, reaction time, and cardiovascular efficiency are often at their best around ovulation. The main tradeoff is higher ligament laxity, especially around the knee.",
    trainingSummary:
      "If you want your hardest efforts, race-pace work, explosive training, or performance testing, this is the phase most suited to it, provided the warm-up is thorough.",
    doItems: ["High-power intervals or race efforts", "Heavy and fast strength work", "Explosive movement with full preparation"],
    avoidItems: ["Skipping warm-up quality", "Stacking hard sessions without recovery", "Ignoring hydration as heat load rises"],
    whyItMatters:
      "This is the phase where confidence, drive, and physical capacity can align, so it is worth using deliberately rather than by accident."
  },
  {
    phase: "luteal",
    title: "Luteal",
    daysLabel: "Days 17-28",
    phaseLabel: "Strength & slow down",
    energyLabel: "Variable to low",
    recoveryLabel: "Slower",
    trainingLoadLabel: "Moderate to light",
    summary: "Progesterone rises, body temperature climbs, and the phase shifts from solid early training capacity to a harder-feeling late phase.",
    biologySummary:
      "Thermoregulation gets less efficient, perceived effort rises sooner, and late-luteal hormone drops can bring PMS symptoms, fatigue, bloating, and lower tolerance for intensity.",
    trainingSummary:
      "Keep early luteal training solid but controlled, then taper toward steadier cardio, manageable strength work, yoga, Pilates, and extra recovery support later on.",
    doItems: ["Moderate strength training", "Steady-state cardio", "Sleep, carbs, and recovery nutrition"],
    avoidItems: ["Late-phase PR chasing", "Ignoring hunger or recovery needs", "Training through heavy PMS without modifying the session"],
    whyItMatters:
      "The win in luteal is sustainable consistency. Adjusting intensity without dropping the habit is what keeps progress moving across the full cycle."
  }
];
