import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
      <Tabs value={activeTab.key} onValueChange={(value) => onSelect(value as TermExtraTabKey)}>
        <TabsList aria-label="More on this term">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            {tab.blocks.map((block) => (
              <TermBlockRenderer key={block.id} block={block} />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
