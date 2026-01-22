#!/bin/bash

# Check if tournament ID is provided
if [ -z "$1" ]; then
  echo "Error: Tournament ID is required."
  echo "Usage: $0 <tournamentId>"
  exit 1
fi

TOURNAMENT_ID=$1

echo "Generating test teams for tournament: $TOURNAMENT_ID"
npx convex run tournaments:generateTestTeams '{"tournamentId": "'"$TOURNAMENT_ID"'"}'
echo "Done."
