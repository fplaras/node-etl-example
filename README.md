# node-etl-example
Node project showcasing steps for reading a CSV file, transforming values, mapping with values from separate file and writing to a new file JSON formatted result.

# Packages used
Moment
Moment Timezone
Papaparse

# Project Structure
- `Sources Folder` contains the original file of products data
- `Targets Folder` contains the original file used to to link products to a separate system for entity relationship
- `Outputs Folder` will contain the execution folders with contents associated to the execution of the program and will also at its root level contain files associated to any execution errors

# Program Details
- `etl-engine.js` main program file
- `etl-service.js` program file focused reading, transforming and writing result file.

# Instructions
- Install dependencies `npm i`
- Run `npm start`

# Output Example
- Output Folder
  - A folder with format `execution_{datetime}` that will contain the following
    - Execution log file with details of each step in the program and the ellapsed time.
      - This file will also contain JSON object where data has been found to be `not_available` for review.
    - A processed products folder that contains the result of reading the original provided products.txt file after making changes to special characters.
    - The JSON results folder containing the transformation of the data from both products.txt and targets.txt
  - This folder will also contain a file with error log pertaining to the program exectuion with the same datatime stamp. 
