export type TermBlock =
  | {
      id: string;
      type: "markdown";
      title: string;
      body: string;
    }
  | {
      id: string;
      type: "bullets";
      title: string;
      items: string[];
    }
  | {
      id: string;
      type: "table";
      title: string;
      rows: Array<{ label: string; value: string }>;
    }
  | {
      id: string;
      type: "steps";
      title: string;
      steps: Array<{ label: string; body: string }>;
    }
  | {
      id: string;
      type: "callout";
      title: string;
      tone: "info" | "success" | "warning";
      body: string;
    }
  | {
      id: string;
      type: "deep-dive";
      title: string;
      panels: Array<{
        label: string;
        tone: "accent" | "secondary" | "gold";
        body: string;
      }>;
      takeaway: string;
    }
  | {
      id: string;
      type: "diagram";
      title: string;
      center: {
        label: string;
        caption: string;
      };
      lanes: Array<{
        label: string;
        tone: "accent" | "secondary" | "gold";
        items: string[];
      }>;
      takeaway: string;
    }
  | {
      id: string;
      type: "comparison";
      title: string;
      panels: Array<{
        label: string;
        tone: "accent" | "secondary" | "gold";
        body: string;
      }>;
      takeaway: string;
    }
  | {
      id: string;
      type: "faq";
      title: string;
      items: Array<{
        question: string;
        answer: string;
      }>;
    }
  | {
      id: string;
      type: "curriculum-map";
      title: string;
      sections: Array<{
        section: string;
        status: "direct" | "partial";
        runtimeBlocks: string[];
        note: string;
      }>;
    }
  | {
      id: string;
      type: "structure-expansion";
      title: string;
      sections: Array<{
        section: string;
        layer: "editorial-expansion" | "backlog";
        fieldCount: number;
        sampleFields: string[];
      }>;
    }
  | {
      id: string;
      type: "quiz";
      title: string;
      question: string;
      options: string[];
      answerIndex: number;
      explanation: string;
    };

export type TermSummary = {
  id: string;
  slug: string;
  title: string;
  aliases: string[];
  summary: string;
  taxonomy: {
    topic: string;
    category: string;
    subCategory: string;
    tags: string[];
  };
  links: {
    prerequisites: string[];
    related: string[];
    alternatives: string[];
    next: string[];
  };
  blocks: TermBlock[];
  metadata: {
    difficulty: string;
    maturity: string;
    studyFamily?: string;
    editorialTier?: "featured" | "standard" | "sparse";
  };
  artifact: {
    shardId: string;
  };
};

export type TermSource = {
  glossaryWorkbook: {
    file: string;
    sheetName: string;
    inventoryRows: number[];
    inventoryCells: string[];
    inventoryColumns: string[];
    sourceCells: Array<{
      rowNumber: number;
      columnIndex: number;
      columnLetter: string;
    }>;
    taxonomyRow: number | null;
    definitionRow: number | null;
    definitionBody: string | null;
  };
};

export type TermRecord = TermSummary & {
  links: {
    prerequisites: string[];
    related: string[];
    alternatives: string[];
    next: string[];
  };
  blocks: TermBlock[];
  source: TermSource;
};

export type LearningPathSummary = {
  slug: string;
  title: string;
  description: string;
  category: string;
  subCategory: string;
  termCount: number;
  featuredTermSlugs: string[];
};

export type LearningPathStep = {
  slug: string;
  title: string;
  summary: string;
  stage: "start" | "build" | "advance";
  whyIncluded: string;
};

export type LearningPathRecord = LearningPathSummary & {
  featuredTermTitles: string[];
  steps: LearningPathStep[];
};

export type NoteRecord = {
  id: string;
  termSlug: string;
  title: string | null;
  bodyMarkdown: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
};

export type StudySnapshot = {
  bookmarks: string[];
  notes: Record<
    string,
    {
      id: string | null;
      title: string | null;
      bodyMarkdown: string;
      visibility: string;
      createdAt: string | null;
      updatedAt: string | null;
    }
  >;
};

export type AnnotationRecord = {
  id: string;
  termSlug: string;
  blockId: string;
  startOffset: number | null;
  endOffset: number | null;
  selectedText: string | null;
  noteId: string | null;
  noteBody: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShareLinkRecord = {
  id: string;
  resourceType: string;
  resourceId: string;
  token: string;
  visibility: string;
  expiresAt: string | null;
  createdAt: string;
};

export type SharedResourceRecord = {
  resourceType: string;
  resourceId: string;
  visibility: string;
  expiresAt: string | null;
  createdAt: string;
};

export type ExportJobRecord = {
  id: string;
  exportType: string;
  status: string;
  objectKey: string | null;
  requestedAt: string;
  completedAt: string | null;
};

export type EntitlementRecord = {
  id: string;
  planFamily: string;
  billingMode: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};
