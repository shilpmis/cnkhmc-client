const XLSX = require("xlsx");
const fs = require("fs");

const filePath = "e:\\Internship\\CNKHMC\\STAFF LIST NON TEACHING AND TEACHING.xlsx";

try {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheet = workbook.Sheets["Sheet2"];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  let currentHeader = "";
  const parsedData = [];
  let keys = [];
  
  rawData.forEach((row, index) => {
    // Check for category header
    if (row.length === 1 && typeof row[0] === 'string' && row[0].includes("Staff")) {
      currentHeader = row[0].trim();
      return;
    }
    
    // Check for column headers
    if (row.includes("Sr. No.") || row.includes("Name of Staff")) {
      keys = row;
      return;
    }
    
    // Skip empty rows or rows without Sr No
    if (!row[0] || !keys.length) return;
    
    const record = { _category: currentHeader };
    keys.forEach((key, i) => {
      if (key) record[key] = row[i];
    });
    
    parsedData.push(record);
  });
  
  console.log(`Successfully parsed ${parsedData.length} records.`);
  
  // Group by category to see counts
  const groups = {};
  parsedData.forEach(p => {
    groups[p._category] = (groups[p._category] || 0) + 1;
  });
  console.log("Categories:", groups);
  
  console.log("Sample Teaching:", parsedData.find(p => p._category.includes("Teaching Staff (Full")));
  console.log("Sample Non-Teaching:", parsedData.find(p => p._category.includes("Non-Teaching")));

} catch (e) {
  console.error("Error reading excel file:", e);
}
