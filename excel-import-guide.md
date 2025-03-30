# Excel Import Guide for Batch 2002 Reunion Management System

This guide explains how to use the Excel import feature to bulk upload student information into the reunion management system.

## Excel Template Format

Please ensure your Excel file follows this exact format. All column names must match exactly as shown below:

| Column Name | Description | Required | Format/Values |
|-------------|-------------|----------|---------------|
| first_name | First name of the student | Yes | Text |
| last_name | Last name of the student | Yes | Text |
| section | Class section | Yes | A, B, C, or D |
| gender | Gender | Yes | male, female, or other |
| mobile | Mobile number | Yes | Numbers only (used for student login) |
| email | Email address | Yes | Valid email format |
| dob | Date of birth | Yes | YYYY-MM-DD |
| city | Current city of residence | No | Text |
| work | Current profession | No | Text |
| attending_status | Attendance status | Yes | attending, not_attending, or not_confirmed |
| paid_status | Payment status | Yes | paid, pending, not_paid, or not_applicable |
| contribution_amount | Amount contributed | No | Number (0 if no contribution) |

## Import Instructions

1. Download the sample Excel template (`sample-students-import.xlsx`)
2. Fill in your data following the format above
3. Navigate to the Students page in the management system
4. Click on the "Import Excel" button
5. Select your prepared Excel file
6. Review the preview of data to be imported
7. Click "Import" to add the students to the system

## Important Notes

- Each mobile number must be unique as it serves as the student's username for login
- The system will automatically validate the data before import
- If there are any errors, the system will provide feedback on which rows have issues
- Students can log in using their mobile number as both username and password
- After import, you can edit individual student records if needed

## Sample Data

The provided `sample-students-import.xlsx` file contains example data to demonstrate the correct format. Feel free to use it as a template for your actual data import.

## Need Help?

If you encounter any issues with the Excel import, please contact the system administrator for assistance.