const morpheusEmscriptenPath = "../MorpheusEmscripten/morph"

const emcc_outPath = morpheusEmscriptenPath+"/emcc_out"
const fs = require("fs")

const rawEngine = fs.readFileSync(emcc_outPath+"/cruncher.js", "utf8")
const engineTemplate = fs.readFileSync(__dirname+"/src/engine/wrapEngineTemplate.js", "utf8")

let builtEngine = engineTemplate.replace("MORPHEUS_EMSCRIPTEN_ENGINE", rawEngine)

let splicedProductionDataLoader = false
builtEngine = builtEngine.replace("function fetchRemotePackage(packageName, packageSize, callback, errback) {", (orig)=>{
	splicedProductionDataLoader = true
	return orig+"\n"+`if (packageName==="cruncher.data" && !window.DEVELOPMENT) {
		window.CRUNCHER_DATA_RAW.then(data => {
			console.log("resolve fetchRemotePackage cruncher.data", data.buffer)
			callback(data.buffer)
		})
		return
	}\n`
})

if (!splicedProductionDataLoader) {
	throw new Error("Unabled to splice production data loader")
}

fs.writeFileSync(__dirname+"/src/engine/bootMorpheus.js", builtEngine, "utf8")

const child_process = require("child_process");

child_process.execSync(`cp ${morpheusEmscriptenPath+"/emcc_out/cruncher.data"} ${__dirname+"/cruncher.data"}`, {
	stdio: "inherit",
	cwd: __dirname
});
