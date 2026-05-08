# Known Issues

## Resolved Issues

### API Local - Report Generation Error (Windows) - ✅ RESOLVED

**Status:** Fixed in CLI v1.0.13  
**Resolution Date:** 08/05/2026

#### Problem
```
POST /relatorio
Response: 500 Internal Server Error
```

Windows encoding issue with emoji characters (📊, 🧬, 🔬, etc.) in `report_generator.py` console output.

#### Solution
Added `safe_print()` helper function that handles Unicode encoding errors gracefully:

```python
def safe_print(message):
    try:
        print(message)
    except UnicodeEncodeError:
        print(message.encode("ascii", errors="ignore").decode("ascii"))
```

All emoji prints now use `safe_print()` instead of `print()`.

#### How to Update
```bash
bun add -g agroplan-ai-cli@latest
agroplan serve off
agroplan setup --force --python="path/to/python"
agroplan serve on
```

#### Verification
```bash
# Test report generation
POST http://localhost:8000/relatorio
{
  "objetivo": "equilibrado",
  "formato": "md"
}

# Should return 200 OK with report content
```

---

## Current Issues

No known critical issues at this time.

### Minor Limitations

1. **ZARC Decêndio Parser**: Official ZARC CSV (1M+ records) downloads successfully, but decêndio-to-date conversion is not yet implemented. System uses fallback data for now.

2. **Large CSV Files**: ZARC CSV (214MB) is not stored in Git repository. It's downloaded automatically on first use and cached locally.

---

**Last Updated:** 08/05/2026  
**CLI Version:** 1.0.13
