import * as D from "dynein"
import contentPageWrapper from "../components/contentPageWrapper.js"
import greekInputBox from "../components/greekInputBox.js"
import { knownWords } from "../state/state.js"

const { h1, span, div, textarea, p, button } = D.elements
const $ = D.createSignal

export default function editPage() {
	contentPageWrapper(()=>{
		h1("Known Words")

		p("You can easily save and edit your known words list by putting words in this box, one on each line.")

		const textareaValue = $("")
		D.untrack(()=>{
			textareaValue(Array.from(knownWords).join("\n"))
		})

		const box = greekInputBox(textareaValue, true)
		box.className = "form-control"
		D.addNode(box)

		//TODO: it would be nice if it auto-saved and auto-updated but there's a tricky state problem
		button({class:"btn btn-primary", onclick:()=>{
			const raw = textareaValue()
			let lines = raw.trim().split(/\n+/).map(seg => seg.trim()).filter(word => word)
			D.batch(()=>{
				knownWords.clear()
				for (let word of lines) {
					knownWords.add(word)
				}
			})
		}}, "Save")
		D.onUpdate(()=>Array.from(knownWords), ()=>{
			textareaValue(Array.from(knownWords).join("\n"))
		})
	})
}
