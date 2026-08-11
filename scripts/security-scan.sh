#!/usr/bin/env bash
#
# Semgrep CE security scan — same ruleset locally and in CI.
#
#   ./scripts/security-scan.sh              # scan the repo
#   ./scripts/security-scan.sh --canary     # prove the ruleset still detects
#   ./scripts/security-scan.sh --sarif out.sarif
#
# Ported from 1Money-Co/network-ui (scripts/security-scan.sh) so every 1Money
# frontend repo enforces the same rules at the same pinned SHA. Keep the two in
# sync: a divergence means "passes in network-ui" stops implying "passes here".
#
# Rules come from semgrep/semgrep-rules at a PINNED commit, fetched into a
# gitignored cache. Pinned rather than floating so a scan is reproducible: an
# upstream rule change can't silently alter what this gate enforces, and bumping
# RULES_SHA is a reviewable one-line diff.
#
# We fetch rather than vendor deliberately. Semgrep Rules License v1.0 permits
# use "for your own internal business purposes" but not redistribution; fetching
# at scan time is plainly use, and copying the rules into a company repo raises a
# question we don't need to answer. It matters more here than in a private app:
# this repo publishes to npm, and `files` is limited to lib/es so the cache could
# never ship — but vendoring would still put the rules in a public GitHub repo.
set -euo pipefail

RULES_SHA="40b8c63f75dc7c22c8a77482d73bfb864b146f7e"
RULES_REPO="https://github.com/semgrep/semgrep-rules.git"
# Semgrep derives rule IDs from the config path, so this directory name becomes
# part of every rule ID (e.g. semgrep-rules.javascript.express.security...).
# `nosemgrep:` suppressions reference those full IDs — renaming this directory
# invalidates every suppression in the codebase. Not overridable for that reason.
# (It fails safe: suppressions stop matching, findings reappear, the build goes
# red — but it would be a baffling failure to debug.)
CACHE_DIR=".semgrep-rules"
# Scan the whole repo, not just src/. The lint scripts target src/ because that
# is all Prettier and ESLint need to police, but build and config code is exactly
# where a supply-chain problem would land: .fatherrc.ts, vitest.config.ts,
# eslint.config.js and this script are all covered here and by nothing else.
# Scanning the root also means a new top-level directory is covered the day it's
# added, rather than whenever someone remembers to update this list. Semgrep
# limits itself to files git knows about, so build output and the rule cache are
# skipped; the excludes below are belt-and-braces.
#
# NOT covered: .github/workflows. Those files are passed to semgrep as targets,
# but CONFIGS below resolves javascript/ and typescript/ rules only, and none of
# them match YAML — so workflow files are scanned by zero rules and still report
# clean. semgrep-rules ships yaml/github-actions/security (run-shell-injection,
# pull-request-target-code-checkout, mutable-action-tag, secrets-inherit) which
# would cover them. Deliberately not enabled yet: it would make this repo enforce
# a different ruleset than network-ui. Enable in both repos together, not here
# alone. See the CONFIGS block for the one-line change.
TARGETS=(.)
SARIF_OUT=""
CANARY=0

# Rules the canary MUST trip, at production severity. Asserting a per-rule set
# rather than a total count: the planted document.write line alone matches two
# rules, so a "count >= 2" check stayed green even if every other rule vanished.
REQUIRED_RULES=(dom-based-xss insecure-document-method insecure-innerhtml)

while [ $# -gt 0 ]; do
  case "$1" in
    --canary) CANARY=1; shift ;;
    --sarif)  SARIF_OUT="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

if ! command -v semgrep >/dev/null 2>&1; then
  echo "semgrep not found. Install with: python3 -m pip install --user semgrep" >&2
  exit 127
fi

# --- fetch pinned rules -----------------------------------------------------
if [ ! -d "$CACHE_DIR/.git" ]; then
  echo "==> fetching semgrep-rules @ ${RULES_SHA:0:12}"
  rm -rf "$CACHE_DIR"
  git init -q "$CACHE_DIR"
  git -C "$CACHE_DIR" remote add origin "$RULES_REPO"
fi
if [ "$(git -C "$CACHE_DIR" rev-parse HEAD 2>/dev/null || echo none)" != "$RULES_SHA" ]; then
  git -C "$CACHE_DIR" fetch -q --depth 1 origin "$RULES_SHA"
  git -C "$CACHE_DIR" checkout -q FETCH_HEAD
fi

# --- build the ruleset ------------------------------------------------------
# EVERY security/ subdir under javascript/ and typescript/ — not a hand-picked
# framework list. Rules are filed by the framework they were written for, but
# taint patterns generalize: javascript/express/security/injection caught a
# finding in a Next.js API route in network-ui. Picking "frameworks we use"
# silently drops real coverage — and this package is consumed by every one of
# those frameworks, so its blast radius is wider than any single app's.
# To also cover .github/workflows, add "$CACHE_DIR/yaml/github-actions" to the
# find roots below — but do it in network-ui too (see the TARGETS note above).
CONFIGS=()
while IFS= read -r d; do CONFIGS+=(--config "$d"); done < <(
  find "$CACHE_DIR/javascript" "$CACHE_DIR/typescript" -type d -name security | sort
)
if [ ${#CONFIGS[@]} -eq 0 ]; then
  echo "ERROR: no rule directories resolved — refusing to run an empty scan" >&2
  exit 1
fi
echo "==> $((${#CONFIGS[@]} / 2)) rule directories"   # 2 array elements per dir: --config <path>

# --- canary: prove the ruleset still detects --------------------------------
# A misconfigured ruleset reports zero findings and looks identical to clean
# code. This is not hypothetical: the Semgrep registry rulesets network-ui first
# tried found 0 of 4 planted vulnerabilities. It matters more in this repo than
# in an app repo — a hooks library has almost no DOM-sink code of its own, so a
# clean scan is the expected result and a broken ruleset would never look
# suspicious. Fail loudly instead.
if [ "$CANARY" = "1" ]; then
  TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
  # The XSS sinks below are test fixtures, not shipped code: they are written to
  # a temp dir outside the repo, read by semgrep as text, never imported, never
  # executed, and deleted on exit. They must stay genuinely vulnerable — that is
  # the entire point. Do not "fix" them; sanitizing them silently disarms the
  # canary and the gate goes back to being unfalsifiable.
  #
  # Each planted line must trip a DIFFERENT rule. Note eval() is deliberately not
  # asserted: eval-detected is WARNING severity, so --severity ERROR filters it
  # out and it cannot prove anything about the production gate.
  cat > "$TMP/canary.tsx" <<'CANARY'
export function a() { document.write(location.hash); }
export function b(el: HTMLElement) { el.innerHTML = location.hash; }
CANARY
  echo "==> canary check (severity ERROR, matching the real scan)"
  found=$(semgrep scan "$TMP" "${CONFIGS[@]}" --severity ERROR --json --metrics off \
            --no-git-ignore 2>/dev/null \
          | python3 -c 'import json,sys; print(" ".join(sorted({r["check_id"].split(".")[-1] for r in json.load(sys.stdin)["results"]})))')
  missing=()
  for want in "${REQUIRED_RULES[@]}"; do
    case " $found " in *" $want "*) ;; *) missing+=("$want") ;; esac
  done
  if [ ${#missing[@]} -gt 0 ]; then
    echo "CANARY FAILED — rules not firing: ${missing[*]}" >&2
    echo "  expected: ${REQUIRED_RULES[*]}" >&2
    echo "  got:      ${found:-<none>}" >&2
    echo "The ruleset is not detecting planted vulnerabilities. Refusing to report a clean scan." >&2
    exit 1
  fi
  echo "canary OK — all ${#REQUIRED_RULES[@]} required rules fired: $found"
  exit 0
fi

# --- scan -------------------------------------------------------------------
# es/ and lib/ are father's build output (gitignored, so semgrep skips them
# anyway); __tests__ is excluded because test fixtures deliberately contain the
# shapes these rules look for.
ARGS=(
  scan "${TARGETS[@]}" "${CONFIGS[@]}"
  --severity ERROR
  --exclude node_modules --exclude es --exclude lib
  --exclude "$CACHE_DIR"
  --exclude '__tests__' --exclude '*.test.ts' --exclude '*.test.tsx'
  --metrics off --error
)
[ -n "$SARIF_OUT" ] && ARGS+=(--sarif --output "$SARIF_OUT")

echo "==> scanning ${TARGETS[*]} (blocking on ERROR)"
exec semgrep "${ARGS[@]}"
