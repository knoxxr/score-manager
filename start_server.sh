#!/bin/bash

# Environment setup for Node/NPM
export PATH=$PATH:/home/dashinaru/.nvm/versions/node/v24.13.0/bin

# Navigate to project directory
cd /home/dashinaru/Git/score-manager

# Start the application in production mode
# We use 'exec' to replace the shell process with the node process, 
# ensuring signals are passed correctly.

# Cleanup port 3000 if occupied
if /usr/bin/fuser 3000/tcp >/dev/null 2>&1; then
    echo "Port 3000 is in use. Attempting to kill process..."
    /usr/bin/fuser -k -9 3000/tcp
    sleep 2
fi

exec npm start
