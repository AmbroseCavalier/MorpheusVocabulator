import * as D from "dynein"
import { loadingQuoteN } from "../state/state.js"
const { h1, h2, h3, div, span, br } = D.elements

const quotes: [string,string][] = [
	["Quo usque tandem abutere, Vocabulator, patientia nostra?", "Cicero"]
	,["Animus aequus optimus est aerumnae condimentum.", "Plautus"]
	,["Patientia comes est sapientiae.", "Augustinus"]
	,["Perfer et obdura; dolor hic tibi proderit olim.", "Ovid"]
	,["Patientia lenietur princeps, et lingua mollis confringet duritiam.", "Liber Proverbiorum XXV"]
]
export default function loadingPage() {
	div({class:"d-flex justify-content-center align-items-center text-center", style:"height: 100vh"}, ()=>{
		div(()=>{
			h1({style:"font-size: 6em"}, "Vocabulator")
			const n = D.sample(loadingQuoteN)
			const [quote, author] = quotes[n % quotes.length]
			loadingQuoteN((n+1) % quotes.length)
			h2({style:"font-style: italic"}, quote)
			h3({style:"text-align: right"}, "—"+author)
			br()
			div({class:"spinner-border",role:"status"},()=>{
				span({class:"visually-hidden"},"Loading...")
			})
		})
	})

	div({class:"position-fixed bottom-0 end-0 start-0 text-center text-muted"}, "Created by Ambrose Cavalier")
	div({class:"position-fixed bottom-0 end-0 text-muted"}, "vDEVELOPMENT")
}
