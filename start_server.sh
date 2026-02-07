#!/bin/bash

# Environment setup for Node/NPM
export PATH=$PATH:/home/dashinaru/.nvm/versions/node/v24.13.0/bin

# Navigate to project directory
cd /home/dashinaru/Git/score-manager

# Start the application in production mode
# We use 'exec' to replace the shell process with the node process, 
# ensuring signals are passed correctly.
export PORT=3001
exec npm start
