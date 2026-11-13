#!/usr/bin/env bash
# 构建并推送到 gh-pages 分支，GitHub Pages 从该分支发布
set -euo pipefail
cd "$(dirname "$0")"

pnpm build

tmp=$(mktemp -d)
cp -r dist/. "$tmp"
cd "$tmp"
git init -q -b gh-pages
touch .nojekyll
git add -A
git commit -q -m "deploy: $(date '+%Y-%m-%d %H:%M')"
git push -q --force https://github.com/slothvips/slothvips.github.io.git gh-pages
echo "已发布：https://slothvips.github.io"
