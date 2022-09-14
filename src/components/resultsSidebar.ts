import { findWords } from "../utils/utils.js"
import { printFontSize, printNColumns, knownWords, customResults,parsingsDisplayMode, hoverWord, activeWord, printMode, toggleKnown, currentTextResult, printHeader, showAllDetailFlags, otherAccentsResultsMode } from "../state/state.js"
import * as D from "dynein"
import tabs from "./tabs.js"
import toggle from "./toggle.js"
import integerInput from "./integerInput.js"
import { Result } from "../engine/lemmatizer.js"
import * as lemmatizer from "../engine/lemmatizer.js"

import radio from "./radio.js"

import print from "../utils/print.js"
import greekInputBox, { betacodeToUnicode, unicodeToBetacode } from "./greekInputBox.js"
import { standardDetailFlagsDisplayGroups } from "../engine/parseFlags.js"
import modalLink from "./modalLink.js"
import modal from "./modal.js"
import { permuteAccents } from "../engine/permuteAccents.js"

const $if = D.addIf
const $text = D.addText
const $ = D.createSignal

const { textarea, div, button, ul, li, input, span, br, dl, dd, hr, p, h3, h4, h5 } = D.elements
const {svg, path} = D.svgElements

function superscriptify(text: string) {
	return text.replace(/(\d+)(st|nd|rd|th)/gi, "$1<sup>$2</sup>")
}

enum RenderMode {
	hover = "hover"
	,preview = "preview"
	,print = "print"
}

function forPrintLemmaClickHandler(evt: MouseEvent, word: string, mode: RenderMode) {
	if (evt.ctrlKey) {
		let nowKnown = toggleKnown(word)
		if (nowKnown && activeWord() === word) {
			activeWord("")
		}
	} else if (mode === "preview") {
		activeWord(word)
	}
}

function searchIcon() {
	D.addHTML(`
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16" style="width: 1em; height: 1em">
  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
</svg>
	`)
}

function bookIcon() {
	D.addHTML(`
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-book" viewBox="0 0 16 16" style="width: 1em; height: 1em">
		<path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z"/>
	</svg>
	`)
}

function bookIconFilled() {
	D.addHTML(`
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-book-fill" viewBox="0 0 16 16" style="width: 1em; height: 1em">
  <path d="M8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z"/>
</svg>
	`)
}

function printOutputWord(word: string, mode: RenderMode, inner: ()=>void) {
	D.elements.u({onclick:(evt: MouseEvent)=>{
		forPrintLemmaClickHandler(evt, word, mode)
	}, class:()=>(mode === "preview" && activeWord() === word) ? "result active" : "result", style:"font-weight:bold"},inner)
}

function renderResults(word: string, results: Result[], mode: RenderMode) {
	//console.log("got results", results)

	let prev: Result | undefined
	for (const result of results) {
		const {english, lemma, flags, detailFlags} = result

		if (mode !== "hover") {
			if (prev?.english !== result.english || prev?.lemma !== result.lemma) {
				printOutputWord(word, mode, ()=>{
					D.elements.b(betacodeToUnicode(lemma.replace(/\d+$/, "")))
				})

				if (english) {
					span(()=>{
						D.addHTML(" "+english.replaceAll(`<span data-alpheios-enable="all" lang="grc">`, "<i>").replaceAll("</span>", "</i>"))
					})
				} else {
					D.elements.i("[No definition found]")
				}
				br()
			}
		} else {
			if (prev?.english !== result.english || prev?.lemma !== result.lemma) {
				const dictLinkHovered = $(false)
				D.elements.a({
					style:"font-size: 1.2em; text-decoration: none; float: right;",
					onmouseenter:()=>{
						dictLinkHovered(true)
					}, onmouseleave:()=>{
						dictLinkHovered(false)
					},
					href:`https://www.perseus.tufts.edu/hopper/text?doc=Perseus%253Atext%253A1999.04.0057%253Aentry%253D${encodeURIComponent(lemma)}`,
					target:"_blank",
					title:"Open LSJ in new tab",
				}, ()=>{
					D.addIf(dictLinkHovered, ()=>{
						bookIconFilled()
					}).else(()=>{
						bookIcon()
					})
				})
				if (english) {
					span({style:"font-weight:bold;font-size:1.2em;"},()=>{
						const replaced = english.replaceAll(`<span data-alpheios-enable="all" lang="grc">`, "<i>").replaceAll("</span>", "</i>")
						D.addHTML(replaced)
					})
				} else {
					span({style:"font-weight:bold;font-size:1.2em;font-style: italic;"},"[No definition found]")
				}

				br()
			}


			D.elements.span({style:"margin-left:1.5em"}, " "+betacodeToUnicode(lemma.replace(/\d+$/, "")))

			D.addDynamic(()=>{
				const detailFlagsFiltered = showAllDetailFlags() ? detailFlags : detailFlags.filter(flag => standardDetailFlagsDisplayGroups.includes(flag.group))
				if (detailFlagsFiltered.length > 0) {
					span({style:"margin-left:1em;font-size:0.8em;font-family:'Times New Roman', serif;"}, " ["+detailFlagsFiltered.map(flag => flag.long).join(", ")+"]")
				}
			})
			br()

			$if(()=>parsingsDisplayMode() > 0 && flags.length > 0, ()=>{
				span({style:"margin-left:3em;font-family:'Times New Roman', serif;letter-spacing:0px;"}, ()=>{
					D.addDynamic(()=>{
						D.addHTML(superscriptify(flags.map(flag => parsingsDisplayMode() === 2 ? flag.long : flag.short+".").join(" ")))
					})
				})
				br()
			})
		}

		prev = result
	}
}


function renderCustomResults(word: string, nRegularResults: number, mode: RenderMode) {
	D.addAsyncReplaceable(($r)=>{
		D.createEffect(()=>{
			let ignoreCheck = word.toLowerCase()
			let rawText = (customResults.get(ignoreCheck)??"").trim()
			let lines = rawText ? rawText.split(/\n+/) : []
			let otherResults: Result[] = []
			for (let i = 0; i<lines.length; i+=2) {
				let lemma = lines[i]
				let english = lines[i+1] ?? ""
				otherResults.push({
					lemma,
					english,
					flags: [],
					detailFlags: [],
				})
			}

			$r(()=>{
				if (mode !== "hover" && otherResults.length === 0 && nRegularResults === 0) {
					printOutputWord(word, mode, ()=>{
						$text(word)
					})
					D.addText(" ")
					span({style:"background-color:orange;font-weight:bold"}, "NO RESULTS")
					br()
				} else if (otherResults.length > 0) {
					div({style:"border:1px solid black; break-inside: avoid;"}, ()=>{
						D.elements.i("Custom results for ")
						D.elements.b(word)
						br()
						renderResults(word, otherResults, mode)
					})
				}
			})
		})
	})
}

function renderAllWords(mode: RenderMode) {
	D.addDynamic(()=>{
		let resultGroups: {word: string, results: Result[]}[] = []
		const result = currentTextResult()
		if (!result.success) {
			//do nothing
		} else {
			const words: string[] = []
			findWords(result.data, word=>{
				words.push(word)
			},()=>{})

			D.addAsyncReplaceable(async ($r)=>{
				$r(()=>{
					div({class:"spinner-border"})
				})
				console.log("looking up all words...")
				const currentOtherAccentsResultsMode = otherAccentsResultsMode()
				const resultGroups = await Promise.all(words.map(async (word)=>{
					return {word, results: await lemmatizer.lookup(word)}
				}))
				console.log("done!")

				$r(()=>{
					for (let {word, results} of resultGroups) {
						$if(()=>!knownWords.has(word.toLowerCase()),()=>{
							let nResults = results.length
							if (currentOtherAccentsResultsMode === 0) {
								renderResults(word, results, mode)
							} else if (currentOtherAccentsResultsMode === 1) {
								if (results.length > 0) {
									renderResults(word, results, mode)
								} else {
									renderResultsWithPermutedAccents(word, mode)
								}
							} else {
								renderResultsWithPermutedAccents(word, mode)
							}

						})
					}
				})
			})
		}
	})
}

function renderForPrint() {
	D.untrack(()=>{
		div({style:`columns: ${printNColumns()}; font-size: ${printFontSize()}pt; column-fill: auto;`}, ()=>{
			D.elements.u({style:"white-space: pre-wrap"}, D.sample(printHeader))
			br()
			renderAllWords(RenderMode.print)
		})
	})
}

function settingsModal() {
	modal({
		title: ()=>{
			$text("Output Settings")
		},
		body: ()=>{
			div({class:"mb-3"}, ()=>{
				h5("Parsing Display")
				radio(
					["None", "Short", "Long"],
					parsingsDisplayMode,
					[
						"Don’t display any parsing information",
						'Display parsing information as abbreviations (e.g., “nom. m. sg.”)',
						'Display parsing information as full words (e.g., “nominative masculine singular”)'
					]
				)
			})
			div(()=>{
				h5("Accent and Breathing Handling")
				p(`Some texts (especially OCR’d texts) can have incorrect or missing accent and breathing
				marks. Vocabulator can try modifying the accents and breathings on a word to get
				more results. Show these results:`)

				radio(
					["Never", "Only as fallback", "Always"],
					otherAccentsResultsMode,
					[
						"Only show results which exactly match the accents and breathings in the text",
						`Show results from trying different accents and breathings, but only when no
						results are found when using the accents and breathings in the text. The results
						produced from trying different accents and breathings will be noted as such
						in the results pane.`,
						`Always show what results would be produced by trying different accents and
						breathings. The results	produced from trying different accents and breathings will be noted as such
						in the results pane.`
					]
				)
			})
			div(()=>{
				h5("Advanced Options")
				toggle("Show all detail flags", showAllDetailFlags,
				`The Morpheus engine provides various output flags with its results. Most of these
				flags can be cryptic to new users, and so by defaultVocabulator hides all flags except for
				dialect information. You can enable this option to show all flags.` )
			})
		}
	})
}

function renderResultsWithPermutedAccents(word: string, mode: RenderMode) {
	let permutedAccents = permuteAccents(unicodeToBetacode(word.toLowerCase()))
	console.log("got raw permuted accents", permutedAccents.slice(0))
	permutedAccents = permutedAccents.map(w => betacodeToUnicode(w))
	console.log("got betacode permuted accents", permutedAccents.slice(0))
	if (word.toLowerCase() !== word) {
		permutedAccents = permutedAccents.map(w => w[0].toUpperCase()+w.substring(1))
	}

	console.log("got permuted accents", permutedAccents)

	D.addAsyncReplaceable(async ($r)=>{
		$r(()=>{
			div({class:"spinner-border"})
		})

		const resultsOfPermuted = await Promise.all(permutedAccents.map(async (modifiedWord) => ({modifiedWord, results: await lemmatizer.lookup(modifiedWord)})))

		$r(()=>{
			const totalResults = resultsOfPermuted.map(r => r.results.length).reduce((acc,val)=>acc+val, 0)
			if (totalResults > 0) {
				if (D.sample(otherAccentsResultsMode) === 1) {
					if (mode === RenderMode.hover) {
						p(`No results for ${word} when using strict diacritic matching.`)
					} else {
						printOutputWord(word, mode, ()=>{
							$text(word)
						})
						D.addText(" ")
						span({style:"background-color:orange;font-weight:bold"}, "NO RESULTS WITH STRICT DIACRITICS")
						br()
					}
				}

				for (const {modifiedWord, results} of resultsOfPermuted) {
					if (results.length > 0) {
						if (mode === RenderMode.hover) {
							h4({class:"mt-4"}, ()=>{
								D.elements.i("Results for")
								$text(" "+betacodeToUnicode(modifiedWord))
							})
							renderResults(word, results, mode)
						} else {
							div({style:"border:1px solid black; break-inside: avoid; margin-bottom: 0.2em;"}, ()=>{
								D.elements.i("Results for ")
								D.elements.b(betacodeToUnicode(modifiedWord))
								br()
								renderResults(betacodeToUnicode(modifiedWord), results, mode)
							})
						}
					}
				}
			} else {
				if (mode === RenderMode.hover) {
					p(`No results, even without strict diacritic matching.`)
				}
			}

			if (mode !== RenderMode.hover) {
				renderCustomResults(word, totalResults, mode)
			}
		})
	})
}


function pageLoadHelp() {
	h3("Welcome to Vocabulator!")
	p("To get started, enter Greek text in the box to the right.")
	p(`Then hover over a word in the reader to see information about it, or click on it to "anchor" it as the current word.`)
	p(`For more information, see the Help page.`)
}

export default function resultsSidebar() {
	tabs([{
		name:"Hover Only"
		,inner:()=>{
			button({style:"position: absolute; top: 0; right:0", class:"btn btn-primary", onclick:()=>{
				settingsModal()
			}
			}, ()=>{
				D.addHTML(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gear-fill" viewBox="0 0 16 16">
				<path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
			  </svg>`)
			})
			D.addDynamic(()=>{
				//console.time("Rerender results pane")

				const word = activeWord() || hoverWord()
				if (word === "") {
					pageLoadHelp()
					return
				}

				D.elements.a({
					style:"font-size: 1.2em; text-decoration: none; float: right;",
					href:`https://www.perseus.tufts.edu/hopper/morph?l=${word}`,
					target:"_blank",
					title:"Open Perseus Greek Word Study Tool search in new tab",
				}, ()=>{
					searchIcon()
				})
				D.elements.h3(word)

				toggle("Known", knownWords.port(word.toLowerCase()) as D.Signal<boolean>)
				div({class:"text-muted", style:"font-size: 0.7em; margin-top: -0.3em;"}, "right click in the reader to toggle")


				const customResultsKey = word.toLowerCase()

				const currentOtherAccentsResultsMode = otherAccentsResultsMode()
				D.addAsyncReplaceable(async ($r)=>{
					$r(()=>{
						div({class:"spinner-border"})
					})
					const strictResults = await lemmatizer.lookup(word)
					console.log("got strict results ", strictResults)
					$r(()=>{
						if (currentOtherAccentsResultsMode === 0) {
							if (strictResults.length === 0) {
								span("No results.")
							} else {
								renderResults(word, strictResults, RenderMode.hover)
							}
						} else if (currentOtherAccentsResultsMode === 1) {
							if (strictResults.length > 0) {
								renderResults(word, strictResults, RenderMode.hover)
							} else {
								renderResultsWithPermutedAccents(word, RenderMode.hover)
							}
						} else {
							renderResultsWithPermutedAccents(word, RenderMode.hover)
						}

						div({style:"font-size: 0.8em; margin-top: 1rem;"}, ()=>{
							D.addHTML(`Analysis by the <a href="https://github.com/PerseusDL/morpheus" target="_blank">Morpheus</a> engine, definitions from the <a href="https://alpheios.net/" target="_blank">Alpheios</a> project. `)

							modalLink("Full Credits", "Credits", ()=>{
								D.addHTML(`
									<ul>
										<li>Morphological analysis by the <a href="https://github.com/PerseusDL/morpheus" target="_blank">Morpheus</a> engine from the Perseus Digital Library at Tufts University.
											<ul>
												<li>Morpheus was ported to the web with <a href="https://emscripten.org/" target="_blank">Emscripten</a>.</li>
											</ul>
										</li>
										<li><p>Word definitions collected by the <a href="https://alpheios.net/" target="_blank">Alpheios</a> project. (<a href="https://github.com/alpheios-project/mjm" target="_blank">Source</a>)</p>


											<p>Original dictionary credits:
											<ul>
												<li>"An Intermediate Greek-English Lexicon" (Henry George Liddell, Robert Scott). Provided by the Perseus Digital Library at Tufts University. Edits and additions provided by Vanessa Gorman, University of Nebraska.</li>
												<li>Wilfred E. Major, <i>Core Greek Vocabulary for the First Two Years of Greek</i>. CPL Online, Winter 2008. Edits and additions provided by Vanessa Gorman, University of Nebraska.</li>
											</ul></p>
										</li>
										<li>UI components from <a href="https://getbootstrap.com" target="_blank">Bootstrap</a>. Licensed under the MIT license.</li>
										<li>Icons from <a href="https://icons.getbootstrap.com/" target="_blank">Bootstrap Icons</a>. Licensed under the MIT license.</li>
									</ul>
								`)
							})
						})

						D.elements.h3({class:"mt-3"}, "Custom Results")

						const customResultsInput = greekInputBox(D.toSignal<string>(()=>customResults.get(customResultsKey) ?? "", (v) => customResults.set(customResultsKey, v)), true, true)
						customResultsInput.className = "form-control"
						customResultsInput.placeholder = "Put custom results here, with Greek and English on alternate lines."
						D.addNode(customResultsInput)

						br()
						renderCustomResults(word, strictResults.length, RenderMode.hover)
					})

				})

			})
		}}
		,{
			name:"For Print"
			,inner:()=>{
				textarea({value: printHeader, class:"form-control", placeholder:"Enter a print header here..."})
				div({class:"row g-3 align-items-center"}, ()=>{
					div({class:"col-md-8 col-sm-12"},()=>{
						integerInput("Font Size", "pt", 8, 4, 16, printFontSize)
					})
					div({class:"col-md-4 col-sm-12"},()=>{
						integerInput("Columns", "", 4, 1, 6, printNColumns)
					})
				})
				button({onclick:()=>{
					print(()=>{
						renderForPrint()
					})
				}, class: "btn btn-primary"}, "Print")
				hr()
				renderAllWords(RenderMode.preview)
			}
		}]
	,printMode)
}
