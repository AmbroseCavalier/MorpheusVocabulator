import * as D from "dynein"
import PersistentStore from "./store.js"

const $ = D.createSignal

const store = new PersistentStore("greek-vocabulator", 1, [
	obj => {
		if (obj.showParsings) {
			if (obj.longParsings) {
				obj.parsingsDisplayMode = 2
			} else {
				obj.parsingsDisplayMode = 1
			}
		} else {
			obj.parsingsDisplayMode = 0
		}
	}
])

// persistent
const currentWork = store.value("activeWork", "Custom" as string)
const customText = store.value("customText", `ἄνδρα μοι ἔννεπε, μοῦσα, πολύτροπον, ὃς μάλα πολλὰ
πλάγχθη, ἐπεὶ Τροίης ἱερὸν πτολίεθρον ἔπερσεν·
πολλῶν δ᾽ ἀνθρώπων ἴδεν ἄστεα καὶ νόον ἔγνω,
πολλὰ δ᾽ ὅ γ᾽ ἐν πόντῳ πάθεν ἄλγεα ὃν κατὰ θυμόν,
ἀρνύμενος ἥν τε ψυχὴν καὶ νόστον ἑταίρων.
ἀλλ᾽ οὐδ᾽ ὣς ἑτάρους ἐρρύσατο, ἱέμενός περ·
αὐτῶν γὰρ σφετέρῃσιν ἀτασθαλίῃσιν ὄλοντο,
νήπιοι, οἳ κατὰ βοῦς Ὑπερίονος Ἠελίοιο
ἤσθιον· αὐτὰρ ὁ τοῖσιν ἀφείλετο νόστιμον ἦμαρ.
τῶν ἁμόθεν γε, θεά, θύγατερ Διός, εἰπὲ καὶ ἡμῖν.` as string)

const customResults = store.map("manualResults", [])
const knownWords = store.fastSet("knownWords", [])

const printHeader = store.value("printHeader", "" as string)

const parsingsDisplayMode = store.value("parsingsMode", 0 as number)
const showAllDetailFlags = store.value("showAllDetailFlags", false)
const otherAccentsResultsMode = store.value("otherAccentsResultsMode", 1 as number)

const printFontSize = store.value("printFontSize", 8 as number)
const printNColumns = store.value("printNColumns", 4 as number)

const breakAtNumbers = store.value("breakAtNumbers", false as boolean)

// impersistent
const hoverWord = $("")
const activeWord = $("")
const printMode = $(0)

function toggleKnown(word: string) {
	word = word.toLowerCase()
	const port = knownWords.port(word)
	return port(!port())
}

const currentTextResult = D.createRootScope(()=>D.createMemo(()=>{
	activeWord("") //clear on text change
	return {
		success:true
		,data: customText()
	}
}))

export { breakAtNumbers, printFontSize, printNColumns, currentWork, knownWords, customText, parsingsDisplayMode, otherAccentsResultsMode, customResults, hoverWord, activeWord, toggleKnown, printMode, currentTextResult, printHeader, showAllDetailFlags}
