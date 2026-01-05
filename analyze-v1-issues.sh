#!/bin/bash

# V1 Issues Analysis Script
# Run this to generate comprehensive report of V1 problems

OUTPUT="v1-analysis-report.md"

echo "# TripFlow V1 Issues Analysis Report" > $OUTPUT
echo "Generated: $(date)" >> $OUTPUT
echo "" >> $OUTPUT

echo "Analyzing V1 codebase for patterns and issues..."

# ============================================
# 1. MOST CHANGED FILES
# ============================================
echo "## 1. Most Frequently Changed Files (Pain Points)" >> $OUTPUT
echo "" >> $OUTPUT
echo "These files changed most often, indicating areas of instability:" >> $OUTPUT
echo "" >> $OUTPUT
echo '```' >> $OUTPUT

git log --pretty=format: --name-only |
  grep -v '^$' |
  grep -v 'migrations/' |
  grep -v 'package-lock.json' |
  grep -v 'node_modules' |
  grep '\.tsx\?$' |
  sort | uniq -c | sort -rn | head -20 >> $OUTPUT

echo '```' >> $OUTPUT
echo "" >> $OUTPUT

# ============================================
# 2. BUG FIX PATTERNS
# ============================================
echo "## 2. Bug Fix Patterns" >> $OUTPUT
echo "" >> $OUTPUT

echo "### Fixes for Modal Issues" >> $OUTPUT
echo '```' >> $OUTPUT
git log --oneline --all --grep="modal" | head -20 >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "### Fixes for Save/Refresh Issues" >> $OUTPUT
echo '```' >> $OUTPUT
git log --oneline --all --grep="save\|refresh\|sync" | head -20 >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "### Fixes for Trip Management" >> $OUTPUT
echo '```' >> $OUTPUT
git log --oneline --all --grep="trip" | head -20 >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

# ============================================
# 3. REVERTED COMMITS
# ============================================
echo "## 3. Reverted Commits (Failed Attempts)" >> $OUTPUT
echo "" >> $OUTPUT
echo "Features or fixes that were reverted indicate wrong approaches:" >> $OUTPUT
echo "" >> $OUTPUT
echo '```' >> $OUTPUT
git log --oneline --all --grep="Revert" >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

# ============================================
# 4. WORKAROUNDS AND HACKS
# ============================================
echo "## 4. Temporary Solutions (Technical Debt)" >> $OUTPUT
echo "" >> $OUTPUT
echo "Commits mentioning workarounds, hacks, or temporary fixes:" >> $OUTPUT
echo "" >> $OUTPUT
echo '```' >> $OUTPUT
git log --oneline --all --grep="hack\|workaround\|temp\|TODO\|FIXME" | head -30 >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

# ============================================
# 5. CODE COMPLEXITY
# ============================================
echo "## 5. Code Complexity Analysis" >> $OUTPUT
echo "" >> $OUTPUT

echo "### Largest Files (Likely Too Complex)" >> $OUTPUT
echo "" >> $OUTPUT
echo '```' >> $OUTPUT
find components -name "*.tsx" -exec wc -l {} \; 2>/dev/null | sort -rn | head -20 >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "### Files with Many Imports (High Coupling)" >> $OUTPUT
echo "" >> $OUTPUT
echo '```' >> $OUTPUT
for file in components/*.tsx; do
  if [ -f "$file" ]; then
    count=$(grep -c "^import" "$file" 2>/dev/null || echo 0)
    echo "$count imports: $file"
  fi
done | sort -rn | head -15 >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

# ============================================
# 6. STATE MANAGEMENT COMPLEXITY
# ============================================
echo "## 6. React Hooks Complexity" >> $OUTPUT
echo "" >> $OUTPUT

echo "### Components with Many useState (Complex State)" >> $OUTPUT
echo "" >> $OUTPUT
echo '```' >> $OUTPUT
for file in components/*.tsx; do
  if [ -f "$file" ]; then
    count=$(grep -c "useState" "$file" 2>/dev/null || echo 0)
    if [ $count -gt 5 ]; then
      echo "$count useState calls: $file"
    fi
  fi
done | sort -rn >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "### Components with Many useEffect (Side Effects)" >> $OUTPUT
echo "" >> $OUTPUT
echo '```' >> $OUTPUT
for file in components/*.tsx; do
  if [ -f "$file" ]; then
    count=$(grep -c "useEffect" "$file" 2>/dev/null || echo 0)
    if [ $count -gt 3 ]; then
      echo "$count useEffect calls: $file"
    fi
  fi
done | sort -rn >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

# ============================================
# 7. TODO/FIXME COMMENTS
# ============================================
echo "## 7. Known Issues in Code (TODO/FIXME Comments)" >> $OUTPUT
echo "" >> $OUTPUT
echo "Developers left these notes about problems:" >> $OUTPUT
echo "" >> $OUTPUT
echo '```' >> $OUTPUT
git grep -n "TODO\|FIXME\|HACK\|XXX" -- "*.tsx" "*.ts" 2>/dev/null | head -50 >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "### Summary" >> $OUTPUT
echo "" >> $OUTPUT
TODO_COUNT=$(git grep "TODO" -- "*.tsx" "*.ts" 2>/dev/null | wc -l)
FIXME_COUNT=$(git grep "FIXME" -- "*.tsx" "*.ts" 2>/dev/null | wc -l)
HACK_COUNT=$(git grep "HACK" -- "*.tsx" "*.ts" 2>/dev/null | wc -l)

echo "- TODO comments: $TODO_COUNT" >> $OUTPUT
echo "- FIXME comments: $FIXME_COUNT" >> $OUTPUT
echo "- HACK comments: $HACK_COUNT" >> $OUTPUT
echo "" >> $OUTPUT

# ============================================
# 8. LARGE REFACTORS
# ============================================
echo "## 8. Major Refactoring Attempts" >> $OUTPUT
echo "" >> $OUTPUT
echo "Large commits that changed many files (attempted architectural improvements):" >> $OUTPUT
echo "" >> $OUTPUT
echo '```' >> $OUTPUT
git log --oneline --shortstat |
  awk '/files? changed/ {files=$1; inserted=$4; deleted=$6}
       /^[0-9a-f]{7}/ {if(files>10) print files, "files,", inserted, "insertions,", deleted, "deletions:", $0; files=0}' |
  head -15 >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

# ============================================
# 9. TYPESCRIPT ERRORS
# ============================================
echo "## 9. TypeScript Errors" >> $OUTPUT
echo "" >> $OUTPUT
echo "Current type safety issues:" >> $OUTPUT
echo "" >> $OUTPUT
echo '```' >> $OUTPUT
npx tsc --noEmit 2>&1 | head -50 >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "✅ Analysis complete! Report saved to: $OUTPUT"
echo ""
echo "Next steps:"
echo "1. Review $OUTPUT"
echo "2. Identify top 5 pain points"
echo "3. Plan V2 architecture to avoid these issues"
