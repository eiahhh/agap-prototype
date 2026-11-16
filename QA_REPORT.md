# 📋 AGAP Automated QA Execution Report

**Generated on:** `2026-11-16T03:43:36.347Z`  
**Application:** AGAP (Alert & Guidance Portal - CDRRMO Dasmariñas City)  
**Environment:** Next.js Local Dev Server (`http://localhost:3000`)  

---

## 1. Executive Summary

| Total Executed | Passed | Failed (Defects Found) | Skipped | Pass Rate |
| :---: | :---: | :---: | :---: | :---: |
| **18** | **13** | **4** | **1** | **72.2%** |

---

## 2. Test Execution Matrix

| Status | Project / Browser | Test Scenario | Duration |
| :---: | :--- | :--- | :---: |
| ✅ PASS | chromium | visiting '/' redirects to '/login' | 2.43s |
| ✅ PASS | mobile-chrome | visiting '/' redirects to '/login' | 1.30s |
| ✅ PASS | chromium | displays brand panel and marketing details on desktop viewport | 2.22s |
| ⚪ SKIP | mobile-chrome | displays brand panel and marketing details on desktop viewport | 1.80s |
| ✅ PASS | chromium | displays mobile logo and hides brand panel on mobile screens | 2.36s |
| ✅ PASS | mobile-chrome | displays mobile logo and hides brand panel on mobile screens | 2.02s |
| ✅ PASS | chromium | requires email and password inputs | 2.81s |
| ✅ PASS | mobile-chrome | requires email and password inputs | 2.12s |
| ✅ PASS | chromium | toggles password visibility between masked and plain text | 2.64s |
| ✅ PASS | mobile-chrome | toggles password visibility between masked and plain text | 2.01s |
| ✅ PASS | chromium | toggles the 'Keep me signed in' checkbox | 2.88s |
| ✅ PASS | mobile-chrome | toggles the 'Keep me signed in' checkbox | 1.63s |
| ✅ PASS | chromium | shows 'Signing in…' state during form submission | 1.92s |
| ✅ PASS | mobile-chrome | shows 'Signing in…' state during form submission | 2.04s |
| ❌ FAIL | chromium | verifies 'Forgot password?' link route exists | 2.20s |
| ❌ FAIL | mobile-chrome | verifies 'Forgot password?' link route exists | 2.35s |
| ❌ FAIL | chromium | verifies 'Request an account' link route exists | 2.06s |
| ❌ FAIL | mobile-chrome | verifies 'Request an account' link route exists | 2.30s |

---

## 3. Detected Defects & Investigation Logs

> ⚠️ **4 test failure(s) detected.** See details below for developer investigation:

### Defect #1: verifies 'Forgot password?' link route exists (chromium)
- **Duration:** 2.20s
- **Error Output / Trace:**
```text
Error: Route /forgot-password should return 200 OK

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m200[39m
Received: [31m404[39m
```

### Defect #2: verifies 'Forgot password?' link route exists (mobile-chrome)
- **Duration:** 2.35s
- **Error Output / Trace:**
```text
Error: Route /forgot-password should return 200 OK

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m200[39m
Received: [31m404[39m
```

### Defect #3: verifies 'Request an account' link route exists (chromium)
- **Duration:** 2.06s
- **Error Output / Trace:**
```text
Error: Route /request-account should return 200 OK

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m200[39m
Received: [31m404[39m
```

### Defect #4: verifies 'Request an account' link route exists (mobile-chrome)
- **Duration:** 2.30s
- **Error Output / Trace:**
```text
Error: Route /request-account should return 200 OK

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m200[39m
Received: [31m404[39m
```


---

## 4. How to Inspect Evidence
- Interactive HTML report with screenshots & traces: `npx playwright show-report`
- Traces & videos located in: `test-results/`
