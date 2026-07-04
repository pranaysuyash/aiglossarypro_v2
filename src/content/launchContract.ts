export type PublishedLaunchContract = {
  sheetName: string;
  launchSectionCount: number;
  launchBlockIds: string[];
  launchSections: Array<{
    section: string;
    status: "direct" | "partial";
    runtimeBlocks: string[];
    note: string;
  }>;
  policy: {
    launchRuntimeLayer: string;
    editorialExpansionLayer: string;
    backlogLayer: string;
  };
  sourceStructureCounts: {
    fieldCount: number;
    sectionCount: number;
  };
};

export async function loadPublishedLaunchContract(): Promise<PublishedLaunchContract | null> {
  try {
    const response = await fetch("/content/published/editorial/launch-contract.json", {
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as PublishedLaunchContract;
  } catch {
    return null;
  }
}
