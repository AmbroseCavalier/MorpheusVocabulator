import * as D from "dynein"
const { label, input, div, span } = D.elements
import { makeID } from "../utils/utils.js"

export default function integerInput(labelText: string, units: string, defaultValue: number, min: number, max: number, value: D.Signal<number>) {
	const port = D.toSignal<string>(()=>{
		return Math.round(value()).toString()
	}, (newVal: string) => {
		let newNum = parseInt(newVal.trim())
		if (!isNaN(newNum)) {
			newNum = Math.round(newNum)
			if (newNum < min) {
				newNum = min
			} else if (newNum > max) {
				newNum = max
			}
		} else {
			newNum = defaultValue
		}
		value(newNum)
	})
	const id = makeID()
	div({},()=>{
		label({class:"form-check-label",for:id},labelText)
		input({class:"form-range",id,type:"range", min, max, value:port})
		span(()=>{
			D.addText(()=>(Math.round(value())+" "+units).trim())
		})

	})
}
