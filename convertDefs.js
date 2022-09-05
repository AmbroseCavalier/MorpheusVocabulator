const fs = require("fs")



const greekToAscii = {};
const asciiToGreek = {};

const rawMapping = `
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
᾽	}
·	:
—	_
ʹ	#
`
	.toLowerCase()
	.trim()
	.split("\n")
	.map((seg) => seg.trim().split(/\s+/));

rawMapping.forEach((current) => {
	const [greek, ascii] = current;
	asciiToGreek[ascii] = greek;
	greekToAscii[greek] = ascii;
});


greekToAscii["ς"] = "s";

const characterToGroup = new Map()

function diacriticModifier(
	ascii,
	unicode,
	group
) {
	asciiToGreek[ascii] = unicode
	greekToAscii[unicode] = ascii
	if (group) {
		characterToGroup.set(unicode, group)
	}
}


diacriticModifier(")", "\u0313", "breathing") //smooth breathing
diacriticModifier("(", "\u0314", "breathing") //rough breathing
diacriticModifier("/", "\u0301", "accent") //acute accent
diacriticModifier("=", "\u0342", "accent") //circumflex accent
diacriticModifier("\\", "\u0300", "accent") //grave accent
diacriticModifier("+", "\u0308", "accent") //diaresis

diacriticModifier("|", "\u0345", "subscript") //iota subscript
diacriticModifier("&", "\u0304", "accent") //macron
diacriticModifier("'", "\u0306", "accent") //breve

function escapeRegex(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function unicodeToBetacode(str) {
	str = str.normalize("NFD")
	for (const greek in greekToAscii) {
		const ascii = greekToAscii[greek]
		str = str.replace(new RegExp(escapeRegex(greek), "g"), ascii)
		str = str.replace(new RegExp(escapeRegex(greek.toUpperCase()), "g"), ascii.toUpperCase())
	}
	return str
}


const rawData = fs.readFileSync(__dirname+"/data/grc-mjm-defs.dat", "utf8")

const lines = rawData.split("\n")

const outLines = []

for (const line of lines) {
	if (line) {
		let [greek, english] = line.split("|")
		if (english === "@") {
			continue
		}
		if (greek.startsWith("@")) {
			greek = greek.substring(1)
		}

		const betacode = unicodeToBetacode(greek)
		outLines.push(betacode+"\t"+english)
	}
}

fs.writeFileSync(__dirname+"/data/grc-mjm-defs-betacode.dat", outLines.join("\n"), "utf8")
