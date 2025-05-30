#!/bin/zsh

# Fetch Figma JSON and save to figma.json
node figJson.js

# Convert figma.json to unify.json
node FigUnif.js
