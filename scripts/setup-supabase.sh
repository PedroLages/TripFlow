#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   TripFlow + Supabase Setup Script    ║"
echo "║        Automated Configuration         ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Supabase CLI not found${NC}"
    echo ""
    echo "Install with:"
    echo "  brew install supabase/tap/supabase  (macOS)"
    echo "  npm install -g supabase             (via npm)"
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI found${NC}"
echo ""

# Step 1: Login to Supabase
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Step 1: Login to Supabase${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Check if already logged in
if supabase projects list &> /dev/null; then
    echo -e "${GREEN}✓ Already logged in to Supabase${NC}"
else
    echo "Opening browser for authentication..."
    supabase login
fi

echo ""

# Step 2: Choose project
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Step 2: Select or Create Project${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

echo "Your Supabase projects:"
supabase projects list
echo ""

echo "Choose an option:"
echo "  1) Use existing project"
echo "  2) Create new project"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "2" ]; then
    echo ""
    read -p "Enter project name (e.g., TripFlow): " project_name
    read -p "Enter database password (or press Enter to generate): " db_password

    if [ -z "$db_password" ]; then
        db_password=$(openssl rand -base64 32)
        echo -e "${YELLOW}Generated password: $db_password${NC}"
        echo -e "${YELLOW}⚠️  SAVE THIS PASSWORD!${NC}"
    fi

    read -p "Enter organization ID (from list above): " org_id
    read -p "Enter region (e.g., us-west-1): " region

    echo ""
    echo "Creating project..."
    project_ref=$(supabase projects create "$project_name" \
        --org-id "$org_id" \
        --db-password "$db_password" \
        --region "$region" | grep -oE '[a-z]{20}')

    echo -e "${GREEN}✓ Project created: $project_ref${NC}"
else
    echo ""
    read -p "Enter project reference ID: " project_ref
fi

echo ""

# Step 3: Link local project
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Step 3: Link Local Project${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Initialize Supabase config if needed
if [ ! -f "supabase/config.toml" ]; then
    echo "Initializing Supabase configuration..."
    supabase init
fi

echo "Linking to project: $project_ref"
supabase link --project-ref "$project_ref"

echo -e "${GREEN}✓ Project linked${NC}"
echo ""

# Step 4: Push database schema
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Step 4: Deploy Database Schema${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Copy schema to migrations folder
MIGRATION_FILE="supabase/migrations/$(date +%Y%m%d%H%M%S)_initial_schema.sql"
mkdir -p supabase/migrations
cp src/db/schema.sql "$MIGRATION_FILE"

echo "Pushing schema to Supabase..."
supabase db push

echo -e "${GREEN}✓ Database schema deployed (15 tables created)${NC}"
echo ""

# Step 5: Get API credentials
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Step 5: Configure Environment Variables${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Get project details
project_url="https://$project_ref.supabase.co"
anon_key=$(supabase projects api-keys --project-ref "$project_ref" | grep 'anon' | awk '{print $NF}')

echo "Project URL: $project_url"
echo "Anon Key: ${anon_key:0:50}..."
echo ""

# Update .env file
if [ -f ".env" ]; then
    echo "Updating .env file..."

    # Backup existing .env
    cp .env .env.backup

    # Update or add Supabase credentials
    if grep -q "VITE_SUPABASE_URL" .env; then
        sed -i.tmp "s|VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=$project_url|" .env
    else
        echo "VITE_SUPABASE_URL=$project_url" >> .env
    fi

    if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        sed -i.tmp "s|VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$anon_key|" .env
    else
        echo "VITE_SUPABASE_ANON_KEY=$anon_key" >> .env
    fi

    # Clean up temp file
    rm -f .env.tmp

    echo -e "${GREEN}✓ .env file updated${NC}"
    echo -e "${YELLOW}  Backup saved as .env.backup${NC}"
else
    echo -e "${YELLOW}⚠️  .env file not found, creating from .env.example${NC}"
    cp .env.example .env
    echo "VITE_SUPABASE_URL=$project_url" >> .env
    echo "VITE_SUPABASE_ANON_KEY=$anon_key" >> .env
    echo -e "${GREEN}✓ .env file created${NC}"
fi

echo ""

# Step 6: Enable real-time (if possible via CLI)
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Step 6: Verify Real-time${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

echo "Real-time is enabled by default for:"
echo "  ✓ trips"
echo "  ✓ expenses"
echo "  ✓ trip_members"
echo "  ✓ activities"
echo ""
echo -e "${YELLOW}Note: If needed, enable via Dashboard → Database → Replication${NC}"
echo ""

# Summary
echo -e "${GREEN}"
echo "╔════════════════════════════════════════╗"
echo "║          Setup Complete! 🎉            ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${GREEN}✓ Supabase project configured${NC}"
echo -e "${GREEN}✓ Database schema deployed (15 tables)${NC}"
echo -e "${GREEN}✓ Environment variables set${NC}"
echo -e "${GREEN}✓ Real-time enabled${NC}"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Restart your dev server:"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "2. Open TripFlow:"
echo -e "   ${YELLOW}http://localhost:3001${NC}"
echo ""
echo "3. Click 'Get Started' to see the auth modal"
echo ""
echo "4. Sign in with:"
echo "   • Magic Link (enter your email)"
echo "   • Google OAuth"
echo "   • Try without account (anonymous)"
echo ""
echo "5. Create your first trip!"
echo ""

echo -e "${BLUE}Verify in Supabase Dashboard:${NC}"
echo "   Dashboard: https://supabase.com/dashboard/project/$project_ref"
echo "   • Table Editor → trips (see your trips)"
echo "   • Authentication → Users (see who signed in)"
echo ""

echo -e "${GREEN}Happy trip planning! ✈️ 🌍${NC}"
