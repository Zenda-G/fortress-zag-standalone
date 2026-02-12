---
name: web-scraping
description: Extract structured data from websites using browser automation
version: 1.0.0
author: Fortress Zag
tags: [web, scraping, data-extraction, browser]
tools: [browser_navigate, browser_extract, browser_click]
models: []
requires: []
---

## When to Use

Use this gadget when the user wants to:
- Extract data from websites
- Scrape tables or lists
- Monitor website changes
- Collect information from multiple pages

## Process

1. **Navigate** to the target URL using `browser_navigate`
2. **Analyze** the page structure
3. **Extract** data using appropriate selectors
4. **Handle** pagination if needed
5. **Format** results as structured data (JSON, CSV, table)

## Best Practices

- Use specific CSS selectors for reliability
- Handle dynamic content with waits
- Respect robots.txt and rate limits
- Extract only necessary data to minimize tokens
- Handle errors gracefully (page changes, timeouts)

## Example

User: "Get the top 10 headlines from Hacker News"

```
1. Navigate to https://news.ycombinator.com
2. Extract text from `.titleline > a` elements
3. Return as numbered list
```

## Output Format

Return extracted data in a clear format:
- JSON for structured data
- Markdown tables for tabular data
- Lists for simple collections
- Include source URL for reference