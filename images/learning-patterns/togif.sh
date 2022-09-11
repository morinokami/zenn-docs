#!/bin/bash

ffmpeg -y -i "$1" -vf scale="1280:-1" _tmp.mp4
ffmpeg -y -i _tmp.mp4 -vf palettegen _tmp_palette.png
ffmpeg -y -i _tmp.mp4 -i _tmp_palette.png -filter_complex paletteuse -r 24  "${1%}.gif"
rm _tmp.mp4 _tmp_palette.png
