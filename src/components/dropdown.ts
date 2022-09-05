import * as D from "dynein"
const { select, option } = D.elements

export default function dropdown(choices: string[], value: D.Signal<string>) {
	let el = select({value: value, class:"form-select"}, ()=>{
		for (let choice of choices) {
			option(choice)
		}
	}) as HTMLSelectElement
	el.value = D.sample(value)
}
