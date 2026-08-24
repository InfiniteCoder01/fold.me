#!/usr/bin/env bash

bun build build/dev/javascript/paper/paper.mjs > docs/index.js
sed 's@./build/dev/javascript/paper/paper.mjs@./index.js@' index.html > docs/index.html
