const XLSX = require("xlsx");
const fs = require("fs");

const filePath = "e:\\Internship\\CNKHMC\\STAFF LIST NON TEACHING AND TEACHING.xlsx";

try {
  const workbook = XLSX.readFile(filePath);
  const result = {};

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    result[sheetName] = data; // get all rows to inspect
  });

  const fullData = result["Sheet2"];
  
  // Find all rows that look like section headers or actual headers
  fullData.forEach((row, index) => {
    if (row.length === 1 && typeof row[0] === 'string' && row[0].includes("Staff")) {
      console.log(`Row ${index}: ${row[0]}`);
    }
  });
  
  console.log("Headers:");
  console.log(fullData[3]);
} catch (e) {
  console.error("Error reading excel file:", e);
}
