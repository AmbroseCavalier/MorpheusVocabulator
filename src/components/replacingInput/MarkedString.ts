import GraphemeSplitter from "grapheme-splitter";

const splitter = new GraphemeSplitter();

class ImmutableMap<K, V> {
	private map: Map<K, V>

	constructor(init: Map<K,V>) {
		this.map = new Map(init)
	}

	set(key: K, value: V) {
		const clone = this.clone()
		clone.map.set(key, value)
		return clone
	}

	get(key: K) {
		return this.map.get(key)
	}

	has(key: K) {
		return this.map.has(key)
	}

	delete(key: K) {
		const clone = this.clone()
		clone.map.delete(key)
		return clone
	}

	private clone() {
		return new ImmutableMap(this.map)
	}

	[Symbol.iterator]() {
		return this.map[Symbol.iterator]()
	}
}

export default class MarkedString {
	private str: string
	private markers: ImmutableMap<string, number>

	constructor(str: string, markers: ImmutableMap<string, number> | Map<string, number> = new Map()) {
		this.str = str
		if (markers instanceof ImmutableMap) {
			this.markers = markers
		} else {
			this.markers = new ImmutableMap(markers)
		}
	}

	toString() {
		return this.str
	}

	setMarker(key: string, index: number) {
		return new MarkedString(this.str, this.markers.set(key, index))
	}

	deleteMarker(key: string, index: number) {
		return new MarkedString(this.str, this.markers.delete(key))
	}

	getMarker(key: string) {
		return this.markers.get(key)
	}

	hasMarker(key: string) {
		return this.markers.has(key)
	}

	moveMarkersToEnds() {
		const midPoint = this.str.length/2
		const shiftedMarkers = new Map<string, number>()
		for (const [key,val] of this.markers) {
			if (val < midPoint) {
				shiftedMarkers.set(key, 0)
			} else {
				shiftedMarkers.set(key, this.str.length)
			}
		}
		return new MarkedString(this.str, shiftedMarkers)
	}

	replaceString(newStr: string) {
		return new MarkedString(newStr, this.markers)
	}

	substring(start: number, end: number = this.str.length) {
		const slicedMarkers = new Map<string, number>()
		for (const [key,val] of this.markers) {
			if (start <= val && (val < end || (end == start && val === start))) {
				slicedMarkers.set(key, val-start)
			}
		}

		return new MarkedString(this.str.substring(start, end), slicedMarkers)
	}

	concat(str: MarkedString) {
		const mergedMarkers = new Map<string, number>()
		for (const [key,val] of this.markers) {
			mergedMarkers.set(key, val)
		}
		for (const [key,val] of str.markers) {
			mergedMarkers.set(key, val+this.str.length)
		}
		return new MarkedString(this.str+str, mergedMarkers)
	}

	replaceRange(start: number, end: number, newString: string) {
		const before = this.substring(0, start)
		const between = this.substring(start, end)
		const after = this.substring(end)
		return before.concat(between.replaceString(newString).moveMarkersToEnds()).concat(after)
	}

	replace(regexp: RegExp, replace: string): MarkedString
	replace(regexp: RegExp, replace: (match: RegExpMatchArray, seg: MarkedString) => MarkedString): MarkedString

	replace(regexp: RegExp, replace: string | ((match: RegExpMatchArray, seg: MarkedString) => MarkedString)) {

		regexp.lastIndex = 0
		let match: RegExpMatchArray | null = null

		let out = new MarkedString("")
		let lastIndex = 0
		while (true) {
			match = regexp.exec(this.str)
			if (!match) {
				break
			}
			const idx = match.index!
			const sinceLast = this.substring(lastIndex, idx)
			const range = this.substring(idx, idx+match[0].length)
			out = out.concat(sinceLast)
			if (typeof replace === "function") {
				const processed = replace(match, range)
				out = out.concat(processed)
			} else {
				out = out.concat(range.replaceString(replace).moveMarkersToEnds())
			}
			lastIndex = idx+match[0].length

			if (!regexp.global) {
				break
			}
		}
		out = out.concat(this.substring(lastIndex))
		return out
	}

	splitGraphemes(): MarkedString[] {
		const out: MarkedString[] = []
		let idx = 0
		for (const split of splitter.iterateGraphemes(this.str)) {
			const endIdx = idx+split.length
			out.push(this.substring(idx, endIdx))
			idx = endIdx
		}
		return out
	}

	static join(arr: MarkedString[], joinMarker: MarkedString): MarkedString {
		const mergedMarkers = new Map<string, number>()
		const mergedStr = arr.map(s => s.str).join("")

		let idx = 0
		for (const seg of arr) {
			if (idx !== 0) {
				for (const [markerID, relativeIndex] of joinMarker.markers) {
					mergedMarkers.set(markerID, idx+relativeIndex)
				}
				idx += joinMarker.str.length
			}
			for (const [markerID, relativeIndex] of seg.markers) {
				mergedMarkers.set(markerID, idx+relativeIndex)
			}
			idx += seg.str.length
		}
		return new MarkedString(mergedStr, mergedMarkers)
	}
}
