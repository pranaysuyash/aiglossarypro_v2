# aiglossary_v2 content pipeline issue review

Date: 2026-07-04

## Scope

Review the published content pipeline in `tools/build_published_content.py` and the committed `public/content/published` artifacts.

## Findings

1. The `structure-expansion` block was only emitted for featured terms, which made the structure bridge inconsistent with the rest of the launch runtime.
2. The structure expansion highlight order used raw layer-string sorting, which placed backlog sections ahead of editorial-expansion sections.
3. The emitted `editorialSections` array discarded the explicit editorial section order from the source contract.
4. The committed published corpus had drifted from the build output, with path counts no longer matching the regenerated corpus.

## Resolution

- Emit `structure-expansion` for every published term.
- Rank editorial-expansion sections ahead of backlog sections inside the structure-expansion block.
- Preserve the explicit editorial section order in `structure-registry.json`.
- Regenerate the published corpus after the builder change so the checked-in artifacts match the source workbooks again.

## Verification

- Focused unittest coverage in `tests/test_build_published_content.py`
- Full corpus rebuild from `data_glossary.xlsx` and `data_structure.xlsx`

