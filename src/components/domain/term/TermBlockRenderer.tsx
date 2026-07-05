import { memo, useState } from "react";
import { useParams } from "react-router-dom";
import { StudyRichText } from "./StudyRichText";
import type { TermBlock } from "../../../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { recordQuizAttempt } from "../../../study/progress";

export const TermBlockRenderer = memo(function TermBlockRenderer({ block }: { block: TermBlock }) {
  switch (block.type) {
    case "markdown": {
      const kicker =
        block.id === "source-definition"
          ? "Source-backed excerpt"
          : block.id === "why-it-matters"
            ? "Editorial note"
            : "Concept note";

      return (
        <section id={block.id} className="term-block" data-block-id={block.id}>
          <p className="block-kicker">{kicker}</p>
          <h3>{block.title}</h3>
          <StudyRichText>{block.body}</StudyRichText>
        </section>
      );
    }

    case "bullets": {
      const kicker =
        block.id === "taxonomy"
          ? "Source taxonomy"
          : block.id === "comparison-notes"
            ? "Study comparisons"
            : "Reference list";

      return (
        <section id={block.id} className="term-block" data-block-id={block.id}>
          <p className="block-kicker">{kicker}</p>
          <h3>{block.title}</h3>
          <ul>
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      );
    }

    case "table":
      return (
        <section id={block.id} className="term-block term-block-table" data-block-id={block.id}>
          <p className="block-kicker">At a glance</p>
          <h3>{block.title}</h3>
          <table className="term-info-table">
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      );

    case "callout":
      return (
        <section id={block.id} className={`term-block term-callout term-callout-${block.tone}`} data-block-id={block.id}>
          <p className="block-kicker">Visual summary</p>
          <h3>{block.title}</h3>
          <StudyRichText>{block.body}</StudyRichText>
        </section>
      );

    case "diagram":
      return (
        <section id={block.id} className="term-block term-diagram-block" data-block-id={block.id}>
          <p className="block-kicker">Illustration / Diagram</p>
          <h3>{block.title}</h3>
          <div className="diagram-canvas">
            <div className="diagram-lane diagram-lane-accent">
              <p>Before</p>
              <div className="diagram-pills">
                {block.lanes[0]?.items.length ? (
                  block.lanes[0].items.map((item) => (
                    <span key={item} className="diagram-pill">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="diagram-pill diagram-pill-empty">No prerequisite graph labels surfaced</span>
                )}
              </div>
            </div>
            <div className="diagram-center">
              <span className="diagram-center-kicker">Current term</span>
              <strong>{block.center.label}</strong>
              <span>{block.center.caption || "JSON learning node"}</span>
            </div>
            <div className="diagram-lane diagram-lane-secondary">
              <p>Compare</p>
              <div className="diagram-pills">
                {block.lanes[1]?.items.length ? (
                  block.lanes[1].items.map((item) => (
                    <span key={item} className="diagram-pill">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="diagram-pill diagram-pill-empty">No peer labels surfaced</span>
                )}
              </div>
            </div>
            <div className="diagram-lane diagram-lane-gold">
              <p>After</p>
              <div className="diagram-pills">
                {block.lanes[2]?.items.length ? (
                  block.lanes[2].items.map((item) => (
                    <span key={item} className="diagram-pill">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="diagram-pill diagram-pill-empty">No downstream labels surfaced</span>
                )}
              </div>
            </div>
          </div>
          <StudyRichText className="diagram-takeaway" variant="compact">
            {block.takeaway}
          </StudyRichText>
        </section>
      );

    case "faq":
      return (
        <section id={block.id} className="term-block term-faq-block" data-block-id={block.id}>
          <p className="block-kicker">Frequently asked questions</p>
          <h3>{block.title}</h3>
          <Accordion type="multiple" className="faq-list">
            {block.items.map((item) => (
              <AccordionItem key={item.question} value={item.question} className="faq-item">
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>
                  <StudyRichText variant="compact">{item.answer}</StudyRichText>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      );

    case "curriculum-map":
      return (
        <section id={block.id} className="term-block term-curriculum-block" data-block-id={block.id}>
          <p className="block-kicker">Curriculum map</p>
          <h3>{block.title}</h3>
          <div className="curriculum-block-grid">
            {block.sections.map((section) => (
              <article key={section.section} className="curriculum-block-card">
                <Badge variant="tier">
                  {section.status}
                </Badge>
                <h4>{section.section}</h4>
                <StudyRichText variant="compact">{section.note}</StudyRichText>
                <div className="flex flex-wrap gap-2">
                  {section.runtimeBlocks.map((runtimeBlock) => (
                    <Badge key={runtimeBlock} variant="chip">{runtimeBlock}</Badge>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      );

    case "structure-expansion":
      return (
        <section id={block.id} className="term-block term-structure-expansion-block" data-block-id={block.id}>
          <p className="block-kicker">Structure expansion</p>
          <h3>{block.title}</h3>
          <div className="structure-expansion-grid">
            {block.sections.map((section) => (
              <article key={section.section} className="structure-expansion-card">
                <Badge variant="tier">
                  {section.layer}
                </Badge>
                <h4>{section.section}</h4>
                <p>{section.fieldCount} structure fields</p>
                <div className="flex flex-wrap gap-2">
                  {section.sampleFields.map((field) => (
                    <Badge key={field} variant="chip">{field}</Badge>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      );

    case "deep-dive":
      return (
        <section id={block.id} className="term-block term-deep-dive-block" data-block-id={block.id}>
          <p className="block-kicker">Featured depth</p>
          <h3>{block.title}</h3>
          <div className="deep-dive-grid">
            {block.panels.map((panel) => (
              <article key={panel.label} className={`deep-dive-panel deep-dive-panel-${panel.tone}`}>
                <p className="deep-dive-label">{panel.label}</p>
                <StudyRichText variant="compact">{panel.body}</StudyRichText>
              </article>
            ))}
          </div>
          <StudyRichText className="deep-dive-takeaway" variant="compact">
            {block.takeaway}
          </StudyRichText>
        </section>
      );

    case "comparison":
      return (
        <section id={block.id} className="term-block term-comparison-block" data-block-id={block.id}>
          <p className="block-kicker">Comparison view</p>
          <h3>{block.title}</h3>
          <div className="comparison-grid">
            {block.panels.map((panel) => (
              <article key={panel.label} className={`comparison-panel comparison-panel-${panel.tone}`}>
                <p className="comparison-label">{panel.label}</p>
                <StudyRichText variant="compact">{panel.body}</StudyRichText>
              </article>
            ))}
          </div>
          <StudyRichText className="comparison-takeaway" variant="compact">
            {block.takeaway}
          </StudyRichText>
        </section>
      );

    case "quiz":
      return <QuizBlock block={block} />;

    case "steps":
      return (
        <section id={block.id} className="term-block" data-block-id={block.id}>
          <p className="block-kicker">
            {block.id === "study-prompts" ? "Study sequence" : block.id === "recall-drill" ? "Recall drill" : "Learning steps"}
          </p>
          <h3>{block.title}</h3>
          <ol>
            {block.steps.map((step) => (
              <li key={step.label}>
                <strong>{step.label}:</strong> {step.body}
              </li>
            ))}
          </ol>
        </section>
      );

    default:
      return null;
  }
});

const QuizBlock = memo(function QuizBlock({ block }: { block: Extract<TermBlock, { type: "quiz" }> }) {
  const { slug } = useParams<{ slug?: string }>();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const isCorrect = selectedIndex === block.answerIndex;

  function checkAnswer() {
    setRevealed(true);
    if (slug && selectedIndex !== null) {
      recordQuizAttempt(slug, block.id, selectedIndex === block.answerIndex);
    }
  }

  return (
    <section id={block.id} className="term-block term-quiz-block" data-block-id={block.id}>
      <p className="block-kicker">Quick quiz</p>
      <h3>{block.title}</h3>
      <p>{block.question}</p>
      <div className="quiz-options">
        {block.options.map((option, index) => (
          <button
            key={option}
            className={`quiz-option ${selectedIndex === index ? "quiz-option-selected" : ""}`}
            aria-label={`${String.fromCharCode(65 + index)}. ${option}`}
            onClick={() => setSelectedIndex(index)}
            type="button"
          >
            <span className="quiz-option-label" aria-hidden="true">
              {String.fromCharCode(65 + index)}
            </span>
            <span>{option}</span>
          </button>
        ))}
      </div>
      <div className="hero-actions">
        <Button variant="raised" size="sm" onClick={checkAnswer} disabled={selectedIndex === null || revealed}>
          Check answer
        </Button>
      </div>
      {revealed && selectedIndex !== null ? (
        <p className={isCorrect ? "quiz-feedback quiz-feedback-correct" : "quiz-feedback quiz-feedback-wrong"}>
          {isCorrect ? "Correct." : "Not quite."} {block.explanation}
        </p>
      ) : revealed ? (
        <p className="quiz-feedback">{block.explanation}</p>
      ) : null}
    </section>
  );
});
