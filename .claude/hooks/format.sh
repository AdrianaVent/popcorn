#!/bin/bash

HOOK_DATA=$(cat)
FILE_PATH=$(echo "$HOOK_DATA" | jq -r '.tool_input.file_path')

if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.css)
    npx prettier --write "$FILE_PATH" 2>/dev/null
    ;;
esac
