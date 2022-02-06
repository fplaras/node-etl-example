/**
 * Dependencies
 */
 const csvParser = require('papaparse');
 const fs = require('fs');

let currentTargets = [];
let transformedData = [];
let missingValues = [];
let hasMissingValues = false;

module.exports = {
    readProductsAndTransform,
    readTargets,
    writeOutputFile,
    cleanSourceRecords
};

/**
 * Process Source Folder
 * sku id 11215090 presented some formatting issues
 */
 function cleanSourceRecords(excecutionFileName){
    return new Promise(function(resolve,reject){
        let content = fs.readFileSync('source/products.txt', "utf8");
        const headers = content.slice(0, content.indexOf("\n")).split("|");
        const rows = content.slice(content.indexOf("\n") + 1).split("\n");
        let newRows = [];
        rows.forEach(element => {
             
            newRows.push(element.replace(/(^"|"$)|\"/g, ''));
        });
        //let count = 0;
        var newFile = fs.createWriteStream('output/' + excecutionFileName + '/products.txt');
        newFile.write(headers.join('|' ));
        newRows.forEach(element => {
            newFile.write(element);
           // count++;
        });
        newFile.end();
        resolve(newFile);
    });
  }

  /**
   * Write Output File
   */
   function writeOutputFile(excecutionFileName) {
    return new Promise(function (resolve, reject) {
        try {
            var content = JSON.stringify(transformedData, null, 2)
            fs.writeFile('output/' + excecutionFileName + '/result.txt', content, 'utf8', err => {
                if (err) {
                    console.error(err)
                    reject('Error in Service writeOutputFile: ' + err);
                } else {
                    resolve(excecutionFileName);
                }
            });
        } catch (err) {
            reject('Error in Service writeOutputFile: ' + err);
        }
    });
}

/*******************
 * Parser Functions
 * ******************/

/**
 * Configurations
 */

//Target Configuration
 const targetsConfig = {
    header: false,
    quoteChar: '\'',
    delimiter: "\t",
    step: targetStep,
    escapeChar: "\'",
    skipEmptyLines: true,
};

//Products Configuration
const productsConfig = {
    header: true,
    //preview: 10, //limit results
    delimiter: "|",
    step: productsStep,
    transform: transformProducts,
    escapeChar: "\"",
    skipEmptyLines: true,
};

/**
 * Functions
 */
//Process one target record at a time
function targetStep(row, parser){
    currentTargets.push({ pKey: row.data[0], fKey: row.data[1] });
}

//Parse Targets
function readTargets(excecutionFileName) {
    console.log('Service: Reading Targets...');
    return new Promise(function (resolve, reject) {
        try {
            let content = fs.readFileSync('target/targets.txt', "utf8");
            csvParser.parse(content, targetsConfig);
            resolve(excecutionFileName);
        } catch (err) {
            reject('Error in Service readTargets: ' + err);
        }
    });
}

//Parse Products
function readProductsAndTransform(excecutionFileName) {
    console.log('Service: Reading Products...');
    return new Promise(function (resolve, reject) {
        try {
            let content = fs.readFileSync('output/'+ excecutionFileName +'/products.txt', "utf8");
            csvParser.parse(content, productsConfig);
            resolve(missingValues);
        } catch (err) {
            reject('Error in Service readProductsAndTransform: ' + err);
        }
    });
}

//Process one product record at a time
function productsStep(results, parser) {
    let transformedRecord = {
        "sku": results.data.sku,
        "name": results.data.name,
        "description": results.data.description,
        "priceList": parseFloat(results.data.price),
        "taxonomy": [
            results.data.store_id,
            results.data.department_id,
            results.data.category_id,
            results.data.subcategory_id
        ],
        "targetValues": []
    };

    transformedData.push(populateTargetValues(transformedRecord, results));

    //if missing value flag
    if(hasMissingValues){
        //reset flag
        hasMissingValues = false;
        //add result to array
        missingValues.push(transformedRecord);
    }
}

//Map transformed to product to targets and return update object
function populateTargetValues(transformedRecord, row) {

    let store_idTarget = currentTargets.find(obj => obj.pKey === row.data.store_id);
    if (store_idTarget)
        transformedRecord.targetValues.push(store_idTarget.fKey);
    else
        transformedRecord.targetValues.push('not_available');

    let department_idTarget = currentTargets.find(obj => obj.pKey === row.data.department_id);
    if (department_idTarget)
        transformedRecord.targetValues.push(department_idTarget.fKey);
    else
        transformedRecord.targetValues.push('not_available');

    let category_idTarget = currentTargets.find(obj => obj.pKey === row.data.category_id);
    if (category_idTarget)
        transformedRecord.targetValues.push(category_idTarget.fKey);
    else
        transformedRecord.targetValues.push('not_available');

    let subcategory_idTarget = currentTargets.find(obj => obj.pKey === row.data.subcategory_id);
    if (subcategory_idTarget)
        transformedRecord.targetValues.push(subcategory_idTarget.fKey);
    else
        transformedRecord.targetValues.push('not_available');

    return transformedRecord;
}

// Transform each data point
function transformProducts(data, header) {
    switch (header) {
        case 'store_id':
            if (parseInt(data)) {
                return 'sto' + data;
            } else {
                hasMissingValues = !hasMissingValues ? true : false;
                return 'not_available'
            }
        case 'department_id':
            if (parseInt(data)) {
                return 'dep' + data;
            } else {
                hasMissingValues = !hasMissingValues ? true : false;
                return 'not_available'
            }
        case 'category_id':
            if (parseInt(data)) {
                return 'cat' + data;
            } else {
                hasMissingValues = !hasMissingValues ? true : false;
                return 'not_available'
            }
        case 'subcategory_id':
            if (parseInt(data)) {
                return 'sub' + data;
            } else {
                hasMissingValues = !hasMissingValues ? true : false;
                return 'not_available'
            }
        case 'price':
            {
                var priceVal = data.replace('$', '');
                if (parseFloat(priceVal)) {
                    return priceVal;
                } else {
                    hasMissingValues = !hasMissingValues ? true : false;
                    return 'not_available'
                }
            }
        case 'name':
            if (data && data !== 'not_available') {
                return data.replace(/(^'|'$)|\'/g, '\"');
            } else {
                hasMissingValues = !hasMissingValues ? true : false;
                return 'not_available'
            }
        case 'description':
            if (data && data !== 'not_available') {
                return data;
            } else {
                hasMissingValues = !hasMissingValues ? true : false;
                return 'not_available'
            }
        default:
            return data;
    }
}