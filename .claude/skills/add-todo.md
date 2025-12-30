# Add TripFlow TODO

## Overview
Add a new todo item to TODOS.md with proper formatting and categorization.

## Usage
```
/add-todo "P2 | feature/calendar | Implement Google Calendar sync"
/add-todo "P1 | fix/budget | Fix NaN error in expense calculations"
/add-todo "P3 | chore/testing | Add unit tests for date utilities"
```

## Format
```
"<Priority> | <branch-name> | <Description>"
```

Where:
- **Priority**: P0 (Critical), P1 (High), P2 (Medium), P3 (Low), P4 (Wishlist)
- **Branch Name**: `feature/xxx`, `fix/xxx`, `chore/xxx`, `docs/xxx`
- **Description**: Clear, actionable description of the task

## Process

### 1. Parse Input
Extract from the user's input:
- Priority level (P0-P4)
- Branch name/type
- Description

If format is incomplete, ask for clarification:
```
Please provide the todo in format: "P2 | feature/name | Description"
```

### 2. Determine Section
Based on branch type and priority:

| Type | Section |
|------|---------|
| feature/ (P1) | Tier 1: High-Impact, Quick Wins |
| feature/ (P2) | Tier 2: Major Features |
| feature/ (P3-P4) | Tier 3 or Tier 4 |
| fix/ | Bug Fixes & Polish |
| chore/ | Technical Improvements |
| docs/ | Documentation |

### 3. Read Current TODOS.md
```bash
cat TODOS.md
```

### 4. Add New Item
Insert the new todo in the appropriate section with format:
```markdown
- [ ] **<Priority>** | `<branch>` | <Description>
```

### 5. Write Updated File
Use the Edit tool to insert the new item in the correct section.

### 6. Confirm Addition
Output:
```
✅ Added to TODOS.md:
- [ ] **P2** | `feature/calendar` | Implement Google Calendar sync

Section: Tier 2: Major Features
Run `/todos` to see the updated list.
```

## Quick Add Shortcuts
For simpler additions without full format:

```
/add-todo bug "Fix timezone issues in itinerary"
→ Adds as: - [ ] **P2** | `fix/timezone` | Fix timezone issues in itinerary

/add-todo feature "Add photo gallery to trips"
→ Adds as: - [ ] **P2** | `feature/photos` | Add photo gallery to trips

/add-todo urgent "Critical security fix for API keys"
→ Adds as: - [ ] **P0** | `fix/security` | Critical security fix for API keys
```

## Examples

### Full Format
```
/add-todo "P1 | feature/offline | PWA offline support with service workers"
```
Result:
```markdown
- [ ] **P1** | `feature/offline` | PWA offline support with service workers
  - Service worker implementation
  - IndexedDB for local storage
  - Background sync
```

### Bug Fix
```
/add-todo "P2 | fix/mobile-scroll | Fix modal scrolling on iOS Safari"
```
Result in Bug Fixes section:
```markdown
- [ ] **P2** | `fix/mobile-scroll` | Fix modal scrolling on iOS Safari
```

### Documentation
```
/add-todo "P3 | docs/api | Document Gemini API integration"
```
Result in Documentation section:
```markdown
- [ ] **P3** | `docs/api` | Document Gemini API integration
```

## File Location
`/TODOS.md` - Root of repository

## Related Commands
- `/todos` - View current todo list
- `/todos summary` - See todo statistics
