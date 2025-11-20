#!/bin/bash

# Script to create a branch, commit changes, push to all remotes, and create PRs
# Usage: ./create-pr.sh <branch-name> <commit-message> <pr-title> [pr-description]

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required arguments are provided
if [ $# -lt 3 ]; then
    echo -e "${RED}Error: Missing required arguments${NC}"
    echo "Usage: $0 <branch-name> <commit-message> <pr-title> [pr-description]"
    echo ""
    echo "Example:"
    echo "  $0 feature/new-ui 'Add new UI components' 'Add New UI Components' 'This PR adds new UI components for better UX'"
    exit 1
fi

BRANCH_NAME="$1"
COMMIT_MESSAGE="$2"
PR_TITLE="$3"
PR_DESCRIPTION="${4:-$COMMIT_MESSAGE}"

# Add Claude Code signature to commit message and PR description
COMMIT_MESSAGE_FULL="$COMMIT_MESSAGE

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

PR_DESCRIPTION_FULL="$PR_DESCRIPTION

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

echo -e "${GREEN}Starting automated PR creation workflow...${NC}"
echo ""

# Step 1: Create and checkout new branch
echo -e "${YELLOW}Step 1: Creating branch '$BRANCH_NAME'...${NC}"
git checkout -b "$BRANCH_NAME"
echo -e "${GREEN}✓ Branch created and checked out${NC}"
echo ""

# Step 2: Stage all changes
echo -e "${YELLOW}Step 2: Staging changes...${NC}"
git add .
echo -e "${GREEN}✓ Changes staged${NC}"
echo ""

# Step 3: Commit changes
echo -e "${YELLOW}Step 3: Committing changes...${NC}"
git commit -m "$COMMIT_MESSAGE_FULL"
echo -e "${GREEN}✓ Changes committed${NC}"
echo ""

# Step 4: Push to all remotes
echo -e "${YELLOW}Step 4: Pushing to all remotes...${NC}"

# Get base branch (default to main)
BASE_BRANCH="${BASE_BRANCH:-main}"

# Push to each remote
for remote in ado bb gh gl; do
    echo -e "  Pushing to ${YELLOW}$remote${NC}..."
    git push -u "$remote" "$BRANCH_NAME"
    echo -e "  ${GREEN}✓ Pushed to $remote${NC}"
done
echo ""

# Step 5: Create PRs
echo -e "${YELLOW}Step 5: Creating pull requests...${NC}"
echo ""

# Load Bitbucket API key
if [ -f ~/.bitbucket-api-key ]; then
    BB_API_KEY=$(cat ~/.bitbucket-api-key)
else
    echo -e "${RED}Warning: Bitbucket API key not found at ~/.bitbucket-api-key${NC}"
    BB_API_KEY=""
fi

# Load GitHub token
if [ -f ~/.github-token ]; then
    GH_TOKEN=$(cat ~/.github-token)
else
    echo -e "${YELLOW}Info: GitHub token not found at ~/.github-token. Attempting to use gh CLI...${NC}"
    GH_TOKEN=""
fi

# Create PR on Bitbucket
if [ -n "$BB_API_KEY" ]; then
    echo -e "  Creating PR on ${YELLOW}Bitbucket${NC}..."
    BB_RESPONSE=$(curl -s -X POST \
      -u "john@turbulent.cloud:$BB_API_KEY" \
      -H "Content-Type: application/json" \
      https://api.bitbucket.org/2.0/repositories/turbulentcloud/rabbit-followers/pullrequests \
      -d "{
        \"title\": \"$PR_TITLE\",
        \"source\": {
          \"branch\": {
            \"name\": \"$BRANCH_NAME\"
          }
        },
        \"destination\": {
          \"branch\": {
            \"name\": \"$BASE_BRANCH\"
          }
        },
        \"description\": \"$PR_DESCRIPTION_FULL\"
      }")

    BB_PR_URL=$(echo "$BB_RESPONSE" | grep -o '"html":{"href":"[^"]*"' | head -1 | sed 's/"html":{"href":"//;s/"$//')
    if [ -n "$BB_PR_URL" ]; then
        echo -e "  ${GREEN}✓ Bitbucket PR created: $BB_PR_URL${NC}"
    else
        echo -e "  ${RED}✗ Failed to create Bitbucket PR${NC}"
    fi
else
    echo -e "  ${YELLOW}⊘ Skipping Bitbucket PR (no API key)${NC}"
fi

# Create PR on GitHub
echo -e "  Creating PR on ${YELLOW}GitHub${NC}..."
if command -v gh &> /dev/null; then
    GH_PR_URL=$(gh pr create --repo coderabbit-demo/rabbit-followers \
      --title "$PR_TITLE" \
      --body "$PR_DESCRIPTION_FULL" \
      --base "$BASE_BRANCH" \
      --head "$BRANCH_NAME" 2>&1)

    if [[ $GH_PR_URL == http* ]]; then
        echo -e "  ${GREEN}✓ GitHub PR created: $GH_PR_URL${NC}"
    else
        echo -e "  ${RED}✗ Failed to create GitHub PR: $GH_PR_URL${NC}"
    fi
elif [ -n "$GH_TOKEN" ]; then
    GH_RESPONSE=$(curl -s -X POST \
      -H "Authorization: token $GH_TOKEN" \
      -H "Content-Type: application/json" \
      https://api.github.com/repos/coderabbit-demo/rabbit-followers/pulls \
      -d "{
        \"title\": \"$PR_TITLE\",
        \"body\": \"$PR_DESCRIPTION_FULL\",
        \"head\": \"$BRANCH_NAME\",
        \"base\": \"$BASE_BRANCH\"
      }")

    GH_PR_URL=$(echo "$GH_RESPONSE" | grep -o '"html_url":"[^"]*"' | head -1 | sed 's/"html_url":"//;s/"$//')
    if [ -n "$GH_PR_URL" ]; then
        echo -e "  ${GREEN}✓ GitHub PR created: $GH_PR_URL${NC}"
    else
        echo -e "  ${RED}✗ Failed to create GitHub PR${NC}"
    fi
else
    echo -e "  ${YELLOW}⊘ Skipping GitHub PR (no gh CLI or token found)${NC}"
fi

# Create PR on GitLab
echo -e "  Creating PR on ${YELLOW}GitLab${NC}..."
if command -v glab &> /dev/null; then
    GLAB_PR_URL=$(glab mr create --repo turbulent-cloud-group/rabbit-followers \
      --title "$PR_TITLE" \
      --description "$PR_DESCRIPTION_FULL" \
      --source-branch "$BRANCH_NAME" \
      --target-branch "$BASE_BRANCH" 2>&1 | grep -o 'https://[^ ]*')

    if [ -n "$GLAB_PR_URL" ]; then
        echo -e "  ${GREEN}✓ GitLab MR created: $GLAB_PR_URL${NC}"
    else
        echo -e "  ${RED}✗ Failed to create GitLab MR${NC}"
    fi
else
    echo -e "  ${YELLOW}⊘ Skipping GitLab MR (glab CLI not found)${NC}"
fi

# Create PR on Azure DevOps
echo -e "  Creating PR on ${YELLOW}Azure DevOps${NC}..."
if command -v az &> /dev/null; then
    ADO_PR_URL=$(az repos pr create \
      --organization https://dev.azure.com/turbulentcloud \
      --project turbulentcloud \
      --repository rabbit-followers \
      --source-branch "$BRANCH_NAME" \
      --target-branch "$BASE_BRANCH" \
      --title "$PR_TITLE" \
      --description "$PR_DESCRIPTION_FULL" \
      --query "url" -o tsv 2>&1)

    if [[ $ADO_PR_URL == http* ]]; then
        echo -e "  ${GREEN}✓ Azure DevOps PR created: $ADO_PR_URL${NC}"
    else
        echo -e "  ${RED}✗ Failed to create Azure DevOps PR: $ADO_PR_URL${NC}"
    fi
else
    echo -e "  ${YELLOW}⊘ Skipping Azure DevOps PR (az CLI not found)${NC}"
fi

echo ""
echo -e "${GREEN}Workflow completed!${NC}"
echo ""
echo "Summary:"
echo "  Branch: $BRANCH_NAME"
echo "  Pushed to: ado, bb, gh, gl"
echo "  PRs created on available platforms"
