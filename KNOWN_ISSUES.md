# Known Issues

## API Local - Report Generation Error (Windows)

**Status:** Non-critical  
**Affected:** Windows API Local only  
**Not Affected:** API Render, Dashboard, Cenários, Otimização

### Symptom
```
POST /relatorio
Response: 500 Internal Server Error
```

### Cause
Windows encoding issue with emoji characters (📊, 🧬, 🔬, etc.) in `report_generator.py`.

The report generator uses emojis in console output:
```python
print("   📊 Gerando cenários...")
print("   🧬 Executando Algoritmo Genético...")
```

On Windows, the default console encoding (`cp1252` or `charmap`) cannot encode these Unicode characters, causing the API to crash when generating reports.

### Workaround
Use API Render for report generation:
```bash
# Frontend automatically uses API Render when Local fails
# Or access directly:
curl -X POST https://agroplan-ai.onrender.com/relatorio \
  -H "Content-Type: application/json" \
  -d '{"objetivo": "equilibrado", "formato": "md"}'
```

### Impact
- ✅ Dashboard works (no report generation)
- ✅ Cenários works
- ✅ Otimização works
- ✅ Talhões works
- ✅ Climate integration works
- ❌ Report generation fails on Windows Local API

### Permanent Fix (Future)
Options:
1. Remove emojis from console output
2. Set UTF-8 encoding explicitly:
   ```python
   import sys
   import io
   sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
   ```
3. Catch encoding errors and fallback to ASCII
4. Use environment variable to disable emojis on Windows

### Priority
**Low** - Report generation works on Render, and the main functionality (planning, optimization, climate integration) works perfectly on Local API.
