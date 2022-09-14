import { findWords } from "../utils/utils.js"

import { customText, breakAtNumbers, knownWords, hoverWord, activeWord, printMode, toggleKnown, currentTextResult } from "../state/state.js"

import * as D from "dynein"
import toggle from "./toggle.js"
import greekInputBox from "./greekInputBox.js"
import modalLink from "./modalLink.js"
import { rawMapping as greekToAsciiTable } from "./greekInputBox"

const $if = D.addIf
const $text = D.addText

const { textarea, div, button, ul, li, input, span, br, table, tbody, tr, td } = D.elements

export default function reader() {
	div({class:"border-bottom"}, ()=>{
		div({class:"d-flex align-items-center justify-content-between"}, ()=>{
			span("Type Greek text here")

			modalLink("Greek Typing Guide", "Greek Typing Guide", ()=>{
				D.addHTML(`
					<p>This Greek input is based on <a href="https://en.wikipedia.org/wiki/Betacode" target="_blank">Betacode</a>.
					It makes typing Greek fairly intuitive by allowing you to basically just type a transliteration and
					have Greek show up.</p>

					<h2 class="mt-4">Character Typing Guide</h2>

					<p>The mapping of keys to Greek characters is shown below. The few somewhat unintuitive lines
					are marked in bold.</p>
				`)

				const unintuitiveGreek = ["ϝ", "η", "θ", "ξ", "φ", "ψ"]
				table({class:"table", style:"font-size: 1.2em"}, ()=>{
					tbody(()=>{
						for (const row of greekToAsciiTable) {
							const [greek, ascii] = row
							tr({class:unintuitiveGreek.includes(greek) ? "table-primary fw-bold" : ""}, ()=>{
								td({style:"font-family: 'Times New Roman', serif"}, greek)
								td(ascii)
							})
						}
					})
				})

				D.addHTML(`
					<h2 class="mt-4">Diacritic Typing Guide</h2>

					<p>All diacritics (accents, breathing marks, iota subscripts, etc.) are typed after the character they modify.</p>

					<table class="table table-striped" style="font-size: 1.2em;">
					<tbody>
						<tr><td style="font-family: 'Times New Roman', serif">α\u0313</td><td style="font-family: 'Consolas', monospace;">)</td> <td>smooth breathing</td>
						<tr><td style="font-family: 'Times New Roman', serif">α\u0314</td><td style="font-family: 'Consolas', monospace;">(</td> <td>rough breathing</td>
						<tr><td style="font-family: 'Times New Roman', serif">α\u0301</td><td style="font-family: 'Consolas', monospace;">/</td> <td>acute accent</td>
						<tr><td style="font-family: 'Times New Roman', serif">α\u0342</td><td style="font-family: 'Consolas', monospace;">=</td> <td>circumflex accent</td>
						<tr><td style="font-family: 'Times New Roman', serif">α\u0300</td><td style="font-family: 'Consolas', monospace;">\\</td><td>grave accent</td>
						<tr><td style="font-family: 'Times New Roman', serif">ι\u0308</td><td style="font-family: 'Consolas', monospace;">+</td> <td>diaresis</td>
						<tr><td style="font-family: 'Times New Roman', serif">α\u0345</td><td style="font-family: 'Consolas', monospace;">|</td> <td>iota subscript</td>
						<tr><td style="font-family: 'Times New Roman', serif">α\u0304</td><td style="font-family: 'Consolas', monospace;">&</td> <td>macron</td>
						<tr><td style="font-family: 'Times New Roman', serif">α\u0306</td><td style="font-family: 'Consolas', monospace;">'</td> <td>breve</td>
					</tbody>
					</table>
				`)
			})
		})

		div(()=>{
			const el = greekInputBox(customText, true)
			el.className = "form-control"
			D.addNode(el)
		})

		div({class:"d-flex align-items-center justify-content-between"}, ()=>{

			div({class:"col"}, ()=>{
				D.addIf(()=>/\d+/.test(currentTextResult().data), ()=>{
					toggle("Break at Numbers", breakAtNumbers)
				})
			})

			span("Hover over words, click to anchor")
		})
	})

	div({style:"white-space: pre-wrap;", class:"reader"}, ()=>{
		D.addDynamic(()=>{
			const result = currentTextResult()
			if (!result.success) {
				D.elements.i(result.data)
			} else {
				let replacedText = result.data.replace(/--/g, "—")
				if (breakAtNumbers()) {
					replacedText = replacedText.replace(/[\[\{\(]?\d+[\]\}\)\.]?/g, "\n$&").trim()
				}
				findWords(replacedText, word=>{
					span({
						onMouseEnter:()=>{
							hoverWord(word)

						},
						onclick:(evt: MouseEvent)=>{
							if (evt.ctrlKey) {
								toggleKnown(word)
							} else {
								if (printMode() === 0) {
									if (activeWord() === word) {
										activeWord("")
									} else {
										activeWord(word)
									}
								} else {
									activeWord(word)
									printMode(0)
								}
							}
						},
						oncontextmenu:(evt)=>{
							evt.preventDefault()
							toggleKnown(word)
						},
						class:()=>`word ${activeWord() === word ? "active" : ""} ${knownWords.has(word.toLowerCase()) ? "ignored" : ""}`
					}, ()=>{
							D.addText(word)
					})
				}, between=>{
					span(between)
				})
			}
		})
	})
}
