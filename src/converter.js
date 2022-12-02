const constants = require("./lib/constants/constants");
const path = require("path");
const fs = require("fs");
var WorkerPool = require("./lib/workers/workerPool");
var hl7v2 = require("./lib/hl7v2/hl7v2");

module.exports = {
    convertHL7v2ToFHIR(v2Message) {

        const messageType = hl7v2.getMessageTypeFromMSH(v2Message);
        const workerPool = new WorkerPool(
            __dirname + "/lib/workers/worker.js",
            require("os").cpus().length
        );

        const srcDataBase64 = Buffer.from(v2Message).toString("base64");

        const templateFile = "hl7v2/" + messageType + ".hbs";
        const template = fs.readFileSync(
            path.join(constants.BASE_TEMPLATE_FILES_LOCATION, templateFile)
        );

        const templateBase64 = Buffer.from(template.toString()).toString(
            "base64"
        );

        workerPool.broadcast({ 'type': 'constantsUpdated', 'data': JSON.stringify(constants)});

        return workerPool
            .exec({
                type: "/api/convert/:srcDataType",
                srcDataType: "hl7v2",
                srcDataBase64: srcDataBase64,
                templateBase64: templateBase64,
                templatesOverrideBase64: Buffer.from("{}").toString('base64'),
            })

            .then((result) => {
                // console.log(JSON.stringify(result, null, 4))
                return result;
            });
    },
};
