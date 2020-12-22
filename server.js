const AdmZip = require("adm-zip");
const fs = require("fs");
const md5File = require("md5-file");
const md5Dir = require("md5-dir");

function isDirectory(path) {
    return fs.lstatSync(path).isDirectory();
}

function create_archives(basePath = "./0.5.0/") {
    const archiveBase = "A32NX/";
    const versionData = fs.readFileSync(basePath + "fbwversion.json");
    const version = JSON.parse(versionData);
    const hashes = {};
    for (const groupName in version.groups) {
        const group = version.groups[groupName];
        const zip = new AdmZip("");
        let groupHashes = {};
        for (const filePath of group) {
            if (isDirectory(basePath + filePath)) {
                zip.addLocalFolder(basePath + filePath, archiveBase + filePath);
                groupHashes[archiveBase + filePath] = md5Dir.sync(basePath + filePath);
            } else {
                zip.addLocalFile(basePath + filePath, archiveBase + filePath.substring(0, filePath.lastIndexOf("/")));
                groupHashes[archiveBase + filePath] = md5File.sync(basePath + filePath);
            }
        }
        zip.writeZip(`./out/${groupName}.zip`);
        hashes[groupName] = groupHashes;
    }
    fs.writeFileSync("./out/hashes.json", JSON.stringify(hashes));
}

create_archives(process.argv[2]);
