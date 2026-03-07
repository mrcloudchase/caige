#!/bin/bash
# Double-click this file to launch the cAIge training site.
# It starts a local server and opens your browser.

cd "$(dirname "$0")"
PORT=8000

# Kill any existing server on this port
lsof -ti:$PORT | xargs kill -9 2>/dev/null

echo "Starting cAIge training site on http://localhost:$PORT"
echo "Press Ctrl+C to stop."
echo ""

# Open browser after a brief delay
(sleep 1 && open "http://localhost:$PORT") &

# Start server (blocks until Ctrl+C)
python3 -m http.server $PORT
