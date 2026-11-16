# 📋 AGAP Automated QA Execution Report

**Generated on:** `2026-11-16T04:27:10.853Z`  
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
| ✅ PASS | chromium | visiting '/' redirects to '/login' | 2.84s |
| ✅ PASS | mobile-chrome | visiting '/' redirects to '/login' | 1.55s |
| ✅ PASS | chromium | displays brand panel and marketing details on desktop viewport | 2.92s |
| ⚪ SKIP | mobile-chrome | displays brand panel and marketing details on desktop viewport | 1.34s |
| ✅ PASS | chromium | displays mobile logo and hides brand panel on mobile screens | 2.98s |
| ✅ PASS | mobile-chrome | displays mobile logo and hides brand panel on mobile screens | 1.19s |
| ✅ PASS | chromium | requires email and password inputs | 2.89s |
| ✅ PASS | mobile-chrome | requires email and password inputs | 0.90s |
| ✅ PASS | chromium | toggles password visibility between masked and plain text | 3.03s |
| ✅ PASS | mobile-chrome | toggles password visibility between masked and plain text | 1.07s |
| ✅ PASS | chromium | toggles the 'Keep me signed in' checkbox | 2.98s |
| ✅ PASS | mobile-chrome | toggles the 'Keep me signed in' checkbox | 1.26s |
| ✅ PASS | chromium | shows 'Signing in…' state during form submission | 1.44s |
| ✅ PASS | mobile-chrome | shows 'Signing in…' state during form submission | 0.96s |
| ❌ FAIL | chromium | verifies 'Forgot password?' link route exists | 1.51s |
| ❌ FAIL | mobile-chrome | verifies 'Forgot password?' link route exists | 1.37s |
| ❌ FAIL | chromium | verifies 'Request an account' link route exists | 1.53s |
| ❌ FAIL | mobile-chrome | verifies 'Request an account' link route exists | 1.23s |

---

## 3. Detected Defects & Investigation Logs

> ⚠️ **4 test failure(s) detected.** See details below for developer investigation:

### Defect #1: verifies 'Forgot password?' link route exists (chromium)
- **Duration:** 1.51s
- **Error Output / Trace:**
```text
Error: Route /forgot-password should return 200 OK

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m200[39m
Received: [31m404[39m
```

### Defect #2: verifies 'Forgot password?' link route exists (mobile-chrome)
- **Duration:** 1.37s
- **Error Output / Trace:**
```text
Error: Route /forgot-password should return 200 OK

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m200[39m
Received: [31m404[39m
```

### Defect #3: verifies 'Request an account' link route exists (chromium)
- **Duration:** 1.53s
- **Error Output / Trace:**
```text
Error: Route /request-account should return 200 OK

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m200[39m
Received: [31m404[39m
```

### Defect #4: verifies 'Request an account' link route exists (mobile-chrome)
- **Duration:** 1.23s
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
