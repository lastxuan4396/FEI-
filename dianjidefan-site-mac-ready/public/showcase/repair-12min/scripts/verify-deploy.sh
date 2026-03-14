#!/usr/bin/env bash
set -euo pipefail

URL="${1:-https://repair-12min.onrender.com}"
TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT

STATUS="$(curl -L --silent --show-error --output "$TMP_FILE" --write-out "%{http_code}" "$URL")"
if [[ "$STATUS" != "200" ]]; then
  echo "FAIL: HTTP status $STATUS for $URL"
  exit 1
fi

required=(
  "冲突类型模板"
  "导入存档"
  "复制分享卡片"
  "低分步骤改写建议"
  "近7天完成率"
  "双人协作（同浏览器多标签）"
  "冲突强度分流"
  "下载图卡 PNG"
  "导出 PDF"
  "安全兜底已触发"
  "错误告警 Webhook"
)

for marker in "${required[@]}"; do
  if ! rg -q "$marker" "$TMP_FILE"; then
    echo "FAIL: missing marker '$marker' in deployed page"
    exit 1
  fi
done

echo "PASS: deploy verification succeeded for $URL"
