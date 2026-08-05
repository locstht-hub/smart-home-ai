import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const [canonicalPath, outputPath, previewDir] = process.argv.slice(2);
if (!canonicalPath || !outputPath || !previewDir) {
  throw new Error("Usage: node generate_canonical_workbook.mjs canonical.json output.xlsx preview-dir");
}

const canonical = JSON.parse(await fs.readFile(canonicalPath, "utf8"));
const workbook = Workbook.create();
const navy = "#17365D";
const blue = "#D9EAF7";
const green = "#E2F0D9";
const amber = "#FFF2CC";

function title(sheet, text, width) {
  sheet.showGridLines = false;
  const range = sheet.getRange(`A1:${width}1`);
  range.merge();
  range.values = [[text]];
  range.format.fill = navy;
  range.format.font = { bold: true, color: "#FFFFFF", size: 16 };
  range.format.rowHeight = 30;
}

function header(range) {
  range.format.fill = blue;
  range.format.font = { bold: true, color: navy };
  range.format.borders = { preset: "inside", style: "thin", color: "#A6A6A6" };
}

const summary = workbook.worksheets.add("Summary");
title(summary, "SMART HOME HEMS - CANONICAL RESEARCH RESULTS", "F");
summary.getRange("A3:B10").values = [
  ["Generated UTC", `'${canonical.generatedAtUtc}`],
  ["Dataset", canonical.forecast.dataset.dataset_name || "Pending"],
  ["Split strategy", canonical.forecast.dataset.split_strategy || "Pending"],
  ["Rolling folds", canonical.forecast.dataset.rolling_folds || 0],
  ["Random seeds", (canonical.forecast.dataset.random_seeds || []).join(", ")],
  ["Best learned model", canonical.forecast.bestModel || "Pending"],
  ["Hardware status", canonical.hardware.status],
  ["Canonical schema", canonical.schemaVersion],
];
summary.getRange("A3:A10").format.font = { bold: true, color: navy };
summary.getRange("D3:F3").values = [["Claim", "Allowed", "Interpretation"]];
header(summary.getRange("D3:F3"));
const claimRows = Object.entries(canonical.claimPolicy)
  .filter(([key]) => key.startsWith("allow"))
  .map(([key, value]) => [key, Boolean(value), value ? "May be reported with canonical citation" : "Must remain pending/future work"]);
summary.getRangeByIndexes(3, 3, claimRows.length, 3).values = claimRows;
summary.getRange("E4:E20").format.numberFormat = "General";
summary.getRange("A1:F20").format.wrapText = true;
summary.getRange("A1:F20").format.autofitColumns();
summary.getRange("B3:B10").format.columnWidth = 34;
summary.getRange("D4:D20").format.columnWidth = 36;
summary.getRange("F4:F20").format.columnWidth = 38;

const forecast = workbook.worksheets.add("Forecast Metrics");
title(forecast, "FORECAST METRICS - MEAN ± SAMPLE SD", "N");
const forecastHeaders = ["Model", "Split", "MAE kW", "MAE SD", "RMSE kW", "RMSE SD", "MAPE %", "MAPE SD", "R2", "R2 SD", "Inference ms", "Inference SD", "Runs", "Evidence"];
forecast.getRange("A3:N3").values = [forecastHeaders];
header(forecast.getRange("A3:N3"));
const forecastRows = canonical.forecast.models.map(row => [
  row.model, row.split, row.mae_kw, row.mae_kw_std, row.rmse_kw, row.rmse_kw_std,
  row.mape_percent, row.mape_percent_std, row.r2, row.r2_std,
  row.inference_ms_per_sample, row.inference_ms_per_sample_std, row.run_count,
  canonical.claimPolicy.allowPublicDatasetForecastClaims ? "Allowed" : "Pending",
]);
forecast.getRangeByIndexes(3, 0, forecastRows.length, forecastHeaders.length).values = forecastRows;
forecast.getRange(`C4:L${3 + forecastRows.length}`).format.numberFormat = "0.000";
forecast.getRange(`M4:M${3 + forecastRows.length}`).format.numberFormat = "0";
forecast.getRange(`A3:N${3 + forecastRows.length}`).format.borders = { preset: "inside", style: "thin", color: "#D9D9D9" };
forecast.getRange("A1:N30").format.autofitColumns();
forecast.getRange("A1:N30").format.wrapText = true;
forecast.freezePanes.freezeRows(3);

const hardware = workbook.worksheets.add("Hardware Latency");
title(hardware, "REAL-HARDWARE LATENCY", "L");
const hardwareHeaders = ["Network", "Endpoint", "Source", "n", "Rejected", "Mean ms", "Median ms", "SD ms", "Min ms", "p95 ms", "Max ms", "Gate"];
hardware.getRange("A3:L3").values = [hardwareHeaders];
header(hardware.getRange("A3:L3"));
const hardwareRows = (canonical.hardware.latencyGroups || []).map(row => [
  row.network_label, row.endpoint, row.source, row.n, row.rejected_n, row.mean_ms,
  row.median_ms, row.stddev_ms, row.min_ms, row.p95_ms, row.max_ms,
  row.meets_min_trials ? "Allowed" : "Pending",
]);
if (hardwareRows.length) {
  hardware.getRangeByIndexes(3, 0, hardwareRows.length, hardwareHeaders.length).values = hardwareRows;
} else {
  hardware.getRange("A4:L4").merge();
  hardware.getRange("A4:L4").values = [["PENDING: no accepted plc-s7-1200 / plc-real trial group is available."]];
  hardware.getRange("A4:L4").format.fill = amber;
}
hardware.getRange("A1:L20").format.autofitColumns();
hardware.getRange("A1:L20").format.wrapText = true;

const provenance = workbook.worksheets.add("Provenance");
title(provenance, "SOURCE AND FINGERPRINTS", "C");
provenance.getRange("A3:C3").values = [["Artifact", "Path", "SHA-256"]];
header(provenance.getRange("A3:C3"));
provenance.getRange("A4:C5").values = [
  ["Forecast metrics", canonical.forecast.source?.path || "Pending", canonical.forecast.source?.sha256 ? `'${canonical.forecast.source.sha256}` : "Pending"],
  ["Hardware summary", canonical.hardware.source?.path || "Pending", canonical.hardware.source?.sha256 ? `'${canonical.hardware.source.sha256}` : "Pending"],
];
provenance.getRange("A7:C7").merge();
provenance.getRange("A7:C7").values = [["This workbook is generated from canonical_results.json. Do not edit result values manually."]];
provenance.getRange("A7:C7").format.fill = green;
provenance.getRange("A1:C12").format.autofitColumns();
provenance.getRange("B4:C7").format.columnWidth = 55;
provenance.getRange("A1:C12").format.wrapText = true;

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.mkdir(previewDir, { recursive: true });
const inspected = await workbook.inspect({ kind: "table", range: "Forecast Metrics!A1:N20", include: "values,formulas", tableMaxRows: 20, tableMaxCols: 14 });
console.log(inspected.ndjson);
const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, summary: "formula error scan" });
console.log(errors.ndjson);
for (const name of ["Summary", "Forecast Metrics", "Hardware Latency", "Provenance"]) {
  const preview = await workbook.render({ sheetName: name, autoCrop: "all", scale: 1.5, format: "png" });
  await fs.writeFile(path.join(previewDir, `${name.replaceAll(" ", "_")}.png`), new Uint8Array(await preview.arrayBuffer()));
}
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);
