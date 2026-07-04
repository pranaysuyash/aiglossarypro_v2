export type FlagshipFamily = {
  title: string;
  note: string;
  whyItMatters: string;
  studyMove: string;
  confusionCue: string;
};

export const flagshipFamilies: FlagshipFamily[] = [
  {
    title: "Neural Networks",
    note: "Activations, gradients, optimization, and training dynamics.",
    whyItMatters: "This family explains how modern models learn representations and how training actually changes behavior.",
    studyMove: "Start with the architecture, then compare the loss, activation, and optimization blocks.",
    confusionCue: "Look for nearby terms that change layers, activations, or gradients rather than the model family itself.",
  },
  {
    title: "Natural Language Processing",
    note: "Token flow, retrieval, generation, and evaluation.",
    whyItMatters: "This family is the doorway into language systems, from tokenization to retrieval-augmented generation.",
    studyMove: "Read the core language concept, then compare retrieval, generation, and evaluation terms.",
    confusionCue: "Watch for overlap between representation, retrieval, and generation so the boundary stays visible.",
  },
  {
    title: "Computer Vision",
    note: "Pixel, object, and scene understanding with visual models.",
    whyItMatters: "This family anchors how the app explains visual reasoning, detection, segmentation, and multimodal perception.",
    studyMove: "Use a visual pipeline first, then compare pixel-level, object-level, and scene-level terms.",
    confusionCue: "Separate image-only methods from video, 3D, and scene-level ideas before memorizing the label.",
  },
  {
    title: "Reinforcement Learning",
    note: "Policies, rewards, exploration, and control loops.",
    whyItMatters: "This family teaches the loop between action, feedback, reward shaping, and long-horizon control.",
    studyMove: "Read the agent loop, then compare policy, reward, exploration, and control terms.",
    confusionCue: "Keep the policy/reward boundary visible so the term does not collapse into generic optimization.",
  },
  {
    title: "Statistics",
    note: "Assumptions, uncertainty, and inference boundaries.",
    whyItMatters: "This family supports the math intuition underneath estimation, uncertainty, and model comparison.",
    studyMove: "Start with assumptions, then compare inference, distribution, and uncertainty terms.",
    confusionCue: "Separate the model assumption from the estimate and the confidence it gives you.",
  },
  {
    title: "Evaluation",
    note: "Metrics, baselines, and tradeoff selection.",
    whyItMatters: "This family explains how the product decides whether a model or system is actually getting better.",
    studyMove: "Compare the metric to the baseline and ask what tradeoff it rewards.",
    confusionCue: "Check whether the term changes the measurement, the baseline, or the interpretation.",
  },
  {
    title: "Ethics & Governance",
    note: "Safety, privacy, fairness, and accountability.",
    whyItMatters: "This family keeps the app honest about responsible AI, operational risk, and user trust.",
    studyMove: "Read the risk signal first, then compare fairness, privacy, safety, and accountability terms.",
    confusionCue: "Identify the harm or governance concern before you treat the label as neutral.",
  },
  {
    title: "Similarity & Deduplication",
    note: "Normalization, thresholds, and matching balance.",
    whyItMatters: "This family matters because the corpus itself depends on dedupe, aliasing, and canonicalization.",
    studyMove: "Compare normalization, matching, and threshold terms side by side.",
    confusionCue: "Ask whether the term changes normalization, thresholding, or match confidence.",
  },
];
