export type PublishedStructureRegistry = {
  sheetName: string;
  fieldCount: number;
  layerCounts: {
    "launch-runtime": number;
    "editorial-expansion": number;
    backlog: number;
  };
  sectionGroups: Array<{
    section: string;
    layer: "launch-runtime" | "editorial-expansion" | "backlog";
    fieldCount: number;
    firstColumnIndex: number;
    lastColumnIndex: number;
    sampleFields: string[];
  }>;
  launchSections: string[];
  editorialSections: string[];
};

export async function loadPublishedStructureRegistry(): Promise<PublishedStructureRegistry | null> {
  try {
    const response = await fetch("/content/published/editorial/structure-registry.json", {
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as PublishedStructureRegistry;
  } catch {
    return null;
  }
}
