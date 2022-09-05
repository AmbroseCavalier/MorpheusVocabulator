import * as D from "dynein"
import MarkedString from "./MarkedString"

interface HistoryEntry {
	selStart: number,
	selEnd: number,
	selDir: "forward" | "backward" | "none" | undefined
	value: string,
	next: HistoryEntry | null,
	prev: HistoryEntry | null,
	time: number
}

const historyDelay = 1000

export default function replacingInput(value: D.Signal<string>, replace: (str: MarkedString, ev?: KeyboardEvent)=>MarkedString, multiline?: boolean) {
	let currentHistoryItem: HistoryEntry | null = null

	const input = document.createElement(multiline ? "textarea" : "input")
	if (!multiline) {
		(input as HTMLInputElement).type = "text"
	}
	input.value = D.sample(value)

	let updating = false

	let latestEvent: KeyboardEvent | undefined = undefined
	function update() {
		let str = new MarkedString(input.value)
		const selStart = input.selectionStart
		const selEnd = input.selectionEnd
		const selDir = input.selectionDirection ?? undefined
		if (selStart === null || selEnd === null) {
			console.warn("selStart or selEnd null")
			return
		}

		str = str.setMarker("selectionStart", selStart)
		str = str.setMarker("selectionEnd", selEnd)
		str = replace(str, latestEvent)
		const newStr = str.toString()
		const newSelStart = str.getMarker("selectionStart")??newStr.length
		const newSelEnd = str.getMarker("selectionEnd")??newStr.length
		input.value = newStr
		input.setSelectionRange(newSelStart, newSelEnd, selDir)
		if (newStr !== D.sample(value)) {
			updating = true
			value(newStr)
		}

		const historyItem: HistoryEntry = {
			selStart: newSelStart,
			selEnd: newSelEnd,
			selDir,
			value: newStr,
			next: null,
			prev: null,
			time: Date.now()
		}
		if (newStr !== currentHistoryItem?.value) {
			if (currentHistoryItem) {
				if (currentHistoryItem.time+historyDelay < Date.now()) {
					//console.log("add history item")
					currentHistoryItem.next = historyItem
					historyItem.prev = currentHistoryItem
				} else {
					//console.log("replace history item")
					if (currentHistoryItem.prev) {
						historyItem.prev = currentHistoryItem.prev
						currentHistoryItem.prev.next = historyItem //overwrite old history item
					}
				}
			}
			currentHistoryItem = historyItem
			//console.log("current history item = ",currentHistoryItem)
		}

	}

	input.className = "form-control form-control-lg"
	input.oninput = update
	input.onkeydown = (evt) => {
		let updatedState = false
		if (evt.key === "z" && evt.ctrlKey) {
			evt.preventDefault()
			const prevItem = currentHistoryItem?.prev
			//console.log("prevItem", prevItem)

			if (prevItem) {
				updatedState = true
				currentHistoryItem = prevItem
			}
		} else if (evt.key === "y" && evt.ctrlKey) {
			//console.log("try redo")
			evt.preventDefault()
			const nextItem = currentHistoryItem?.next
			if (nextItem) {
				updatedState = true
				currentHistoryItem = nextItem
			}
		}
		if (updatedState && currentHistoryItem) {
			latestEvent = undefined
			value(currentHistoryItem?.value)
			input.setSelectionRange(currentHistoryItem.selStart, currentHistoryItem.selEnd, currentHistoryItem.selDir)
			return
		}
		latestEvent = evt
		update()
	}

	D.onUpdate(value, (newVal)=>{
		if (!updating) {
			input.value = newVal
			update()
		}
		updating = false
	})
	update()
	return input
}
