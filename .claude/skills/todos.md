# View TripFlow TODOs

## Overview
Display the current feature roadmap and todo list from TODOS.md with filtering and summary options.

## Usage
```
/todos                    # Show full todo list
/todos summary            # Show summary by priority
/todos P1                 # Show only P1 (high priority) items
/todos in-progress        # Show items currently in progress
/todos completed          # Show completed items
/todos feature            # Filter by type (feature, fix, chore, docs)
```

## Process

### 1. Read the TODO File
```bash
cat TODOS.md
```

### 2. Parse and Display

#### Default View (Full List)
Display the entire TODOS.md file with markdown formatting.

#### Summary View
Count items by:
- **Priority**: P0, P1, P2, P3, P4
- **Status**: Not Started `[ ]`, In Progress `[~]`, Completed `[x]`
- **Type**: feature, fix, chore, docs

Example summary output:
```
📊 TripFlow TODO Summary
========================

By Priority:
  P0 (Critical):     0 items
  P1 (High):         6 items (4 pending, 2 in-progress)
  P2 (Medium):      12 items
  P3 (Low):          5 items
  P4 (Wishlist):     3 items

By Type:
  Features:         15 items
  Bug Fixes:         3 items
  Chores:            5 items
  Documentation:     3 items

Progress: 0/26 completed (0%)
```

#### Priority Filter
When filtering by priority (P0, P1, P2, P3, P4):
1. Search for lines matching the priority pattern
2. Display those items with their full description
3. Include the section header for context

#### Status Filter
- **in-progress**: Show items with `[~]`
- **completed**: Show items with `[x]`
- **pending**: Show items with `[ ]`

### 3. Actionable Output
After displaying, suggest next actions:
- "Run `/add-todo 'description'` to add a new item"
- "Edit TODOS.md directly to update status or details"
- "Use `git diff TODOS.md` to see recent changes"

## Integration with Development
- When starting work on a feature, update `[ ]` to `[~]`
- When completing work, update `[~]` to `[x]` and move to Completed section
- Reference todo items in commit messages: `feat(budget): implement expense splitting [P1]`

## File Location
`/TODOS.md` - Root of repository
