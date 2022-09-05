/*

css`
.word {
	cursor: pointer;
}

.word:hover:not(.active) {
	background-color: #b3ffb3;
}

.word.active {
	background-color: black;
	color: white;
}

.word.ignored {
	color: gray;
}*/

import * as D from "dynein"
import reader from "../components/reader.js"
import resultsSidebar from "../components/resultsSidebar.js"

const { div, span, button } = D.elements

export default function mainPage() {
	div({class:"container-fluid", style:"max-height: inherit"}, ()=>{
		div({class:"row", style:"max-height: inherit"}, ()=>{
			div({class:"col-6",style:"overflow-y: auto;max-height: inherit"}, ()=>{
				resultsSidebar()
			})
			div({class:"col-6", style:"overflow-y: auto;max-height: inherit"}, ()=>{
				reader()
			})
		})
	})
}
