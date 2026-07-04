export type PublishedCorpusManifest = {
  publishedAt: string;
  status: string;
  sourceInventoryTermCount: number;
  termCount: number;
  pathCount: number;
  shardCount: number;
  coverage: {
    taxonomyTerms: number;
    taxonomyCoverageRatio: number;
    definitionTerms: number;
    definitionCoverageRatio: number;
    studyFamilyTerms: number;
    studyFamilyCoverageRatio: number;
    sourceDefinitionBlocks: number;
    blockCoverage: {
      overview: number;
      taxonomy: number;
      connections: number;
      "study-prompts": number;
    };
  };
  qualityChecks: {
    requiredBlockSequence: string[];
    sourceInventoryBackedTitles: boolean;
    highSeverityIssueCount: number;
    issueCount: number;
  };
  canonicalization: {
    groups: number;
    rowsMerged: number;
  };
  contentTierCounts: {
    featured?: number;
    standard?: number;
    sparse?: number;
  };
  structureLayerCounts: {
    "launch-runtime": number;
    "editorial-expansion": number;
    backlog: number;
  };
  editorialFieldCount: number;
  structureSectionCount: number;
  launchStructureSections: number;
  editorialStructureSections: number;
  launchSectionCount: number;
  launchBlockIds: string[];
  launchSections: Array<{
    section: string;
    status: "direct" | "partial";
    runtimeBlocks: string[];
    note: string;
  }>;
  contentDepth?: {
    blockCounts: Record<string, number>;
    featuredTermCount: number;
    sourceDefinitionCount: number;
  };
  artifacts: Record<string, string>;
};

export async function loadPublishedCorpusManifest(): Promise<PublishedCorpusManifest | null> {
  try {
    const response = await fetch("/content/published/manifest.json", {
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as PublishedCorpusManifest;
  } catch {
    return null;
  }
}
