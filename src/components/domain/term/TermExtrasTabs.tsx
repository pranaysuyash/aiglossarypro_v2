import { TermBlockRenderer } from "./TermBlockRenderer";
import type { TermExtraTab, TermExtraTabKey } from "../../../content/termBlockGroups";

export function TermExtrasTabs({
  tabs,
  activeKey,
  onSelect,
}: {
  tabs: TermExtraTab[];
  activeKey: TermExtraTabKey | undefined;
  onSelect: (key: TermExtraTabKey) => void;
}) {
  const activeTab = tabs.find((tab) => tab.key === activeKey) ?? tabs[0];

  if (!tabs.length || !activeTab) {
    return null;
  }

  return (
    <section className="term-extras" id="term-extras">
      <div className="term-extras-tablist" role="tablist" aria-label="More on this term">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === activeTab.key}
            className={`term-extras-tab ${tab.key === activeTab.key ? "term-extras-tab-active" : ""}`}
            onClick={() => onSelect(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="term-extras-panel" role="tabpanel">
        {activeTab.blocks.map((block) => (
          <TermBlockRenderer key={block.id} block={block} />
        ))}
      </div>
    </section>
  );
}
