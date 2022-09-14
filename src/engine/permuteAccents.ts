const greekVowelCharacters = "aehiowu|"
const greekConsonantCharacters = "bgdzqklmncprstfxyv"


const betacodeVowelsAndDipthongs = [
	"a", "e", "h", "i", "o", "w", "u",
	"ai", "au", "ei", "eu", "oi", "ou", "hu", "ui",
	"a|", "h|", "w|"
]

type Syllable = {
	openConsonants: string
	vowel: string
	closeConsonants: string
	otherMarks: string
}

function syllabify(str: string): Syllable[] {
	const chars = str.split("")

	const syllables: Syllable[] = []
	let currentSyllable: Syllable = {
		openConsonants: "",
		vowel: "",
		closeConsonants: "",
		otherMarks: ""
	}
	function push() {
		syllables.push(currentSyllable)
		currentSyllable = {
			openConsonants: "",
			vowel: "",
			closeConsonants: "",
			otherMarks: ""
		}
	}

	for (let i = 0; i<chars.length; i++) {
		const c = chars[i]
		if (greekVowelCharacters.includes(c)) {
			if (currentSyllable.vowel) {
				const splitByAccent = currentSyllable.otherMarks.includes("/") || currentSyllable.otherMarks.includes("\\") || currentSyllable.otherMarks.includes("=")
				const maybeDipthong = currentSyllable.vowel + c
				if (!splitByAccent && betacodeVowelsAndDipthongs.includes(maybeDipthong)) {
					currentSyllable.vowel = maybeDipthong
				} else {
					push()
					currentSyllable.vowel += c
				}
			} else {
				currentSyllable.vowel += c
			}
		} else if (greekConsonantCharacters.includes(c)) {
			if (currentSyllable.vowel) {
				const nextVowelOrConsonant = chars.find((otherC, idx) => idx > i && (greekVowelCharacters.includes(otherC) || greekConsonantCharacters.includes(otherC)))
				if (nextVowelOrConsonant) {
					if (greekConsonantCharacters.includes(nextVowelOrConsonant)) {
						currentSyllable.closeConsonants += c
						push()
					} else {
						// the next thing is a vowel, so close this syllable and put the consonant at the start of that one
						push()
						currentSyllable.openConsonants += c
					}
				} else {
					//end of the word
					currentSyllable.closeConsonants += c
				}
			} else {
				currentSyllable.openConsonants += c
			}
		} else {
			currentSyllable.otherMarks += c
		}
	}

	push()
	return syllables
}

function mightSyllableBeLong(syllable: Syllable): boolean {
	return syllable.vowel.length === 2 || !"eo".includes(syllable.vowel)
}
function isSyllableDefinitelyLong(syllable: Syllable): boolean {
	return syllable.vowel.length === 2 || "wh".includes(syllable.vowel)
}

export function permuteAccents(betacode: string) {
	betacode = betacode.toLowerCase()
	betacode = betacode.replaceAll(/[^a-z]/g, "")
	const syllablesOrig = syllabify(betacode)

	const words: string[] = []

	for (let breathing = 0; breathing<=1; breathing++) {
		// no breathing permutation for words that start with consonants
		if (breathing === 1 && syllablesOrig[0].openConsonants) {
			continue
		}

		for (let placement = 0; placement<3; placement++) {
			for (const circumflex of [false, true]) {
				const syllable = syllablesOrig[syllablesOrig.length-1-placement]
				if (!syllable) {
					continue
				}

				const syllableLong = mightSyllableBeLong(syllable)
				const ultimaLong = isSyllableDefinitelyLong(syllablesOrig[syllablesOrig.length-1])

				if (circumflex) {
					if (!syllableLong) {
						continue
					}

					// a circumflex can never be on the antepenult
					if (placement >= 2) {
						continue
					}

					// a circumflex can't be on the penult if the ultima is long
					if (ultimaLong && placement === 1) {
						continue
					}
				}

				const syllables = syllablesOrig.slice(0)
				syllables[syllables.length-1-placement] = {
					openConsonants: syllable.openConsonants,
					vowel: syllable.vowel,
					closeConsonants: syllable.closeConsonants,
					otherMarks: circumflex ? "=" : "/"
				}

				if (syllables[0].openConsonants) {
					if (syllables[0].openConsonants === "r") {
						syllables[0] = {
							openConsonants: syllables[0].openConsonants,
							vowel: syllables[0].vowel,
							closeConsonants: syllables[0].closeConsonants,
							otherMarks: "("+syllables[0].otherMarks
						}
					}
				} else {
					syllables[0] = {
						openConsonants: syllables[0].openConsonants,
						vowel: syllables[0].vowel,
						closeConsonants: syllables[0].closeConsonants,
						otherMarks: (breathing === 0 ? ")" : "(")+syllables[0].otherMarks
					}
				}

				const word = syllables.map(syl => syl.openConsonants+syl.vowel+syl.otherMarks+syl.closeConsonants).join("")

				words.push(word)
			}
		}
	}

	return words
}
