#!/bin/bash

# Environment setup for Node/NPM
export PATH=$PATH:/opt/homebrew/bin:/usr/local/bin

# Navigate to project directory
cd /Users/smic/dashinaru/score-manager

# Start the application in production mode
# We use 'exec' to replace the shell process with the node process, 
# ensuring signals are passed correctly.
exec /opt/homebrew/bin/npm start
