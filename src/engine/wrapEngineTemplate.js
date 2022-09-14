function createSemaphore() {
	let s = 0

	let resolveQueue = []

	async function wait() {
		s--
		if (s < 0) {
			await new Promise((resolve)=>{
				resolveQueue.push(resolve)
			})
		}
		return
	}

	function signal() {
		const preVal = s
		s++
		if (preVal < 0) {
			const resolve = resolveQueue.shift()
			if (!resolve) {
				console.warn("Unexpected state")
				return
			}

			resolve()
		}
	}

	return {wait, signal}
}

export function bootMorpheus() {
	let morpheusKilled = false

	let pendingStdin = "\r\n\n\n\n"
	let stdinPointer = 0

	let stdoutAccumulator = ""
	let stderrAccumulator = ""

	const inputQueue = []
	const queueNotEmpty = createSemaphore()
	const morpheusReadyForInput = createSemaphore()
	const morpheusOutputComplete = createSemaphore()

	async function processQueue() {
		while (!morpheusKilled) {
			//console.log("processQueue waiting for queue item...")
			await queueNotEmpty.wait()
			if (morpheusKilled) break;

			const item = inputQueue.shift()
			if (!item) {
				console.warn("Unexpected state")
				continue
			}
			if (!item.stdin.trim()) {
				console.warn("Got blank item, ignoring")
				item.resolve({stdout:"", stderr:""})
				continue
			}

			//console.log("processQueue waiting for morpheus ready...")
			await morpheusReadyForInput.wait()
			if (morpheusKilled) break;

			//console.log("pushing input to morpheus: ",JSON.stringify(item.stdin))
			stdoutAccumulator = ""
			stderrAccumulator = ""
			pendingStdin = item.stdin
			stdinPointer = 0
			unblockMorpheusLoop()

			//console.log("waiting for morpheus output")
			await morpheusOutputComplete.wait()
			if (morpheusKilled) break;

			//console.log("returning morpheus output")
			item.resolve({stdout: stdoutAccumulator, stderr: stderrAccumulator})
		}
	}
	processQueue()

	let unblockMorpheusLoop
	window.NEXT_WORD_READY = ()=>{
		//console.log("NEXT_WORD_READY called")
		let isFirstRun = !unblockMorpheusLoop
		if (!isFirstRun) {
			morpheusOutputComplete.signal()
		}
		morpheusReadyForInput.signal()
		return new Promise((resolve)=>{
			unblockMorpheusLoop = resolve
		})
	}

	function killMorpheus() {
		morpheusKilled = true
		for (const item of inputQueue) {
			item.reject(new Error("Morpheus killed by Javascript"))
		}
	}

	function processWord(inputLine) {
		let resolve
		let reject
		const promise = new Promise((res, rej)=>{
			resolve = res
			reject = rej
		})
		inputQueue.push({
			stdin: inputLine+"\n",
			resolve,
			reject
		})
		queueNotEmpty.signal()

		return promise
	}


	var Module = {
		arguments: [],
		preRun: [
			function() {
				ENV.MORPHLIB = "/"
			},
			function() {
				function stdin() {
					if (morpheusKilled) {
						return null
					}
					if (stdinPointer >= pendingStdin.length) {
						return undefined
					}
					const out = pendingStdin[stdinPointer].charCodeAt(0)
					stdinPointer++
					return out
				}

				let stdoutLineAcc = ""
				function stdout(asciiCode) {
					const c = String.fromCharCode(asciiCode)
					if (c === "\n") {
						if (window.DEVELOPMENT) {
							console.log("morpheus: "+stdoutLineAcc)
						}
						stdoutLineAcc = ""
					} else {
						stdoutLineAcc += c
					}
					stdoutAccumulator += c
				}

				let stderrLineAcc = ""
				function stderr(asciiCode) {
					const c = String.fromCharCode(asciiCode)
					if (c === "\n") {
						if (window.DEVELOPMENT) {
							console.warn("morpheus: "+stderrLineAcc)
						}
						stderrLineAcc = ""
					} else {
						stderrLineAcc += c
					}

					stderrAccumulator += String.fromCharCode(asciiCode)
				}

				FS.init(stdin, stdout, stderr);
			}
		]
	}

	// See buildEngine.js
	MORPHEUS_EMSCRIPTEN_ENGINE

	return {processWord, killMorpheus}
}
