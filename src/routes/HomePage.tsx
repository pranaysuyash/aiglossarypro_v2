import { Link } from "react-router-dom";
import { CorpusProgressPreview } from "../components/CorpusProgressPreview";
import { ContinueLearningCard } from "../components/ContinueLearningCard";
import { ContinuePathCard } from "../components/ContinuePathCard";
import { LearningAtlasCard } from "../components/LearningAtlasCard";
import { LaunchCurriculumPreview } from "../components/LaunchCurriculumPreview";
import { RecentActivityCard } from "../components/RecentActivityCard";
import { StudyMemoryCard } from "../components/StudyMemoryCard";
import { StructureExplorerCard } from "../components/StructureExplorerCard";
import { useCatalog } from "../content/CatalogContext";
import { TermCard } from "../components/TermCard";
import { buildFamilyHighlights, familySlug } from "./familyHighlights";

const rituals = [
  {
    index: "01",
    title: "Read with orientation",
    body: "Every term sits inside a larger map, so the learner understands where it belongs before trying to memorize it.",
  },
  {
    index: "02",
    title: "Keep a private notebook",
    body: "Bookmarks, notes, and annotations turn definitions into a durable personal study system instead of another browser graveyard.",
  },
  {
    index: "03",
    title: "Build fluency over time",
    body: "The goal is not trivia. The goal is that AI language starts feeling native when you read papers, products, and research threads.",
  },
];

const curriculumModes = [
  {
    title: "Learn by topic",
    note: "Core models, LLM systems, evaluation, math intuition.",
    accent: "topic",
  },
  {
    title: "Learn by format",
    note: "Glossary terms, paths, source-backed notes, and recall drills.",
    accent: "format",
  },
  {
    title: "Learn by intent",
    note: "Read, save, annotate, export, and come back with memory.",
    accent: "intent",
  },
  {
    title: "Learn by depth",
    note: "Quick orientation first, editorial depth when you want it.",
    accent: "depth",
  },
];

const contentModes = [
  {
    title: "Read",
    note: "Fast term pages with source-trace, links, and editorial depth when you want it.",
    route: "/explore",
    label: "Glossary",
  },
  {
    title: "Follow a path",
    note: "Structured topic trails for focused learning without endless searching.",
    route: "/paths",
    label: "Curriculum",
  },
  {
    title: "Save memory",
    note: "Bookmarks, notes, and annotations that stay attached to your learner identity.",
    route: "/saved",
    label: "Private study",
  },
  {
    title: "Review and export",
    note: "Notebook continuity, share links, and exportable study output for long-term retention.",
    route: "/notes",
    label: "Workflow",
  },
];

const studyArtifacts = [
  {
    title: "Saved term",
    label: "Attention Mechanism",
    body: "Pinned to revisit the difference between where attention is used and what it actually computes.",
  },
  {
    title: "Private note",
    label: "Transformer Architecture",
    body: "A short personal explanation of self-attention, residuals, and why the model scales well.",
  },
  {
    title: "Annotation",
    label: "Evaluation Metrics",
    body: "A highlight on the section that compares precision, recall, and F1 for imbalanced classes.",
  },
];

const learningLenses = [
  {
    label: "Industry lens",
    title: "Built like a consumer learning brand.",
    body: "The product should feel welcoming, premium, and outcome-led, not like a back-office knowledge console.",
  },
  {
    label: "Content lens",
    title: "Reference plus study system.",
    body: "Every term needs a quick read, then a deeper path into comparisons, diagrams, and explainers.",
  },
  {
    label: "Interaction lens",
    title: "Learn by doing, not just reading.",
    body: "Bookmarks, notes, annotations, quizzes, exports, and shares should feel central rather than buried.",
  },
];

export function HomePage() {
  const { paths, terms, termMap, isLoading, error } = useCatalog();
  const featuredPaths = paths.slice(0, 3);
  const featuredCount = terms.filter((term) => term.metadata.editorialTier === "featured").length;
  const standardCount = terms.filter((term) => term.metadata.editorialTier === "standard").length;
  const sparseCount = terms.filter((term) => term.metadata.editorialTier === "sparse").length;
  const featuredTerms = [...new Set(featuredPaths.flatMap((path) => path.featuredTermSlugs))]
    .slice(0, 12)
    .map((slug) => termMap.get(slug))
    .filter(isDefined);
  const sampleTerm = featuredTerms[0] ?? terms.find((term) => term.metadata.editorialTier === "featured") ?? null;
  const samplePath = featuredPaths[0] ?? paths[0] ?? null;
  const flagshipLaneCards = buildFamilyHighlights(terms)
    .map((family) => {
      const familyPaths = paths.filter(
        (path) =>
          path.category === family.title ||
          path.title.toLowerCase().includes(family.title.toLowerCase()) ||
          path.subCategory.toLowerCase().includes(family.title.toLowerCase()),
      );
      const starterTerm = family.strongestTerm;

      return {
        ...family,
        pathCount: familyPaths.length,
        starterPath: familyPaths[0] ?? null,
        starterTerm,
      };
    })
    .slice(0, 8);

  return (
    <div className="page-grid">
      <section className="hero-card hero-home">
        <div className="hero-copy">
          <p className="eyebrow">For serious AI learners</p>
          <h2>Build an AI learning system you can actually inspect, test, and return to.</h2>
          <p className="hero-lead">
            AIGlossary Pro is not a glossary pasted onto a search page. It is a premium study
            surface for people who want to understand the language of AI deeply enough to think,
            speak, and build with it.
          </p>
          <div className="hero-runtime-grid">
            <article className="hero-runtime-card">
              <span>Published terms</span>
              <strong>{terms.length.toLocaleString()}</strong>
              <p>live entries ready for search and deep-link testing</p>
            </article>
            <article className="hero-runtime-card">
              <span>Guided paths</span>
              <strong>{paths.length.toLocaleString()}</strong>
              <p>learning trails you can inspect instead of vague topic buckets</p>
            </article>
            <article className="hero-runtime-card">
              <span>Tier mix</span>
              <strong>{featuredCount.toLocaleString()} featured</strong>
              <p>{standardCount.toLocaleString()} standard, {sparseCount.toLocaleString()} sparse</p>
            </article>
          </div>
          <div className="term-tier-row">
            <span className="term-tier term-tier-featured">Featured concepts</span>
            <span className="term-tier term-tier-standard">Standard corpus</span>
            <span className="term-tier term-tier-sparse">Sparse long tail</span>
          </div>
          <div className="hero-actions">
            <Link className="primary-button" to="/field-lab">
              Inspect the Whole App
            </Link>
            <Link className="ghost-button" to="/explore">
              Enter the Library
            </Link>
            <Link className="ghost-button" to={sampleTerm ? `/term/${sampleTerm.slug}` : "/explore"}>
              Open a Real Term
            </Link>
            <Link className="ghost-button" to={samplePath ? `/paths/${samplePath.slug}` : "/paths"}>
              Open a Guided Trail
            </Link>
          </div>
          <div className="trust-row">
            <span>Routes, structures, and term coverage visible from one lab surface</span>
            <span>Bookmarks, notes, annotations, exports, and path memory</span>
            <span>No free-tier bait-and-switch</span>
          </div>
        </div>
        <div className="hero-showcase">
          <div className="field-guide-panel">
            <div className="field-guide-spine">
              <span>Issue 01</span>
              <span>Command Deck</span>
            </div>
            <div className="field-guide-sheet">
              <p className="showcase-label">Live product inspection</p>
              <h3>Stop guessing what exists. Open the routes, terms, paths, and study loop directly.</h3>
              <p>
                The app should feel like a working learning machine, not a static poster for one.
                The field lab turns the corpus, features, and structure contract into something you
                can actively verify.
              </p>
              <div className="guide-tags">
                <span>{terms.length.toLocaleString()} terms</span>
                <span>{paths.length.toLocaleString()} paths</span>
                <span>Study memory</span>
              </div>
            </div>
          </div>
          <LearningAtlasCard />
          <StructureExplorerCard />
          <div className="artifact-strip">
            {studyArtifacts.map((artifact) => (
              <article key={artifact.title} className="artifact-card">
                <p className="showcase-label">{artifact.title}</p>
                <h3>{artifact.label}</h3>
                <p>{artifact.body}</p>
              </article>
            ))}
          </div>
          <div className="showcase-quote">
            <p className="showcase-label">Why this exists</p>
            <p>
              Most AI learners are drowning in fragments. This product should feel like stepping
              into a disciplined private library.
            </p>
          </div>
          <section className="concept-path-preview">
            {featuredPaths.length ? (
              featuredPaths.map((path) => (
                <article key={path.slug} className="concept-path-card">
                  <p className="showcase-label">
                    {path.category} / {path.subCategory}
                  </p>
                  <h3>{path.title}</h3>
                  <p>{path.description}</p>
                  <div className="path-row">
                    <span>{path.termCount} terms in cluster</span>
                    <span>{path.featuredTermSlugs.length} anchors</span>
                  </div>
                  <Link className="text-link" to={`/paths/${path.slug}`}>
                    Open path
                  </Link>
                </article>
              ))
            ) : (
              <article className="concept-path-card">
                <p className="showcase-label">Published paths</p>
                <h3>Loading real learning trails</h3>
                <p>These previews are rendered from the generated corpus, not from sample content.</p>
              </article>
            )}
          </section>
          <div className="curriculum-grid">
            {curriculumModes.map((mode) => (
              <article key={mode.title} className={`curriculum-card curriculum-card-${mode.accent}`}>
                <p className="showcase-label">{mode.accent}</p>
                <h3>{mode.title}</h3>
                <p>{mode.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="format-rail">
        <div className="section-header">
          <p className="eyebrow">Browse by mode</p>
          <h2>Different parts of the app answer different learning jobs.</h2>
          <p>
            The app should not feel like one endless wall of terms. It should feel like a study
            system with clear moves: read, follow, save, and review.
          </p>
        </div>
        <div className="format-grid">
          {contentModes.map((mode) => (
            <article key={mode.title} className="format-card">
              <p className="showcase-label">{mode.label}</p>
              <h3>{mode.title}</h3>
              <p>{mode.note}</p>
              <Link className="text-link" to={mode.route}>
                Open {mode.title.toLowerCase()}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="learning-lens-rail">
        <div className="section-header">
          <p className="eyebrow">Why the product feels different</p>
          <h2>We are designing for industry pattern, content type, and interactivity together.</h2>
          <p>
            The app should not read as a text wall. It should feel like a consumer study surface
            where visual proof, concept movement, and memory tools are all visible from the start.
          </p>
        </div>
        <div className="learning-lens-grid">
          {learningLenses.map((lens) => (
            <article key={lens.label} className="learning-lens-card">
              <p className="showcase-label">{lens.label}</p>
              <h3>{lens.title}</h3>
              <p>{lens.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="flagship-family-rail">
        <div className="section-header">
          <p className="eyebrow">Flagship families</p>
          <h2>The deepest content should feel deliberately authored, not uniformly generated.</h2>
          <p>
            These are the concept families where the app should lean hardest into comparisons,
            quizzes, diagrams, and deep dives so the learning experience feels curated.
          </p>
        </div>
        <div className="flagship-family-grid">
          {flagshipLaneCards.map((family) => (
            <article key={family.title} className="flagship-family-card">
              <p className="showcase-label">{family.title}</p>
              <h3>{family.note}</h3>
              <p>{family.whyItMatters}</p>
              <div className="family-lane-chip-row">
                <span>{family.count} terms</span>
                <span>{family.featuredCount} flagship</span>
                <span>{family.pathCount} paths</span>
              </div>
              <div className="hero-actions">
                <Link className="text-link" to={`/families/${familySlug(family.title)}`}>
                  Open family lane
                </Link>
                {family.starterTerm ? (
                  <Link className="text-link" to={`/term/${family.starterTerm.slug}`}>
                    Start here
                  </Link>
                ) : null}
                {family.starterPath ? (
                  <Link className="text-link" to={`/paths/${family.starterPath.slug}`}>
                    Open path
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <LaunchCurriculumPreview />
      <ContinueLearningCard />
      <ContinuePathCard />
      <RecentActivityCard />
      <StudyMemoryCard />
      <CorpusProgressPreview />

      <section className="ritual-grid">
        {rituals.map((item) => (
          <article key={item.title} className="ritual-card">
            <p className="ritual-index">{item.index}</p>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </section>

      <section className="editorial-strip">
        <div className="section-header">
          <p className="eyebrow">Inside the library</p>
          <h2>Definitions are only the front door.</h2>
          <p>
            The real value is returning to the same concept network with memory, intent, and your
            own accumulated notes. That is the difference between reference material and a serious
            learning product.
          </p>
        </div>
        {isLoading ? (
          <article className="summary-card">
            <h3>Loading catalog</h3>
            <p>Reading the current published term manifest.</p>
          </article>
        ) : error ? (
          <article className="summary-card">
            <h3>Catalog unavailable</h3>
            <p>{error}</p>
          </article>
        ) : (
          <div className="card-grid featured-cards">
            {featuredTerms.map((term) => (
              <TermCard key={term.slug} term={term} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
