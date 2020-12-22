const AdmZip = require("adm-zip");
const fs = require("fs");
const md5File = require("md5-file");
const md5Dir = require("md5-dir");
const axios = require("axios");

function fileExists(path) {
    return fs.existsSync(path);
}

function isDirectory(path) {
    return fs.lstatSync(path).isDirectory();
}

function validate(hashes) {
    const startTime = Date.now();
    const installPath = "./install/";
    const invalidGroups = [];
    for (const groupName in hashes) {
        const group = hashes[groupName];
        for (const path in group) {
            const hash = group[path];
            const localHash = fileExists(installPath + path) ? (isDirectory(installPath + path) ? md5Dir.sync(installPath + path) : md5File.sync(installPath + path)) : null;
            if (hash !== localHash) {
                console.log(`${groupName} needs to be updated. ${path} ${localHash == null ? "does not exist locally.": "has changed."}`);
                if (invalidGroups.indexOf(groupName) === -1) invalidGroups.push(groupName);
            }
        }
    }
    if (invalidGroups.length === 0) {
        console.log(`All files are up to date. (${Date.now() - startTime}ms)`);
    } else {
        console.log(`Some files need updating. (${Date.now() - startTime}ms)`);
    }
    return invalidGroups;
}

function install(groups, url, installPath) {
    const archivesPath = "./out/";
    for (const groupName of groups) {
        axios({
            method: "get",
            url: url + groupName + ".zip",
            responseType: "arraybuffer"
        }).then(resp => {
            fs.writeFileSync("./temp/"+ groupName +".zip", resp.data);
            const zip = new AdmZip("./temp/" + groupName + ".zip");
            zip.extractAllTo(installPath, true);
            const downloadSize = fs.statSync(archivesPath + groupName + ".zip").size;
            console.log(`${groupName} has been updated. (${(downloadSize / 1000000).toFixed(2) } MB)`);
        });

    }
}

function installFromURL(url, installPath) {
    axios.get(url + "hashes.json").then(resp => {
        install(validate(resp.data), url, installPath)
    });
}

installFromURL(process.argv[2], process.argv[3] || "./install/");
