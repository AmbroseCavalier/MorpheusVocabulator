import * as D from "dynein"
const $if = D.addIf
const {div, input, label} = D.elements
import { makeID } from "../utils/utils.js"

export default function radio(options: string[], value: D.Signal<number>) {
	const groupID = makeID()
	for (let i = 0; i<options.length; i++) {
		const id = makeID()
		const port = D.toSignal<boolean>(()=>value() === i, (checked: boolean) => {
			if (checked) {
				value(i)
			}
		})

		div({class:"form-check form-check-inline"},()=>{
			input({class:"form-check-input",type:"radio",name:groupID,id, checked:port})
			label({class:"form-check-label",htmlFor:id},options[i])
		})
	}
}
