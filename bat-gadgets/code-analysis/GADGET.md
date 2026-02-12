---
name: code-analysis
description: Analyze code for quality, security, and performance issues
tags: [code, analysis, review, security, performance]
tools: [read, write, edit, exec]
models: []
requires: []
---

## When to Use

Use this gadget when the user wants to:
- Review code for bugs or issues
- Analyze code quality
- Check for security vulnerabilities
- Optimize performance
- Understand complex code
- Refactor or improve code

## Process

1. **Read** the code files
2. **Analyze** structure and logic
3. **Identify** issues or improvements
4. **Report** findings with specific line references
5. **Suggest** fixes or improvements

## Analysis Checklist

### Security
- [ ] SQL injection risks
- [ ] XSS vulnerabilities
- [ ] Hardcoded secrets
- [ ] Unsafe eval/exec usage
- [ ] Input validation issues

### Quality
- [ ] Code readability
- [ ] Naming conventions
- [ ] Comment quality
- [ ] Error handling
- [ ] Edge cases

### Performance
- [ ] Algorithmic complexity
- [ ] Memory leaks
- [ ] Unnecessary operations
- [ ] Caching opportunities
- [ ] Async/await usage

## Output Format

```markdown
## Analysis Results

### Security Issues
- **Line 45**: Potential SQL injection - use parameterized queries
- **Line 78**: Hardcoded API key - move to environment variables

### Quality Improvements
- **Line 23**: Function too long - consider breaking into smaller functions
- **Line 56**: Variable name unclear - rename to something descriptive

### Performance Optimizations
- **Line 34**: O(n²) loop - consider using Map for O(1) lookup

## Suggested Fixes
[Provide specific code changes]
```

## Guidelines

- Be specific with line numbers
- Explain why something is an issue
- Provide concrete fix examples
- Prioritize security issues
- Consider the codebase context