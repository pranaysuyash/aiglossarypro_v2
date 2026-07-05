import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCatalog } from "../content/CatalogContext";
import { getDueReviews } from "../study/progress";

const dueDateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export function ReviewPage() {
  const { termMap } = useCatalog();
  const dueReviews = getDueReviews();

  const dueTerms = dueReviews
    .map((entry) => ({ entry, term: termMap.get(entry.termSlug) }))
    .filter((row): row is { entry: (typeof dueReviews)[number]; term: NonNullable<ReturnType<typeof termMap.get>> } =>
      Boolean(row.term),
    );

  return (
    <section className="page-grid">
      <div className="section-header">
        <p className="eyebrow">Review</p>
        <h2>Concepts due for a second look.</h2>
        <p>
          Every time you answer a quiz, that term gets scheduled for spaced review — sooner if you got
          it wrong, further out each time you get it right. This queue is only built from quizzes you've
          actually taken.
        </p>
      </div>

      {dueTerms.length ? (
        <div className="card-grid">
          {dueTerms.map(({ entry, term }) => (
            <article key={entry.termSlug} className="term-card">
              <div className="term-card-header">
                <div>
                  <p className="term-taxonomy">
                    {term.taxonomy.category} / {term.taxonomy.subCategory}
                  </p>
                  <h2>{term.title}</h2>
                </div>
                <Badge variant="chip">Box {entry.box}</Badge>
              </div>
              <p>{term.summary}</p>
              <p className="term-metrics">
                Due {dueDateFormatter.format(new Date(entry.dueAt))} · answer the quiz again to move it forward
              </p>
              <Button variant="link" asChild>
                <Link to={`/term/${term.slug}#quick-quiz`}>Review quiz</Link>
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <article className="summary-card">
          <h3>Nothing due right now.</h3>
          <p>
            Answer a quick quiz on any term page and it will show up here when it's time to review it
            again. This queue only ever contains concepts you've actually studied.
          </p>
          <Button variant="link" asChild>
            <Link to="/explore">Find a term to study</Link>
          </Button>
        </article>
      )}
    </section>
  );
}
