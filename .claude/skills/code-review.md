# Pragmatic Code Review for TripFlow

## Overview
This skill provides comprehensive code review focusing on practical quality improvements for TripFlow's React/TypeScript codebase.

## When to Use
- After completing a logical code chunk
- Before creating a pull request
- When implementing new features (especially trip planning, budget, or data management)
- After refactoring components or utilities
- When adding new API integrations

## Review Process

### 1. Gather Context
```bash
# Check what files changed
git status
git diff --name-only origin/main...

# Get the full diff
git diff origin/main...
```

### 2. Review Framework (Priority Order)

#### 🏗️ Architecture & Design
- **Component Structure**: Are components properly modularized following single responsibility?
- **Type Safety**: Is TypeScript used effectively with proper interfaces/types from types.ts?
- **State Management**: Is state properly lifted/colocated? Are we using the right hooks?
- **Data Flow**: Does data flow make sense for TripFlow's trip → tabs → features hierarchy?

#### ✅ Functionality & Correctness
- **Business Logic**: Do trip calculations (budget, dates, itinerary) work correctly?
- **Edge Cases**: What happens with empty trips, invalid dates, zero budgets?
- **Error Handling**: Are errors caught and displayed user-friendly?
- **Data Consistency**: Is the Trip type structure maintained across all operations?

#### 🔒 Security
- **Input Validation**: Are user inputs (trip names, amounts, dates) validated?
- **XSS Prevention**: Is user-generated content safely rendered?
- **API Keys**: Is the Gemini API key properly secured and not exposed?
- **Data Sanitization**: Are file uploads and external data properly handled?

#### 🧹 Maintainability & Readability
- **Code Clarity**: Is the code self-documenting? Are variable/function names clear?
- **Comments**: Are complex algorithms or business rules explained?
- **Consistency**: Does the code follow TripFlow's existing patterns?
- **Tech Debt**: Are there any obvious shortcuts that need addressing?

#### 🧪 Testing Strategy
- **Coverage**: Are critical paths tested (budget calculations, date handling)?
- **Edge Cases**: Are error conditions and boundary cases tested?
- **Integration**: Do components integrate well with existing TripFlow features?

#### ⚡ Performance & Optimization
- **React Performance**: Are there unnecessary re-renders? Missing memoization?
- **Bundle Size**: Will new dependencies significantly increase bundle size?
- **Algorithms**: Are data operations efficient (especially for lists/charts)?
- **Asset Loading**: Are images/documents loaded efficiently?

#### 📦 Dependencies & Documentation
- **New Dependencies**: Are new packages necessary and well-maintained?
- **Documentation**: Are complex features or API changes documented?
- **Types**: Are new types added to types.ts?

## Output Format

### Summary
Brief overview of changes and overall assessment.

### Critical Issues [BLOCKER]
Must be fixed before merge:
- **File:Line** - Issue description and impact

### High Priority [IMPROVEMENT]
Strongly recommended:
- **File:Line** - Issue description and suggested approach

### Medium Priority [NICE-TO-HAVE]
Consider addressing:
- **File:Line** - Issue description

### Nits [OPTIONAL]
Optional polish:
- **Nit:** Minor style or clarity improvements

### Positive Highlights
What's done well in this change.

## Philosophy
**Net Positive > Perfection** - Focus on meaningful improvements that enhance TripFlow's functionality, security, and maintainability. Don't block on style issues that CI can catch.
