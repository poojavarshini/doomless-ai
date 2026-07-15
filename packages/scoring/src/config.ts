export const SCORE_WEIGHTS = Object.freeze({
  positive: Object.freeze({
    learningValue: 0.25,
    actionability: 0.2,
    personalRelevance: 0.2,
    timeEfficiency: 0.2,
    emotionalImpact: 0.15,
  }),
  risk: Object.freeze({ clickbaitRisk: 0.1, addictionRisk: 0.15 }),
});

export const RAW_SCORE_RANGE = Object.freeze({ minimum: -25, maximum: 100 });

export const EVIDENCE_STRENGTH = Object.freeze({
  multimodal: 1,
  transcriptAndCaption: 0.9,
  captionAndVisibleText: 0.75,
  meaningfulCaption: 0.6,
  meaningfulMetadata: 0.4,
  none: 0,
});

export const SCORE_BAND_CONFIG = Object.freeze([
  { minimum: 90, maximum: 100, label: "EXCELLENT_DIGITAL_VALUE", title: "Excellent Digital Value", action: "Strongly recommended", explanation: "Exceptional value with a strong return on your attention.", conclusion: "Strongly recommended \u2014 exceptional value for your attention." },
  { minimum: 80, maximum: 89, label: "HIGH_DIGITAL_VALUE", title: "High Digital Value", action: "Worth watching", explanation: "Useful and time-efficient content with low distraction.", conclusion: "Worth watching \u2014 useful and time-efficient content." },
  { minimum: 70, maximum: 79, label: "GOOD_DIGITAL_VALUE", title: "Good Digital Value", action: "Worth watching", explanation: "Good overall value with only minor distractions.", conclusion: "Worth watching \u2014 good value with minor distractions." },
  { minimum: 60, maximum: 69, label: "MIXED_DIGITAL_VALUE", title: "Mixed Digital Value", action: "Watch selectively", explanation: "Some meaningful value, but it may not be essential.", conclusion: "Watch selectively \u2014 useful, but not essential." },
  { minimum: 50, maximum: 59, label: "LOW_DIGITAL_VALUE", title: "Low Digital Value", action: "Skim", explanation: "A limited payoff that may include considerable filler.", conclusion: "Skim \u2014 some value, but considerable filler." },
  { minimum: 40, maximum: 49, label: "POOR_DIGITAL_VALUE", title: "Poor Digital Value", action: "Probably skip", explanation: "Limited return for the attention and time required.", conclusion: "Probably skip \u2014 limited return for your time." },
  { minimum: 20, maximum: 39, label: "DIGITAL_JUNK", title: "Digital Junk", action: "Skip", explanation: "Low value combined with stronger distraction signals.", conclusion: "Skip \u2014 low value and high distraction." },
  { minimum: 0, maximum: 19, label: "HARMFUL_ATTENTION_PATTERN", title: "Harmful Attention Pattern", action: "Avoid", explanation: "Attention-capturing patterns outweigh the expected value.", conclusion: "Avoid \u2014 designed to capture attention, not provide value." },
  { minimum: null, maximum: null, label: "LIMITED_ANALYSIS", title: "Limited Analysis", action: "Review manually", explanation: "Not enough Reel content was available to calculate a score.", conclusion: "Not enough Reel content was available to score." },
] as const);

export const CATEGORY_GUIDE_CONFIG = Object.freeze({
  learningValue: {
    label: "Learning Value",
    definition: "How much meaningful knowledge, context, or skill the Reel provides.",
    isRisk: false,
    interpretations: ["Provides almost no educational benefit.", "Offers little meaningful knowledge.", "Contains one or two useful ideas.", "Provides useful information with limited depth.", "Teaches clear and meaningful information."],
  },
  actionability: {
    label: "Actionability",
    definition: "Whether the Reel provides useful steps, advice, or decisions you can apply.",
    isRisk: false,
    interpretations: ["Provides no clear action or next step.", "Offers limited practical guidance.", "Suggests ideas but lacks clear steps.", "Provides practical advice you may use.", "Gives clear steps you can apply immediately."],
  },
  personalRelevance: {
    label: "Personal Relevance",
    definition: "How closely the topic matches your selected interests and goals.",
    isRisk: false,
    interpretations: ["Does not match your selected preferences.", "Has little connection to your interests.", "Only partly connects to your goals.", "Relates to some of your selected interests.", "Strongly matches your interests and goals."],
  },
  timeEfficiency: {
    label: "Time Efficiency",
    definition: "How much intended value the Reel delivers relative to the time it takes.",
    isRisk: false,
    interpretations: ["Mostly filler, repetition, or delayed payoff.", "Takes too long to deliver limited value.", "Contains useful content but some repetition.", "Provides useful value in reasonable time.", "Delivers strong value with minimal filler."],
  },
  emotionalImpact: {
    label: "Emotional Impact",
    definition: "Whether the visible framing is likely to feel positive, neutral, stressful, or manipulative.",
    isRisk: false,
    interpretations: ["Uses strongly negative or manipulative framing.", "May create stress, fear, or negativity.", "Likely to have a neutral or mixed effect.", "Emotionally positive or calming overall.", "Likely to leave a positive emotional effect."],
  },
  clickbaitRisk: {
    label: "Clickbait Risk",
    definition: "The likelihood that the hook exaggerates or misrepresents the expected payoff.",
    isRisk: true,
    interpretations: ["The hook closely matches the actual content.", "The content mostly delivers what it promises.", "The hook slightly exaggerates the content.", "Uses an exaggerated hook with limited payoff.", "Highly misleading or sensationalized content."],
  },
  addictionRisk: {
    label: "Addiction Risk",
    definition: "The strength of urgency, repetition, looping, or overstimulation used to hold attention.",
    isRisk: true,
    interpretations: ["Minimal use of compulsive attention techniques.", "Limited looping, urgency, or overstimulation.", "Uses some attention-retaining techniques.", "Relies heavily on rapid novelty or repetition.", "Strongly designed for compulsive continued viewing."],
  },
} as const);
