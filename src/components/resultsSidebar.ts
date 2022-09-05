import { findWords } from "../utils/utils.js"
import { customText, currentWork, printFontSize, printNColumns, knownWords, customResults,parsingsDisplayMode, workSearchMode, searchText, searchLocation, hoverWord, activeWord, printMode, toggleKnown, cosmeticUV, currentTextResult, printHeader, showAllDetailFlags } from "../state/state.js"
import * as D from "dynein"
import tabs from "./tabs.js"
import toggle from "./toggle.js"
import integerInput from "./integerInput.js"
import { Result } from "../engine/lemmatizer.js"
import * as lemmatizer from "../engine/lemmatizer.js"

import radio from "./radio.js"

import print from "../utils/print.js"
import greekInputBox, { betacodeToUnicode } from "./greekInputBox.js"
import { standardDetailFlagsDisplayGroups } from "../engine/parseFlags.js"
import modalLink from "./modalLink.js"

const $if = D.addIf
const $text = D.addText
const $ = D.createSignal

const { textarea, div, button, ul, li, input, span, br, dl, dd, hr, p } = D.elements
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

function renderResults(word: string, results: Result[], mode: RenderMode) {
	//console.log("got results", results)

	let prev: Result | undefined
	for (const result of results) {
		const {english, lemma, flags, detailFlags} = result

		if (mode !== "hover") {
			if (prev?.english !== result.english) {
				D.elements.u({
					onclick:(evt: MouseEvent)=>{
						forPrintLemmaClickHandler(evt, word, mode)
					},
					oncontextmenu:(evt)=>{
						evt.preventDefault()
						toggleKnown(word)
					},
					class:()=>(mode === "preview" && activeWord() === word) ? "result active" : "result"
				},()=>{
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
					D.elements.u({onclick:(evt: MouseEvent)=>{
						forPrintLemmaClickHandler(evt, word, mode)
					}, class:()=>(mode === "preview" && activeWord() === word) ? "result active" : "result", style:"font-weight:bold"},word)
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
				const resultGroups = await Promise.all(words.map(async (word)=>{
					return {word, results: await lemmatizer.lookup(word)}
				}))
				console.log("done!")

				$r(()=>{
					for (let {word, results} of resultGroups) {
						$if(()=>!knownWords.has(word.toLowerCase()),()=>{
							renderResults(word, results, mode)
							renderCustomResults(word, results.length, mode)
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


export default function resultsSidebar() {
	tabs([{
		name:"Hover Only"
		,inner:()=>{
			D.addDynamic(()=>{
				//console.time("Rerender results pane")

				div({class:"d-flex justify-content-between"}, ()=>{
					div(()=>{
						span("Parsing Display: ")
						radio(["None", "Short", "Long"], parsingsDisplayMode)
					})
					div(()=>{
						toggle("Show all detail flags", showAllDetailFlags)
					})
				})



				let word = activeWord() || hoverWord()
				D.elements.a({
					style:"font-size: 1.2em; text-decoration: none; float: right;",
					href:`https://www.perseus.tufts.edu/hopper/morph?l=${word}`,
					target:"_blank",
					title:"Open Perseus Greek Word Study Tool search in new tab",
				}, ()=>{
					searchIcon()
				})
				D.elements.h3(word)


				let ignoreCheck = word.toLowerCase()
				let regularResults = word === "" ? [] : lemmatizer.lookupSignal(word)

				toggle("Known", knownWords.port(word.toLowerCase()) as D.Signal<boolean>)
				div({class:"text-muted", style:"font-size: 0.7em; margin-top: -0.3em;"}, "right click in the reader to toggle")

				br()
				if (!regularResults) {
					div({class:"spinner-border"})
					return
				}

				if (regularResults.length === 0) {
					span("No results.")
				} else {
					renderResults(word, regularResults, RenderMode.hover)



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
				}
				D.elements.h3({class:"mt-3"}, "Custom Results")

				const customResultsInput = greekInputBox(D.toSignal<string>(()=>customResults.get(ignoreCheck) ?? "", (v) => customResults.set(ignoreCheck, v)), true, true)
				customResultsInput.className = "form-control"
				customResultsInput.placeholder = "Put custom results here, with Greek and English on alternate lines."
				D.addNode(customResultsInput)

				br()
				renderCustomResults(word, regularResults.length, RenderMode.hover)
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
