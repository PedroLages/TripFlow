# TripFlow Documentation

Welcome to the TripFlow documentation. This folder contains detailed guides, architecture docs, and API references.

## Documentation Structure

```
docs/
├── README.md              # This file - documentation index
├── guides/                # User and developer guides
│   ├── getting-started.md # Quick start guide
│   ├── development.md     # Development setup and workflow
│   └── deployment.md      # Deployment instructions
├── architecture/          # Technical architecture docs
│   ├── overview.md        # System architecture overview
│   ├── components.md      # Component hierarchy and patterns
│   └── data-flow.md       # State management and data flow
├── api/                   # API documentation
│   ├── types.md           # TypeScript interfaces reference
│   ├── services.md        # Service layer documentation
│   └── integrations.md    # External API integrations
└── design/                # Design documentation
    ├── design-system.md   # Design tokens and components
    └── ui-patterns.md     # Common UI patterns
```

## Quick Links

### For New Developers
1. [Getting Started](guides/getting-started.md) - Set up your development environment
2. [Development Guide](guides/development.md) - Coding standards and workflows
3. [Architecture Overview](architecture/overview.md) - Understand the codebase

### For Reference
- [TypeScript Types](api/types.md) - All type definitions
- [Component Guide](architecture/components.md) - Component patterns
- [Design System](design/design-system.md) - UI components and styling

### Root Documentation
These files are in the repository root:
- [README.md](../README.md) - Project overview and quick start
- [CLAUDE.md](../CLAUDE.md) - Claude Code configuration and coding standards
- [TODOS.md](../TODOS.md) - Feature roadmap and task tracking
- [SECURITY.md](../SECURITY.md) - Security guidelines

### Claude Code Configuration
Located in `.claude/` directory:
- [Design Principles](../.claude/context/design-principles.md) - UI/UX guidelines
- [Code Review Skill](../.claude/skills/code-review.md) - Review framework
- [Security Review Skill](../.claude/skills/security-review.md) - Security scanning
- [Design Review Agent](../.claude/agents/design-review.md) - Design validation

## Contributing to Documentation

When adding new documentation:

1. **Choose the right folder**:
   - `guides/` - How-to guides and tutorials
   - `architecture/` - Technical design decisions
   - `api/` - API and type references
   - `design/` - UI/UX documentation

2. **Follow the template**:
   ```markdown
   # Document Title

   > Brief description of what this document covers

   ## Overview
   [Introduction and context]

   ## [Main Sections]
   [Content organized with clear headings]

   ## Related Documentation
   - [Link to related docs]
   ```

3. **Update this index** when adding new documents

4. **Keep docs in sync** with code changes
