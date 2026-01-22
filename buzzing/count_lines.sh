#!/bin/bash

# Count lines in files, excluding common non-source directories and files
# format: find <dir> <opts> | xargs wc -l | sort -n

find . -type f \
  -not -path '*/.*' \
  -not -path '*/node_modules/*' \
  -not -path '*/build/*' \
  -not -path '*/.svelte-kit/*' \
  -not -path '*/playwright-report/*' \
  -not -path '*/test-results/*' \
  -not -path '*/coverage/*' \
  -not -name 'package-lock.json' \
  -not -name '*.png' \
  -not -name '*.jpg' \
  -not -name '*.jpeg' \
  -not -name '*.ico' \
  -not -name '*.svg' \
  -not -name '*.webp' \
  -not -name '*.mp3' \
  -not -name '*.wav' \
  -not -name '*.pdf' \
  -print0 | xargs -0 wc -l | sort -n

echo "------------------------------------------------"
echo "Note: Binary files and generated directories are excluded."
