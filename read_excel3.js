const XLSX = require("xlsx");
const fs = require("fs");

const filePath = "e:\\Internship\\CNKHMC\\STAFF LIST NON TEACHING AND TEACHING.xlsx";

try {
  const workbook = XLSX.readFile(filePath);
  const result = {};

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    result[sheetName] = data;
  });

  const fullData = result["Sheet2"];
  
  // Find the header row (usually row 3 based on 0-index)
  let headerRowIndex = fullData.findIndex(row => row.includes("Sr. No.") || row.includes("Name of Staff"));
  if (headerRowIndex !== -1) {
    console.log("Headers detected:");
    console.log(fullData[headerRowIndex]);
    
    // Check first couple of data rows to see if Gender is filled with M/F
    console.log("Sample Data:");
    console.log(fullData[headerRowIndex + 1]);
    console.log(fullData[headerRowIndex + 2]);
  } else {
    console.log("Could not find header row.");
  }

} catch (e) {
  console.error("Error reading excel file:", e);
}
