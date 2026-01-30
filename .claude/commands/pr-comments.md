# Create PR with Conversation Context

Create a new branch, push it, and create a PR that includes the Claude Code conversation context in the description.

## Instructions

1. **Create a new branch** based on the argument provided: `$ARGUMENTS`
   - If no argument is provided, generate a descriptive branch name based on the conversation context
   - Use the format `feature/<description>` or `fix/<description>` as appropriate

2. **Stage and commit any uncommitted changes** if there are any
   - Use a descriptive commit message based on what was discussed/implemented

3. **Push the branch** to the remote repository

4. **Create a Pull Request** using `gh pr create` with:
   - A descriptive title based on the work done
   - A description that includes:
     - A summary of the changes
     - The Claude Code conversation context (summarize the key prompts and requests from the user that led to these changes)
     - Any relevant implementation details

## PR Description Format

The PR description should follow this format:

```
## Summary
<Brief description of what this PR does>

## Changes
<Bulleted list of specific changes made>

## Claude Code Context
This PR was created with assistance from Claude Code. Here's a summary of the conversation:

<Summarize the user's prompts and requests that led to these changes>

## Test Plan
<How to test these changes>

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Important
- Make sure to check `git status` and `git diff` before committing
- Ensure the branch doesn't already exist
- Use the GitHub CLI (`gh`) to create the PR
