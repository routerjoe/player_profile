#!/usr/bin/env bash
# Commit all changes on current branch, push it, update main, merge current into main, and push main.
# Compatible with macOS and Linux. Requires git.
# Usage:
#   ./scripts/commit-push-merge.sh [-m "commit message"] [--force]
#
# Flags:
#   -m | --message   Commit message (default: "Update from <branch>")
#   --force          Skip confirmation prompts for merging into main
#   -h | --help      Show help
#
# Behavior:
# - Detects current branch
# - Commits staged and unstaged changes
# - Pushes current branch to origin
# - Updates main (or remote default branch if different)
# - Confirms (unless --force) and merges current branch into main
# - Pushes main to origin
# - Exits on first error

set -euo pipefail

# -------- helpers --------
log() { printf "\033[1;34m[INFO]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[WARN]\033[0m %s\n" "$*"; }
err() { printf "\033[1;31m[ERROR]\033[0m %s\n" "$*" 1>&2; }
die() { err "$*"; exit 1; }

cleanup() {
  if [[ "${BASH_SOURCE[0]-}" != "" ]]; then
    : # reserved
  fi
}
trap cleanup EXIT
trap 'err "A command failed. Aborting."; exit 1' ERR

# -------- args --------
COMMIT_MSG=""
FORCE=false

print_help() {
  cat <<'EOF'
Commit all changes on current branch, push it, update main, merge, and push main.

Usage:
  scripts/commit-push-merge.sh [-m "commit message"] [--force]

Options:
  -m, --message   Commit message (default: "Update from <branch>")
  --force         Skip confirmation prompts for merging into main
  -h, --help      Show this help

Examples:
  scripts/commit-push-merge.sh -m "Fix: dashboard publish flow"
  scripts/commit-push-merge.sh --force
EOF
}

while (( $# > 0 )); do
  case "$1" in
    -m|--message)
      shift
      [[ $# -gt 0 ]] || die "Missing value for -m|--message"
      COMMIT_MSG="$1"
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    -h|--help)
      print_help
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

# -------- preflight --------
command -v git >/dev/null 2>&1 || die "git is not installed or not in PATH."

git rev-parse --git-dir >/dev/null 2>&1 || die "This directory is not a git repository."

# Ensure origin exists (GitHub remote supported)
if ! git remote get-url origin >/dev/null 2>&1; then
  die "Remote 'origin' not configured. Add one: git remote add origin <git@github.com:org/repo.git>"
fi

# Detect current branch
BRANCH=$(git branch --show-current 2>/dev/null || true)
[[ -n "${BRANCH}" ]] || die "Detached HEAD state detected. Please create/checkout a branch."

# Resolve remote default main branch (fallback to 'main')
log "Fetching remote to detect default branch..."
git fetch origin --quiet
DEFAULT_MAIN=$(git symbolic-ref --quiet refs/remotes/origin/HEAD 2>/dev/null | sed -E 's#^refs/remotes/origin/##' || true)
MAIN_BRANCH=${DEFAULT_MAIN:-main}
log "Remote default branch resolved as: ${MAIN_BRANCH}"

# -------- step 1: commit all changes on current branch --------
log "Current branch: ${BRANCH}"
log "Staging and committing changes (if any) on ${BRANCH} ..."

# Stage everything (staged + unstaged)
git add -A

# Only commit if there are changes
if ! git diff --cached --quiet; then
  MSG="${COMMIT_MSG:-Update from ${BRANCH}}"
  git commit -m "${MSG}"
  log "Committed changes with message: \"${MSG}\""
else
  log "No changes staged for commit; continuing."
fi

# -------- step 2: push current branch --------
log "Pushing branch '${BRANCH}' to origin ..."
git push -u origin "${BRANCH}"
log "Branch '${BRANCH}' pushed."

# -------- ensure clean before merging --------
if [[ -n "$(git status --porcelain)" ]]; then
  die "Working tree is not clean after commit. Aborting merge. Please resolve and re-run."
fi

# -------- step 3: update local main --------
if [[ "${BRANCH}" != "${MAIN_BRANCH}" ]]; then
  log "Checking out '${MAIN_BRANCH}' ..."
  # Create local main if missing
  if ! git rev-parse --verify "${MAIN_BRANCH}" >/dev/null 2>&1; then
    log "Local '${MAIN_BRANCH}' not found. Creating from origin/${MAIN_BRANCH} ..."
    git checkout -b "${MAIN_BRANCH}" "origin/${MAIN_BRANCH}"
  else
    git checkout "${MAIN_BRANCH}"
  fi

  log "Updating '${MAIN_BRANCH}' from origin ..."
  git pull --ff-only origin "${MAIN_BRANCH}"

  # -------- confirm merge --------
  if [[ "${FORCE}" == "false" ]]; then
    printf "\033[1;35m[CONFIRM]\033[0m Merge branch '%s' into '%s'? [y/N]: " "${BRANCH}" "${MAIN_BRANCH}"
    read -r REPLY
    case "${REPLY}" in
      y|Y|yes|YES) : ;;
      *) die "Merge cancelled by user." ;;
    esac
  else
    log "Force flag provided; skipping confirmation."
  fi

  # -------- step 4: merge and push main --------
  log "Merging '${BRANCH}' into '${MAIN_BRANCH}' ..."
  git merge --no-ff --no-edit "${BRANCH}"

  log "Pushing '${MAIN_BRANCH}' to origin ..."
  git push origin "${MAIN_BRANCH}"

  log "Merge completed successfully."
  log "You are currently on '${MAIN_BRANCH}'. To return to your branch: git checkout ${BRANCH}"
else
  warn "You are already on '${MAIN_BRANCH}'. Skipping merge step."
  log "Pushing '${MAIN_BRANCH}' to origin (if updated) ..."
  git push origin "${MAIN_BRANCH}" || true
fi

log "Done."