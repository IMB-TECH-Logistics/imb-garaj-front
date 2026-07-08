#!/usr/bin/env python3
"""Scrape education centers from goldenpages.uz rubric Id=1773 across all pages."""

import csv
import json
import re
import sys
import time
import urllib.request
from html import unescape
from pathlib import Path

BASE = "https://www.goldenpages.uz/uz/rubrics/?Id=1773"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "uz,en;q=0.9,ru;q=0.8",
}

SECTION_RE = re.compile(
    r'<section class="gp_company gp_company_(?:no|active) row">(.*?)</section>',
    re.DOTALL,
)
NAME_RE = re.compile(
    r'<a href="/uz/company/\?Id=(\d+)"[^>]*>\s*(.*?)\s*</a>',
    re.DOTALL,
)
INDEX_RE = re.compile(r'<p class="h3 mb-0 fz-18 clr-blue">\s*(\d+)\.', re.DOTALL)
ADDRESS_RE = re.compile(
    r'<div class="gp_wrap_address">.*?<p>\s*(.*?)\s*</p>',
    re.DOTALL,
)
PHONE_LIST_RE = re.compile(
    r'<ul class="gp_phoneCom list-unstyled mb-0">(.*?)</ul>',
    re.DOTALL,
)
PHONE_RE = re.compile(r'<a [^>]*>\s*(\+?[\d\s\-()X]+)\s*</a>', re.DOTALL)
ACTIVITIES_RE = re.compile(
    r'<ul class="mb-0">(.*?)</ul>',
    re.DOTALL,
)
LI_RE = re.compile(r'<li>\s*(.*?)\s*</li>', re.DOTALL)
TAG_RE = re.compile(r'<[^>]+>')


def clean(text: str) -> str:
    text = TAG_RE.sub('', text)
    text = unescape(text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text.rstrip(',').strip()


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode('utf-8', errors='replace')


def parse_page(html: str) -> list[dict]:
    rows = []
    for block in SECTION_RE.findall(html):
        name_m = NAME_RE.search(block)
        if not name_m:
            continue
        company_id = name_m.group(1)
        name = clean(name_m.group(2))

        index_m = INDEX_RE.search(block)
        index = int(index_m.group(1)) if index_m else None

        addr_m = ADDRESS_RE.search(block)
        address = clean(addr_m.group(1)) if addr_m else ''

        phones = []
        phone_list_m = PHONE_LIST_RE.search(block)
        if phone_list_m:
            for p in PHONE_RE.findall(phone_list_m.group(1)):
                p_clean = clean(p)
                if p_clean:
                    phones.append(p_clean)

        activities = []
        act_m = ACTIVITIES_RE.search(block)
        if act_m:
            for li in LI_RE.findall(act_m.group(1)):
                li_clean = clean(li)
                if li_clean:
                    activities.append(li_clean)

        rows.append({
            'index': index,
            'company_id': company_id,
            'name': name,
            'url': f"https://www.goldenpages.uz/uz/company/?Id={company_id}",
            'address': address,
            'phones': phones,
            'activities': activities,
        })
    return rows


def detect_total_pages(html: str) -> int:
    nums = re.findall(r'\?Id=1773&amp;Page=(\d+)', html)
    return max((int(n) for n in nums), default=1)


def main():
    out_dir = Path(__file__).resolve().parent.parent / 'data'
    out_dir.mkdir(parents=True, exist_ok=True)

    first = fetch(BASE)
    total = detect_total_pages(first)
    print(f"Detected total pages: {total}", file=sys.stderr)

    all_rows = parse_page(first)
    print(f"Page 1: {len(all_rows)} entries", file=sys.stderr)

    for page in range(2, total + 1):
        url = f"{BASE}&Page={page}"
        try:
            html = fetch(url)
        except Exception as e:
            print(f"Page {page} failed: {e}", file=sys.stderr)
            continue
        rows = parse_page(html)
        print(f"Page {page}: {len(rows)} entries", file=sys.stderr)
        all_rows.extend(rows)
        time.sleep(0.6)

    json_path = out_dir / 'edu_centers.json'
    csv_path = out_dir / 'edu_centers.csv'

    json_path.write_text(
        json.dumps(all_rows, ensure_ascii=False, indent=2),
        encoding='utf-8',
    )

    with csv_path.open('w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['index', 'company_id', 'name', 'url', 'address', 'phones', 'activities'])
        for r in all_rows:
            writer.writerow([
                r['index'],
                r['company_id'],
                r['name'],
                r['url'],
                r['address'],
                '; '.join(r['phones']),
                '; '.join(r['activities']),
            ])

    print(f"\nTotal entries: {len(all_rows)}", file=sys.stderr)
    print(f"JSON: {json_path}", file=sys.stderr)
    print(f"CSV:  {csv_path}", file=sys.stderr)


if __name__ == '__main__':
    main()
