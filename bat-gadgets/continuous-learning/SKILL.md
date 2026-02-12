# Continuous Learning v2

Extract patterns from conversations and auto-generate reusable skills with confidence scoring.

## What It Does

This skill implements the "Instinct-Based Learning" system from Everything Claude Code:
- **Pattern Extraction**: Identifies recurring patterns from conversations
- **Confidence Scoring**: Ranks patterns by frequency and success rate
- **Instinct Storage**: Saves learned patterns to `memory/instincts/`
- **Skill Generation**: Converts high-confidence instincts into reusable skills
- **Import/Export**: Share learned patterns between sessions

## Commands

| Command | Description |
|---------|-------------|
| `/instinct-status` | View all learned instincts with confidence scores |
| `/instinct-export` | Export instincts to a file for sharing |
| `/instinct-import <file>` | Import instincts from a file |
| `/evolve` | Convert high-confidence instincts into skills |
| `/learn` | Manually trigger pattern extraction from recent context |

## Instinct Format

```yaml
---
id: uuid
name: Pattern Name
created: ISO timestamp
confidence: 0.0-1.0
context: what triggered this pattern
action: what to do
evidence: list of supporting examples
---
Pattern content here...
```

## Configuration

Confidence thresholds:
- `0.0-0.3`: Low - Monitor only
- `0.3-0.7`: Medium - Suggest during conversations
- `0.7-1.0`: High - Auto-apply, consider evolving to skill

## Files

- `memory/instincts/` - Instinct storage directory
- `memory/instincts/index.json` - Instinct registry with metadata
- `skills/auto-generated/` - Skills created by `/evolve`
