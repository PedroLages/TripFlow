#!/bin/bash

# Apple Maps Credentials Setup Script
# Interactive configuration helper for TripFlow

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  TripFlow - Apple Maps Credentials Setup                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file already exists!${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborting. Your existing .env file was not modified."
        exit 0
    fi
    # Backup existing .env
    cp .env .env.backup
    echo -e "${GREEN}✓ Backed up existing .env to .env.backup${NC}"
fi

echo ""
echo "Please enter your Apple Maps credentials:"
echo "Refer to docs/guides/CREDENTIALS_CHECKLIST.md for help"
echo ""

# Collect Team ID
while true; do
    read -p "Apple Team ID (10 characters, e.g., ABC123DEF4): " TEAM_ID
    if [[ ${#TEAM_ID} -eq 10 ]]; then
        break
    else
        echo -e "${RED}✗ Team ID must be exactly 10 characters${NC}"
    fi
done

# Collect Key ID
while true; do
    read -p "MapKit JS Key ID (10 characters, e.g., 9Z8Y7X6W5V): " KEY_ID
    if [[ ${#KEY_ID} -eq 10 ]]; then
        break
    else
        echo -e "${RED}✗ Key ID must be exactly 10 characters${NC}"
    fi
done

# Collect Maps Identifier
read -p "Maps Identifier (e.g., com.tripflow.web): " MAPS_ID
if [ -z "$MAPS_ID" ]; then
    MAPS_ID="com.tripflow.web"
    echo -e "${YELLOW}Using default: $MAPS_ID${NC}"
fi

# Collect Private Key Path
while true; do
    read -p "Path to .p8 private key file: " KEY_PATH

    # Expand ~ to home directory
    KEY_PATH="${KEY_PATH/#\~/$HOME}"

    if [ -f "$KEY_PATH" ]; then
        # Check if file ends with .p8
        if [[ "$KEY_PATH" == *.p8 ]]; then
            echo -e "${GREEN}✓ Private key file found${NC}"
            break
        else
            echo -e "${RED}✗ File must be a .p8 file${NC}"
        fi
    else
        echo -e "${RED}✗ File not found: $KEY_PATH${NC}"
        echo "Please enter the full path to your AuthKey_XXXXXXXXXX.p8 file"
    fi
done

# Copy from .env.example and update with values
echo ""
echo "Creating .env file..."

# Read .env.example and replace values
if [ -f .env.example ]; then
    cp .env.example .env

    # Update Apple Maps section
    sed -i.bak "s|VITE_APPLE_MAPS_TEAM_ID=.*|VITE_APPLE_MAPS_TEAM_ID=$TEAM_ID|" .env
    sed -i.bak "s|VITE_APPLE_MAPS_KEY_ID=.*|VITE_APPLE_MAPS_KEY_ID=$KEY_ID|" .env
    sed -i.bak "s|VITE_APPLE_MAPS_IDENTIFIER=.*|VITE_APPLE_MAPS_IDENTIFIER=$MAPS_ID|" .env
    sed -i.bak "s|APPLE_MAPS_PRIVATE_KEY_PATH=.*|APPLE_MAPS_PRIVATE_KEY_PATH=$KEY_PATH|" .env

    # Remove backup file
    rm .env.bak
else
    # Create from scratch if .env.example doesn't exist
    cat > .env << EOL
# Apple Maps Configuration
VITE_APPLE_MAPS_TEAM_ID=$TEAM_ID
VITE_APPLE_MAPS_KEY_ID=$KEY_ID
VITE_APPLE_MAPS_IDENTIFIER=$MAPS_ID
APPLE_MAPS_PRIVATE_KEY_PATH=$KEY_PATH
VITE_MAPKIT_TOKEN_API=http://localhost:3002/api/mapkit-token
EOL
fi

echo -e "${GREEN}✓ .env file created successfully${NC}"
echo ""

# Display configuration
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Configuration Summary                                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Team ID:         $TEAM_ID"
echo "Key ID:          $KEY_ID"
echo "Maps Identifier: $MAPS_ID"
echo "Private Key:     $KEY_PATH"
echo ""

# Verify file permissions
PERMS=$(stat -f "%OLp" "$KEY_PATH" 2>/dev/null || stat -c "%a" "$KEY_PATH" 2>/dev/null)
if [ "$PERMS" != "600" ] && [ "$PERMS" != "400" ]; then
    echo -e "${YELLOW}⚠️  Warning: Private key file has permissive permissions ($PERMS)${NC}"
    read -p "Set file permissions to 600 (read/write owner only)? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        chmod 600 "$KEY_PATH"
        echo -e "${GREEN}✓ File permissions updated to 600${NC}"
    fi
fi

# Test token server
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Next Steps                                                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "1. Test the token server:"
echo "   ${BLUE}npm run dev:token${NC}"
echo ""
echo "2. In another terminal, verify token generation:"
echo "   ${BLUE}curl http://localhost:3002/api/mapkit-token${NC}"
echo ""
echo "3. Start the full development environment:"
echo "   ${BLUE}npm run dev:full${NC}"
echo ""
echo "4. Open the demo page:"
echo "   ${BLUE}http://localhost:3001/map-demo${NC}"
echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "For troubleshooting, see:"
echo "  - docs/guides/apple-maps-setup.md"
echo "  - docs/guides/APPLE_MAPS_IMPLEMENTATION_SUMMARY.md"
