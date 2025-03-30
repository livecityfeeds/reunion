import XLSX from 'xlsx';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read the JSON data
const jsonData = JSON.parse(fs.readFileSync('./sample-students-import.xlsx.json', 'utf8'));

// Create a new workbook and worksheet
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(jsonData);

// Add the worksheet to the workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

// Write the workbook to a file
XLSX.writeFile(workbook, 'sample-students-import.xlsx');

console.log('Excel file created successfully: sample-students-import.xlsx');
