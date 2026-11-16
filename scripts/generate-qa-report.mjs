import fs from "fs";
import path from "path";

const resultsPath = path.resolve(process.cwd(), "test-results/results.json");
const outputPath = path.resolve(process.cwd(), "QA_REPORT.md");
const historyDir = path.resolve(process.cwd(), "qa-reports");

if (!fs.existsSync(resultsPath)) {
  console.error(`Results file not found at ${resultsPath}. Please run the tests first.`);
  process.exit(1);
}

const rawData = fs.readFileSync(resultsPath, "utf-8");
const results = JSON.parse(rawData);

let total = 0;
let passed = 0;
let failed = 0;
let skipped = 0;

const rows = [];
const failures = [];

function traverseSuites(suite, prefix = "") {
  const title = prefix ? `${prefix} > ${suite.title}` : suite.title;

  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      total++;
      const projectName = test.projectName || "default";
      const result = test.results?.[0] || {};
      const status = result.status || "unknown";

      if (status === "passed") passed++;
      else if (status === "skipped") skipped++;
      else failed++;

      const statusBadge =
        status === "passed"
          ? "✅ PASS"
          : status === "skipped"
          ? "⚪ SKIP"
          : "❌ FAIL";

      const durationSec = ((result.duration || 0) / 1000).toFixed(2);
      rows.push(`| ${statusBadge} | ${projectName} | ${spec.title} | ${durationSec}s |`);

      if (status !== "passed" && status !== "skipped") {
        const errorText =
          result.error?.message ||
          result.errors?.map((e) => e.message).join("\n") ||
          "Unknown assertion failure";

        failures.push({
          title: `${spec.title} (${projectName})`,
          error: errorText,
          duration: `${durationSec}s`,
        });
      }
    }
  }

  for (const childSuite of suite.suites || []) {
    traverseSuites(childSuite, title);
  }
}

for (const suite of results.suites || []) {
  traverseSuites(suite);
}

const timestamp = new Date().toISOString();

let report = `# 📋 AGAP Automated QA Execution Report

**Generated on:** \`${timestamp}\`  
**Application:** AGAP (Alert & Guidance Portal - CDRRMO Dasmariñas City)  
**Environment:** Next.js Local Dev Server (\`http://localhost:3000\`)  

---

## 1. Executive Summary

| Total Executed | Passed | Failed (Defects Found) | Skipped | Pass Rate |
| :---: | :---: | :---: | :---: | :---: |
| **${total}** | **${passed}** | **${failed}** | **${skipped}** | **${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%** |

---

## 2. Test Execution Matrix

| Status | Project / Browser | Test Scenario | Duration |
| :---: | :--- | :--- | :---: |
${rows.join("\n")}

---

## 3. Detected Defects & Investigation Logs
`;

if (failures.length === 0) {
  report += `\n> 🎉 **All automated tests passed successfully.** No defects detected.\n`;
} else {
  report += `\n> ⚠️ **${failures.length} test failure(s) detected.** See details below for developer investigation:\n\n`;

  failures.forEach((f, idx) => {
    report += `### Defect #${idx + 1}: ${f.title}\n`;
    report += `- **Duration:** ${f.duration}\n`;
    report += `- **Error Output / Trace:**\n`;
    report += `\`\`\`text\n${f.error}\n\`\`\`\n\n`;
  });
}

report += `
---

## 4. How to Inspect Evidence
- Interactive HTML report with screenshots & traces: \`npx playwright show-report\`
- Traces & videos located in: \`test-results/\`
`;

// Ensure qa-reports history directory exists
if (!fs.existsSync(historyDir)) {
  fs.mkdirSync(historyDir, { recursive: true });
}

// Create filename-safe timestamp: YYYY-MM-DD_HH-mm-ss
const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
const historyFilename = `QA_REPORT_${dateStr}.md`;
const historyPath = path.join(historyDir, historyFilename);

// 1. Write the latest report
fs.writeFileSync(outputPath, report, "utf-8");

// 2. Write the timestamped historical archive
fs.writeFileSync(historyPath, report, "utf-8");

console.log(`✅ Latest QA report updated at: ${outputPath}`);
console.log(`📁 Archived report saved at:   ${historyPath}`);

