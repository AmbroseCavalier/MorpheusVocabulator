const child_process = require("child_process");
const fs = require("fs");
const archiver = require("archiver");
const zlib = require("zlib");

const packageLock = JSON.parse(fs.readFileSync("./package-lock.json", "utf8"));
const packageJSON = JSON.parse(fs.readFileSync("./package.json", "utf8"));

const currentVersion = packageJSON.version;
if (packageLock.version !== currentVersion) {
	throw new Error("package-lock.json and package.json versions don't match.");
}

console.log("building...");
child_process.execSync(`esbuild src/index.ts --outfile=dist/bundle.min.js --bundle --minify`, {
	stdio: "inherit",
	cwd: __dirname
});

const defsRaw = fs.readFileSync("./data/grc-mjm-defs-betacode.dat");
const defsDeflated = zlib.deflateSync(defsRaw, { level: 9 });

const cruncherDataRaw = fs.readFileSync("./cruncher.data");
const cruncherDataDeflated = zlib.deflateSync(cruncherDataRaw, { level: 9 });

const decompressScript = `window.resolveMJM_DEFS(pako.inflate(base64ToUint8Array("${defsDeflated.toString(
	"base64"
)}"), {to: "string"}));

window.resolveCRUNCHER_DATA(pako.inflate(base64ToUint8Array("${cruncherDataDeflated.toString(
	"base64"
)}")));

`;

function genHTMLWrapper(singleFileMode) {
	const htmlWrapper = `
	<!DOCTYPE html>
	<head>
		<meta charset="utf-8">
		<title>Greek Vocabulator</title>
	<!--
	Greek Vocabulator
	vDEVELOPMENT

	Copyright (C) Ambrose Cavalier 2022.

	Licensed under the MIT License.
	-->
	${
		singleFileMode
			? `<script src="https://ambrosecavalier.com/projects/greek-vocabulator/latestVersion.js"></script>`
			: ""
	}
	<script>
		window.CRUNCHER_DATA_RAW = new Promise((resolve)=>{
			window.resolveCRUNCHER_DATA = resolve
		})
		window.MJM_DEFS_RAW = new Promise((resolve)=>{
			window.resolveMJM_DEFS = resolve
		})
		window.DEVELOPMENT=false;
		window.STANDALONE=${singleFileMode};

		(function() {
			//adapted from https://github.com/niklasvh/base64-arraybuffer/blob/master/lib/base64-arraybuffer.js

			var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

			// Use a lookup table to find the index.
			var lookup = new Uint8Array(256);
				for (var i = 0; i < chars.length; i++) {
				lookup[chars.charCodeAt(i)] = i;
			}
			window.base64ToUint8Array = function(base64) {
				var bufferLength = base64.length * 0.75,
				len = base64.length, i, p = 0,
				encoded1, encoded2, encoded3, encoded4;

				if (base64[base64.length - 1] === "=") {
					bufferLength--;
					if (base64[base64.length - 2] === "=") {
					bufferLength--;
					}
				}

				var bytes = new Uint8Array(bufferLength);

				for (i = 0; i < len; i+=4) {
					encoded1 = lookup[base64.charCodeAt(i)];
					encoded2 = lookup[base64.charCodeAt(i+1)];
					encoded3 = lookup[base64.charCodeAt(i+2)];
					encoded4 = lookup[base64.charCodeAt(i+3)];

					bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
					bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
					bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
				}

				return bytes;
			};
		})()
	</script>
	<script>${fs.readFileSync("./pako_inflate.min.js", "utf8")}</script>
	<style>
	${fs.readFileSync("./src/theme/bootstrap.min.css", "utf8")}
	</style>
	</head>
	<body>
	<script>${fs.readFileSync("./dist/bundle.min.js", "utf8")}</script>
	${singleFileMode ? `<script>${decompressScript}</script>` : `<script src="./data.js"></script>`}
	</body>`;

	if (!singleFileMode) {
		fs.writeFileSync("./dist/data.js", decompressScript, "utf8");
	} else {
		fs.writeFileSync(
			"./dist/latestVersion.js",
			`if (window.latestVersion) { //in case it somehow loads after main
				window.latestVersion("v${currentVersion}")
			} else {
				window.LATESTVERSION = "v${currentVersion}"
			}`,
			"utf8"
		);
	}
	return htmlWrapper
		.replace(/vDEVELOPMENT/g, "v" + currentVersion)
		.replace(/DEVBUILDTIME/g, new Date().toLocaleString());
}

const onlineVersion = genHTMLWrapper(false);
const offlineVersion = genHTMLWrapper(true);

const offlinePath = "./dist/Vocabulator_standalone.html";
fs.writeFileSync("./dist/index.html", onlineVersion, "utf8");
fs.writeFileSync(offlinePath, offlineVersion, "utf8");

const output = fs.createWriteStream("./dist/Vocabulator.zip");
const archive = archiver("zip", {
	zlib: { level: 9 } // Sets the compression level.
});

// listen for all archive data to be written
// 'close' event is fired only when a file descriptor is involved
output.on("close", function () {
	console.log(archive.pointer() + " total bytes");
	console.log("archiver has been finalized and the output file descriptor has closed.");
});

// This event is fired when the data source is drained no matter what was the data source.
// It is not part of this library but rather from the NodeJS Stream API.
// @see: https://nodejs.org/api/stream.html#stream_event_end
output.on("end", function () {
	console.log("Data has been drained");
});

// good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on("warning", function (err) {
	if (err.code === "ENOENT") {
		// log warning
	} else {
		// throw error
		throw err;
	}
});

// good practice to catch this error explicitly
archive.on("error", function (err) {
	throw err;
});

// pipe archive data to the file
archive.pipe(output);

archive.append(fs.createReadStream(offlinePath), { name: "Vocabulator.html" });

archive.finalize();
//child_process.execSync(`zip`, {stdio: "inherit", cwd:__dirname})

console.log("done");
