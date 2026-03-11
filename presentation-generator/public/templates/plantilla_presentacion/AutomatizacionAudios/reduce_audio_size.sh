#!/bin/bash

# Loop through all mp3 files in the current directory
for i in *.mp3; do
  # Use ffmpeg to reduce the size while maintaining quality
  ffmpeg -i "$i" -q:a 0 "temp_$i"
  # Replace the original file with the new file
  mv "temp_$i" "$i"
done