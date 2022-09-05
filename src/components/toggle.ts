import * as D from "dynein"
const { label, input, div } = D.elements
import { makeID } from "../utils/utils.js"

export default function toggle(labelText: string, value: D.Signal<boolean>) {
	const id = makeID()
	div({class:"form-check form-switch"},()=>{
		input({class:"form-check-input",id,type:"checkbox", checked:value})
		label({class:"form-check-label",for:id},labelText)
	})
}
