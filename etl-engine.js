/**
 * Dependencies
 */
const fs = require('fs');
const momentjs = require('moment-timezone');
const service = require('./etl-service');
const moment = require('moment');

let executionFileName = '';

/**
 * Failure Callback
 */
function failureCallback(data) {
    fs.appendFile('./output/' + executionFileName + "_error_log.txt", "Errors: " + data, (err) => {
        //error writting to the error log file
        if (err) console.log(err);
    });
}

/**
 * Get Datetime in Timezone
 */
function GetTimezoneDtttm() {
    return momentjs.tz("America/New_York").format('Y-MM-DDTHH-mm-ss-SSSS');
}

/**
 * Calculates datetime difference and returns duration
 */
function getTimeInterval(start, end) {
    return moment.duration(end.diff(start)).asMilliseconds()
}

/**
 * Write to Log File
 */
function logFile(filePath, data, interval) {
    return new Promise(function (resolve, reject) {
        if (interval) {
            fs.appendFile('./output/' + filePath + '/' + filePath + '_log.txt', data + interval + 'ms\n', (err) => {
                //error creating the error log file
                if (err) reject('Error in readTargets: ' + err);
                console.log(data + interval + 'ms');
                resolve();
            });
        } else {
            fs.appendFile('./output/' + filePath + '/' + filePath + '_log.txt', data + '\n', (err) => {
                //error creating the error log file
                if (err) reject('Error in readTargets: ' + err);
                resolve();
            });
        }
    });
}

/**
 * Process Source File
 */
async function processSourceFolder(data) {
    await logFile(data, 'Pipeline Step: Process Source File...');
    let startTime = moment();
    await service.cleanSourceRecords(data);
    let endTime = moment();
    await logFile(data, 'Pipeline Step: Process Source File...Completed Elapsed Time: ', getTimeInterval(startTime, endTime));
}

/**
 * Read Targets
 */
async function readTargets(data) {
    let startTime = moment();
    startTotal = startTime;
    await logFile(data, 'Pipeline Step: Read Targets...');
    await service.readTargets(data);
    let endTime = moment();
    await logFile(data, 'Pipeline Step: Read Targets...Completed Elapsed Time: ', getTimeInterval(startTime, endTime));
}


/**
 * Read Products
 */
async function readAndTransformProducts(data) {
    let startTime = moment();
    await logFile(data, 'Pipeline Step: Read Products...');
    await service.readProductsAndTransform(data)
        .then(async value => {
            logFile(data, 'Products with Missing Data: ' + JSON.stringify(value, null, 2));
        });
    let endTime = moment();
    await logFile(data, 'Pipeline Step: Read Products...Completed Elapsed Time: ', getTimeInterval(startTime, endTime));
}

/**
 * Write Result File
 */
async function writeOutputFile(data) {
    await logFile(data, 'Pipeline Step: Writting Output File...');
    let startTime = moment();
    await service.writeOutputFile(data);
    let endTime = moment();
    await logFile(data, 'Pipeline Step: Writting Output File...Completed Elapsed Time: ', getTimeInterval(startTime, endTime));
    await logFile(data, 'Total Elapsed Time: ', getTimeInterval(startTotal, endTime));
}

/**
 * Start Pipeline
 */
function startEtlPipeline() {
    console.log('/***************************************************/');
    console.log('/***************************************************/');
    console.log('Pipeline Step: Initialize Output File');
    return new Promise(function (resolve, reject) {
        //define execution folder name
        executionFileName = 'execution_' + GetTimezoneDtttm();
        //try catch for creating folder directory
        try {
            //if folder does not exist create folder
            if (!fs.existsSync('./output/' + executionFileName)) {
                //create execution folder
                fs.mkdirSync('./output/' + executionFileName, {recursive:true}); 
            }

            //create execution log file
            fs.appendFile('./output/' + executionFileName + '/' + executionFileName + "_log.txt", "Pipeline Step: Initialize Output File\n", (initializeLogFileError) => {
                //error creating the execution log file
                if (initializeLogFileError) {
                    //stop execution and log error
                    reject(initializeLogFileError);
                } else {
                    //resolve and continue with execution file name created
                    resolve(executionFileName);
                }
            });
        } catch (createFolderError) {
            //catch exception creating directory and log
            reject(createFolderError);
        }
    });
}

startEtlPipeline()
    .then(async function (result) {
        await processSourceFolder(result);
        await readTargets(result);
        await readAndTransformProducts(result);
        await writeOutputFile(result);
    })
    .catch(failureCallback);