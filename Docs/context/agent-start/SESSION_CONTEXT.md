# Session Context

- Generated: 2026-07-04T15:48:59Z
- Project: `aiglossary_v2`
- Provider: `local`
- Model: `BAAI/bge-m3`
- Project collection: `projects_proj_aiglossary_v2`
- Shared collection: `projects_workspace_shared`

## Project Motto

- File: `/Users/pranay/Projects/aiglossary_v2/motto_v3.md`
- Legacy bridge: `/Users/pranay/Projects/aiglossary_v2/motto_v2.md`
- Source: `/Users/pranay/Downloads/motto_v3.md`
- Sync status: `synced from /Users/pranay/Downloads/motto_v3.md; legacy motto_v2.md symlinked to motto_v3.md`
- Guidance: read this before implementation or review on this project.

## Project-Focused Retrieval

### Architecture Decisions
- Collection: `projects_proj_aiglossary_v2`
- Query: `architecture decisions for aiglossary_v2`
_Fast mode (--skip-index): retrieval skipped to keep startup non-blocking. Run `/Users/pranay/Projects/agent-start --project aiglossary_v2` for full retrieval, or set `AGENT_START_SKIP_INDEX_RETRIEVE=1` if you want retrieval with skip-index._

### Project Management Workflow
- Collection: `projects_proj_aiglossary_v2`
- Query: `project management workflow for aiglossary_v2`
_Fast mode (--skip-index): retrieval skipped to keep startup non-blocking. Run `/Users/pranay/Projects/agent-start --project aiglossary_v2` for full retrieval, or set `AGENT_START_SKIP_INDEX_RETRIEVE=1` if you want retrieval with skip-index._

### Known Issues and Worklogs
- Collection: `projects_proj_aiglossary_v2`
- Query: `known issues and worklog for aiglossary_v2`
_Fast mode (--skip-index): retrieval skipped to keep startup non-blocking. Run `/Users/pranay/Projects/agent-start --project aiglossary_v2` for full retrieval, or set `AGENT_START_SKIP_INDEX_RETRIEVE=1` if you want retrieval with skip-index._

### Prompts and Guidelines
- Collection: `projects_proj_aiglossary_v2`
- Query: `prompts and guidelines for aiglossary_v2`
_Fast mode (--skip-index): retrieval skipped to keep startup non-blocking. Run `/Users/pranay/Projects/agent-start --project aiglossary_v2` for full retrieval, or set `AGENT_START_SKIP_INDEX_RETRIEVE=1` if you want retrieval with skip-index._

### System Learning Graph
- Collection: `projects_proj_aiglossary_v2`
- Query: `knowledge graph memory learning feedback loops autoresearch semantic taste graph for aiglossary_v2`
_Fast mode (--skip-index): retrieval skipped to keep startup non-blocking. Run `/Users/pranay/Projects/agent-start --project aiglossary_v2` for full retrieval, or set `AGENT_START_SKIP_INDEX_RETRIEVE=1` if you want retrieval with skip-index._

## Shared Cross-Project Retrieval

### Reusable Patterns
- Collection: `projects_workspace_shared`
- Query: `similar architecture patterns for aiglossary_v2`
_Fast mode (--skip-index): retrieval skipped to keep startup non-blocking. Run `/Users/pranay/Projects/agent-start --project aiglossary_v2` for full retrieval, or set `AGENT_START_SKIP_INDEX_RETRIEVE=1` if you want retrieval with skip-index._

### Process Templates
- Collection: `projects_workspace_shared`
- Query: `project management templates and workflows`
_Fast mode (--skip-index): retrieval skipped to keep startup non-blocking. Run `/Users/pranay/Projects/agent-start --project aiglossary_v2` for full retrieval, or set `AGENT_START_SKIP_INDEX_RETRIEVE=1` if you want retrieval with skip-index._

### Common Failure Modes
- Collection: `projects_workspace_shared`
- Query: `lessons learned mistakes retrospectives postmortems`
_Fast mode (--skip-index): retrieval skipped to keep startup non-blocking. Run `/Users/pranay/Projects/agent-start --project aiglossary_v2` for full retrieval, or set `AGENT_START_SKIP_INDEX_RETRIEVE=1` if you want retrieval with skip-index._

### System Learning Graph
- Collection: `projects_workspace_shared`
- Query: `knowledge graph memory learning feedback loops autoresearch semantic taste graph`
_Fast mode (--skip-index): retrieval skipped to keep startup non-blocking. Run `/Users/pranay/Projects/agent-start --project aiglossary_v2` for full retrieval, or set `AGENT_START_SKIP_INDEX_RETRIEVE=1` if you want retrieval with skip-index._


---
## Agent Collaboration Style

Pranay expects the agent to act as a genuine technical collaborator, not an instruction executor:
- Have and express opinions on design, naming, logic, test quality
- Push back when something is wrong - don't just flag it, fix it with a rationale
- Catch bugs proactively without waiting to be asked
- Discuss tradeoffs directly: here is why X is wrong and Y is better
- The goal is two engineers reviewing each other's work, not a contractor following a spec

This applies to code review, test quality, naming, architecture boundaries, commit grouping strategy, and anything that would affect the project long-term.
