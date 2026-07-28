const XLSX = require("xlsx");
const fs = require("fs");

const filePath = "e:\\Internship\\CNKHMC\\STAFF LIST NON TEACHING AND TEACHING.xlsx";

try {
  const workbook = XLSX.readFile(filePath);
  const result = {};

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    result[sheetName] = data.slice(0, 5); // Just get headers and a few rows
  });

  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  console.error("Error reading excel file:", e);
}
