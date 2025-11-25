#!/bin/bash

# Script to merge a branch locally and force push to all remotes
# Usage: ./merge-and-push.sh <branch-name>
#
# This script treats the local machine as the source of truth and
# force pushes to all remotes to ensure they stay in sync.

set +e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required argument is provided
if [ $# -lt 1 ]; then
    echo -e "${RED}Error: Missing required argument${NC}"
    echo "Usage: $0 <branch-name>"
    echo ""
    echo "Example:"
    echo "  $0 feature/new-ui"
    exit 1
fi

BRANCH_NAME="$1"
CURRENT_BRANCH=$(git branch --show-current)

echo -e "${GREEN}Starting merge and force push workflow...${NC}"
echo -e "Current branch: ${YELLOW}$CURRENT_BRANCH${NC}"
echo -e "Merging branch: ${YELLOW}$BRANCH_NAME${NC}"
echo ""

# Step 1: Verify the branch exists
echo -e "${YELLOW}Step 1: Verifying branch '$BRANCH_NAME' exists...${NC}"
if ! git rev-parse --verify "$BRANCH_NAME" >/dev/null 2>&1; then
    echo -e "${RED}✗ Branch '$BRANCH_NAME' does not exist${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Branch exists${NC}"
echo ""

# Step 2: Merge the branch
echo -e "${YELLOW}Step 2: Merging '$BRANCH_NAME' into '$CURRENT_BRANCH'...${NC}"
if git merge "$BRANCH_NAME" --no-edit; then
    echo -e "${GREEN}✓ Merge successful${NC}"
else
    echo -e "${RED}✗ Merge failed - resolve conflicts and try again${NC}"
    exit 1
fi
echo ""

# Step 3: Force push to all remotes
echo -e "${YELLOW}Step 3: Force pushing to all remotes...${NC}"

# Track results
PUSHED_REMOTES=""
FAILED_REMOTES=""

for remote in ado bb gh gl glsh; do
    echo -e "  Force pushing to ${YELLOW}$remote${NC}..."
    if git push --force "$remote" "$CURRENT_BRANCH" 2>/dev/null; then
        echo -e "  ${GREEN}✓ Force pushed to $remote${NC}"
        if [ -z "$PUSHED_REMOTES" ]; then
            PUSHED_REMOTES="$remote"
        else
            PUSHED_REMOTES="$PUSHED_REMOTES, $remote"
        fi
    else
        echo -e "  ${RED}✗ Failed to push to $remote${NC}"
        if [ -z "$FAILED_REMOTES" ]; then
            FAILED_REMOTES="$remote"
        else
            FAILED_REMOTES="$FAILED_REMOTES, $remote"
        fi
    fi
done
echo ""

# Summary
echo -e "${GREEN}Workflow completed!${NC}"
echo ""
echo "Summary:"
echo "  Merged: $BRANCH_NAME -> $CURRENT_BRANCH"
if [ -n "$PUSHED_REMOTES" ]; then
    echo -e "  ${GREEN}✓ Force pushed to: $PUSHED_REMOTES${NC}"
fi
if [ -n "$FAILED_REMOTES" ]; then
    echo -e "  ${RED}✗ Failed to push to: $FAILED_REMOTES${NC}"
fi
