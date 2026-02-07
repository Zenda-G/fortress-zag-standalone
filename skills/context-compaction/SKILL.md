# Context-Aware Compaction

Smart context window management with proactive compaction suggestions.

## What It Does

Prevents context overflow by monitoring usage and suggesting strategic compaction:
- **Usage Monitoring**: Track context window in real-time
- **Threshold Alerts**: Warn at 70%, suggest at 80%, force at 90%
- **Smart Compaction**: Preserve critical memories, compress old context
- **Predictive Analysis**: Estimate time-to-overflow based on usage rate

## Commands

| Command | Description |
|---------|-------------|
| `/compact` | Manually trigger compaction |
| `/compact-suggest` | Get compaction recommendations |
| `/context-status` | Show current usage and projections |

## Thresholds

| Usage | Action |
|-------|--------|
| < 50% | Green - Normal operation |
| 50-70% | Yellow - Monitor |
| 70-80% | Orange - Suggest compaction |
| 80-90% | Red - Recommend compaction |
| > 90% | Critical - Force compaction |

## Compaction Strategies

1. **Summarize Old**: Convert old exchanges to summaries
2. **Archive Files**: Move file contents to memory files
3. **Drop Verbose**: Remove verbose outputs (keep results)
4. **Preserve Critical**: Keep SOUL.md, MEMORY.md, recent context

## Files

- `memory/compaction-log.jsonl` - Compaction history
- `memory/context-metrics.json` - Usage tracking
