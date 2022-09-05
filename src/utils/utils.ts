import * as D from "dynein"

class CSSManager {
	private refs: Map<string, {count: number, el: HTMLStyleElement}>

	constructor() {
		this.refs = new Map()
	}

	add(styles: string) {
		if (!this.refs.get(styles)) {
			let el = document.createElement("style")
			//console.log("adding",styles)
			el.textContent = styles
			document.head.appendChild(el)
			this.refs.set(styles, {
				count:0
				,el
			})
		}
		this.refs.get(styles)!.count++
	}

	remove(styles: string) {
		const ref = this.refs.get(styles)
		if (ref) {
			ref.count--
			if (ref.count <= 0) {
				ref.el.remove()
				this.refs.delete(styles)
			}
		}
	}
}
const cssManager = new CSSManager()

function css({raw:rawStrings}: TemplateStringsArray,...exprs: any[]) {
	let len = Math.max(rawStrings.length,exprs.length)
	let joined = ""
	for (var i = 0; i<len; i++) {
		if (rawStrings.length > i) {
			joined += rawStrings[i]
		}
		if (exprs.length > i) {
			joined += exprs[i]
		}
	}

	cssManager.add(joined)
	D.onCleanup(()=>{
		cssManager.remove(joined)
	})
}


function escapeRegExp(str: string) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
function toSearchRegexp(str: string) {
	return new RegExp(str.split(/\s+/g).map(escapeRegExp).join("[\\s\\W]+"), "i")
}

function findWords(text: string, handleWord: (word: string)=>void, handleBetween: (between: string)=>void) {
	let reg = /[\u0370-\u03ff\u1f00-\u1fff\u02BC]+/g
	let lastWordEnd = 0
	let match = reg.exec(text)
	while (match) {
		let between = text.substring(lastWordEnd,match.index)
		handleBetween(between)
		let word = match[0]
		handleWord(word)
		lastWordEnd = reg.lastIndex
		match = reg.exec(text)
	}
	handleBetween(text.substring(lastWordEnd))
}

let idCounter = 0
function makeID() {
	return "_id"+(idCounter++)
}

export { escapeRegExp, toSearchRegexp, css, findWords, makeID }
