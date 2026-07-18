#!/bin/bash

# Docker Copy Verification Script
# Überprüft nach Docker Build, ob alle kritischen Dateien im Container vorhanden sind

set -e

CONTAINER_NAME="${1:-extractor-backend}"
PROJECT_ROOT="${2:-.}"

echo "🔍 Verifying Docker file copies in container: $CONTAINER_NAME"
echo "================================================"

# Critical files to verify
declare -a CRITICAL_FILES=(
    "/app/backend/src/data/release-notes.json"
    "/app/backend/src/data/manual.json"
    "/app/RELEASE_NOTES_0.37.1.md"
    "/app/OPERATIONS_MANUAL.md"
    "/app/README.md"
    "/app/MANUAL-0.37.1.md"
    "/app/package.json"
    "/app/dist/index.js"
)

MISSING_FILES=()
FOUND_FILES=()

echo ""
echo "📋 Checking critical files..."
echo ""

for file in "${CRITICAL_FILES[@]}"; do
    if docker exec "$CONTAINER_NAME" test -f "$file" 2>/dev/null; then
        SIZE=$(docker exec "$CONTAINER_NAME" stat -c%s "$file" 2>/dev/null || echo "0")
        echo "✅ $file ($SIZE bytes)"
        FOUND_FILES+=("$file")
    else
        echo "❌ MISSING: $file"
        MISSING_FILES+=("$file")
    fi
done

echo ""
echo "================================================"
echo "📊 Summary:"
echo "   Found: ${#FOUND_FILES[@]} / ${#CRITICAL_FILES[@]}"
echo "   Missing: ${#MISSING_FILES[@]}"
echo ""

# Check backend data directory
echo "📁 Checking /app/backend/src/data directory..."
BACKEND_DATA=$(docker exec "$CONTAINER_NAME" ls -la /app/backend/src/data 2>/dev/null || echo "MISSING")
if [ "$BACKEND_DATA" != "MISSING" ]; then
    echo "✅ Directory exists with contents:"
    echo "$BACKEND_DATA" | tail -n +4 | while read line; do echo "   $line"; done
else
    echo "❌ Directory /app/backend/src/data does not exist!"
fi

echo ""

# Detailed file sizes and content checks
echo "🔎 Detailed file verification..."
echo ""

# Check release-notes.json specifically
if docker exec "$CONTAINER_NAME" test -f /app/backend/src/data/release-notes.json 2>/dev/null; then
    LINES=$(docker exec "$CONTAINER_NAME" wc -l /app/backend/src/data/release-notes.json 2>/dev/null | awk '{print $1}')
    echo "✅ release-notes.json: $LINES lines"
    
    # Show first 5 lines
    echo "   First 5 lines:"
    docker exec "$CONTAINER_NAME" head -5 /app/backend/src/data/release-notes.json | while read line; do echo "   > $line"; done
else
    echo "❌ release-notes.json missing in container!"
fi

echo ""

# Exit with error if files are missing
if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo "🚨 VERIFICATION FAILED: ${#MISSING_FILES[@]} files missing!"
    echo ""
    echo "Missing files:"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - $file"
    done
    exit 1
else
    echo "✅ ALL FILES VERIFIED SUCCESSFULLY!"
    exit 0
fi
