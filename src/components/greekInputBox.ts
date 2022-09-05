import * as D from "dynein"
import MarkedString from "./replacingInput/MarkedString";
import replacingInput from "./replacingInput/replacingInput";
import GraphemeSplitter from "grapheme-splitter";

const greekToAscii: Record<string, string> = {};
const asciiToGreek: Record<string, string> = {};

const rawMapping: string[][] = `
α 	A
β 	B
γ 	G
δ 	D
ε 	E
ϝ 	V
ζ 	Z
η 	H
θ 	Q
ι 	I
κ 	K
λ 	L
μ 	M
ν 	N
ξ 	C
ο 	O
π 	P
ρ 	R
σ 	S
τ 	T
υ 	U
φ 	F
χ 	X
ψ 	Y
ω 	W
᾽	'
·	:
—	_
ʹ	#
`
	.toLowerCase()
	.trim()
	.split("\n")
	.map((seg) => seg.trim().split(/\s+/));

export { rawMapping }
rawMapping.forEach((current) => {
	const [greek, ascii] = current;
	asciiToGreek[ascii] = greek;
	greekToAscii[greek] = ascii;
});


greekToAscii["ς"] = "s"
greekToAscii["ϑ"] = "q"
greekToAscii["ʼ"] = "'"

const groups = new Set<string>()
const characterToGroup = new Map<string, string>()

function diacriticModifier(
	ascii: string,
	unicode: string,
	group: string
) {
	asciiToGreek[ascii] = unicode
	greekToAscii[unicode] = ascii
	if (group) {
		groups.add(group)
		characterToGroup.set(unicode, group)
	}
}


diacriticModifier("+", "\u0308", "diaresis") //diaresis

diacriticModifier(")", "\u0313", "breathing") //smooth breathing
diacriticModifier("(", "\u0314", "breathing") //rough breathing
diacriticModifier("/", "\u0301", "accent") //acute accent
diacriticModifier("=", "\u0342", "accent") //circumflex accent
diacriticModifier("\\", "\u0300", "accent") //grave accent


diacriticModifier("|", "\u0345", "subscript") //iota subscript
diacriticModifier("&", "\u0304", "quantity") //macron
diacriticModifier("'", "\u0306", "quantity") //breve

function escapeRegex(str: string) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function unicodeToBetacode(str: string) {
	str = str.normalize("NFD")
	for (const greek in greekToAscii) {
		const ascii = greekToAscii[greek]
		str = str.replace(new RegExp(escapeRegex(greek), "g"), ascii)
		str = str.replace(new RegExp(escapeRegex(greek.toUpperCase()), "g"), ascii.toUpperCase())
	}
	return str
}

const splitter = new GraphemeSplitter();
export function betacodeToUnicode(str: string) {
	str = str.replace(/.'/g, (match)=>{
		const prev = match[0]
		if (/[aeiouh]/.test(prev)) {
			return prev+"\u0306" // breve
		} else {
			return prev+"᾽" // apostrophe
		}
	})

	for (const ascii in asciiToGreek) {
		const greek = asciiToGreek[ascii]
		str = str.replace(new RegExp(escapeRegex(ascii), "g"), greek)
		str = str.replace(new RegExp(escapeRegex(ascii.toUpperCase()), "g"), greek.toUpperCase())
	}

	str = splitter.splitGraphemes(str).map(seg => {
		let out = ""
		const lastInGroup = new Map<string, string>()
		const unicodeChars = [...seg.toString().normalize("NFD")]
		for (const c of unicodeChars) {
			const group = characterToGroup.get(c)
			if (group) {
				lastInGroup.set(group, c)
			} else {
				out += c
			}
		}

		// Ensure consistent ordering
		for (const group of groups) {
			const c = lastInGroup.get(group)
			if (c) {
				out += c
			}
		}

		out = out.normalize("NFC")
		return out
	}).join("")
	str = str.replace(/σ(?=(?!\p{Letter}))/gu, "ς").replace(/ς(?=\p{Letter})/gu, "σ")

	return str
}

export default function greekInputBox(value: D.Signal<string>, multiline: boolean, alternateLines: boolean=false) {
	return replacingInput(value, (str, evt) => {

		if (evt && !evt.altKey && !evt.ctrlKey) {
			if (/^.$/u.test(evt.key)) {
				evt.preventDefault()

				let char = evt.key

				let shouldReplace = true
				if (alternateLines) {
					const toCurrent = str.substring(0, str.getMarker("selectionStart")??0)
					const currentLineNum = Array.from(toCurrent.toString().matchAll(/\n/g)).length
					if (currentLineNum%2 === 1) {
						shouldReplace = false
					}
				}
				if (shouldReplace) {
					const isUppercase = char.toLowerCase() !== char
					char = char.toLowerCase()
					if (char === "'") {
						const selStart = str.getMarker("selectionStart")??0
						const prev = str.substring(0, selStart).toString().normalize("NFD").replace(/[^\p{Letter}\s]/gu, "")
						if (/[aeiouhαειουωη]$/.test(prev)) {
							char = "\u0306" // breve
						} else {
							char = "᾽" // apostrophe
						}
					} else {
						if (asciiToGreek[char]) {
							char = asciiToGreek[char]
						}
						if (isUppercase) {
							char = char.toUpperCase()
						}
					}
				}
				str = str.replaceRange(str.getMarker("selectionStart")??0, str.getMarker("selectionEnd")??0, char)
				str = str.setMarker("selectionStart", str.getMarker("selectionEnd")??0)
			}
		}

		str = MarkedString.join(str.splitGraphemes().map(seg => {
			let out = ""
			const lastInGroup = new Map<string, string>()
			const unicodeChars = [...seg.toString().normalize("NFD")]
			for (const c of unicodeChars) {
				const group = characterToGroup.get(c)
				if (group) {
					lastInGroup.set(group, c)
				} else {
					out += c
				}
			}
			// Ensure consistent ordering
			for (const group of groups) {
				const c = lastInGroup.get(group)
				if (c) {
					out += c
				}
			}
			out = out.normalize("NFC")
			return seg.replaceString(out).moveMarkersToEnds()
		}), new MarkedString(""))
		str = str.replace(/σ(?=(?!\p{Letter}))/gu, "ς").replace(/ς(?=\p{Letter})/gu, "σ")

		return str
	}, multiline)
}
