import * as D from "dynein"
import modal from "./modal";
const $ = D.createSignal;
const { div, textarea, button, span, h1, input, label, table, tr, td, th, h3, h5, tbody, thead, br, select, option, hr, p} = D.elements;
const $text = D.addText;

export default function modalLink(linkText: string, titleText: string, inner: ()=>void) {
	span({class:"fw-bold text-decoration-underline", style:"cursor: pointer", onclick:()=>{
		modal({
			title: ()=>{
				$text(titleText)
			},
			body: ()=>{
				inner()
			}
		})
	}
	}, linkText)
}
