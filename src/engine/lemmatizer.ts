import * as D from "dynein"
import { unicodeToBetacode } from "../components/greekInputBox.js"

// @ts-ignore
import { bootMorpheus as bootMorpheus_untyped } from "./bootMorpheus.js"
import { parseFlag, sortFlags } from "./parseFlags.js"

function bootMorpheus(): {
	processWord: (inputLine: string) => Promise<{stdout: string, stderr: string}>,
	killMorpheus: ()=>void
} {
	return bootMorpheus_untyped()
}

const morpheusGreek = bootMorpheus()

export async function processWord(word: string) {
	return (await morpheusGreek.processWord(word)).stdout
}

// TODO: max cache size?
const wordsCache = new Map<string, Promise<Result[]>>()
const wordsSignalCache = new Map<string, D.Signal<Result[] | null>>()

export type ResultFlag = {
	group: string,
	short: string,
	long: string,
}

export type Result = {
	lemma: string
	english: string | null,
	flags: ResultFlag[],
	detailFlags: ResultFlag[]
}

async function loadEnglishDictionary(): Promise<Map<string, string>> {
	let rawData: string

	const out = new Map<string, string>()

	//@ts-ignore
	if (window.DEVELOPMENT) {
		console.log("loading mjm-defs from server...")
		//@ts-ignore
		rawData = await (await window.fetch("/data/grc-mjm-defs-betacode.dat")).text()
	} else {
		//@ts-ignore
		rawData = await window.MJM_DEFS_RAW
	}

	const lines = rawData.split("\n")
	for (const line of lines) {
		if (!line.trim()) {
			continue
		}
		const [greek, english] = line.split("\t")

		out.set(greek, english)
	}

	return out
}

const englishDictionaryPromise = loadEnglishDictionary()

function parseResult(wordOrigCase: string, rawMorpheusResults: string, englishDictionary: Map<string, string>): Result[] {
	const results: Result[] = []

	const hasLemmas = new Set<string>()

	const matches = rawMorpheusResults.matchAll(/<NL>(.+?)<\/NL>/g)
	for (const resultMatch of matches) {
		const rawMorpheusResult = resultMatch[1]

		// dialect, region, etc.
		let detailFlagsStartIndex = rawMorpheusResult.indexOf("\t")
		if (detailFlagsStartIndex === -1) {
			detailFlagsStartIndex = rawMorpheusResult.length
		}

		const detailFlags = rawMorpheusResult.substring(detailFlagsStartIndex+1).trim()
		const mainResult = rawMorpheusResult.substring(0, detailFlagsStartIndex)
		const split = mainResult.split(/\s+/)
		let [type, rawWordAndLemma, ...rawFlags] = split
		const rawWordAndLemmaSplit = rawWordAndLemma.split(",")

		let rawWord: string
		let lemma: string
		if (rawWordAndLemmaSplit.length === 1) {
			rawWord = rawWordAndLemmaSplit[0]
			lemma = rawWordAndLemmaSplit[0]
		} else {
			rawWord = rawWordAndLemmaSplit[0]
			lemma = rawWordAndLemmaSplit[1]
		}
		lemma = lemma.replace(/^\*([\(\)\/\\=]+)([aeiouhw])/, "*$2$1")
		if (lemma.startsWith("*")) {
			lemma = lemma[1].toUpperCase()+lemma.substring(2)
		}
		lemma = lemma.replaceAll("\\", "/") // grave -> acute

		const english = englishDictionary.get(lemma) ?? englishDictionary.get(lemma.replace(/\d+$/, "")) ?? null

		rawFlags = rawFlags.map(f => f.trim()).filter(f => f)

		const flagsParsed = rawFlags.map(flag => parseFlag(flag))

		let detailFlagsSplit = detailFlags.split(/[\s,]+/)
		detailFlagsSplit = detailFlagsSplit.map(f => f.trim()).filter(f => f)
		const detailFlagsParsed = detailFlagsSplit.map(flag => parseFlag(flag))

		sortFlags(flagsParsed)
		sortFlags(detailFlagsParsed)

		hasLemmas.add(lemma)
		const result: Result = { lemma, english, flags: flagsParsed, detailFlags: detailFlagsParsed }

		results.push(result)
	}

	for (let i = 0; i<10; i++) {
		let lemma = wordOrigCase+(i === 0 ? "" : i)
		const directDictionaryMatch = englishDictionary.get(lemma)
		if (directDictionaryMatch) {
			lemma = lemma.replaceAll("\\", "/") // grave -> acute
			if (hasLemmas.has(lemma)) {
				continue
			}
			const result: Result = { lemma, english: directDictionaryMatch, flags: [], detailFlags: [] }
			results.push(result)
		}
	}

	return results
}

export function lookup(word: string): Promise<Result[]> {
	word = word.trim()
	const wordOrigCase = unicodeToBetacode(word)
	word = unicodeToBetacode((word.toLowerCase() !== word ? "*" : "")+word.toLowerCase())
	word = word.replace(/^\*([aeiouhw])([\(\)\/\\=]+)/, "*$2$1") // Morpheus doesn't work if we don't do this normalization to standard betacode
	word = word.replaceAll("\\", "/")
	console.log("lookup ",word)

	if (!wordsCache.has(word)) {
		const promise = new Promise<Result[]>((resolve)=>{
			processWord(word).then(async (result) => {
				const englishDictionary = await englishDictionaryPromise
				resolve(parseResult(wordOrigCase, result, englishDictionary))
			})
		})
		wordsCache.set(word, promise)
	}
	return wordsCache.get(word)!
}

export function lookupSignal(word: string): Result[] | null {
	if (!wordsSignalCache.has(word)) {
		const signal = D.createSignal<Result[] | null>(null)
		lookup(word).then(results => {
			signal(results)
		})
		wordsSignalCache.set(word, signal)
	}

	return wordsSignalCache.get(word)!()
}

async function test() {
	console.log("test results", processWord("*)aqhnai=oi"))
}
test()
