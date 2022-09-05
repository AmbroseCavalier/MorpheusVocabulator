import * as D from "dynein"
const $ = D.createSignal

export default class FastSet<T> {
	private keys: Map<T, D.Signal<boolean>> = new Map()
	private onAddKey: D.Signal<true> = D.createSignal(true, true)

	constructor(init: T[] = []) {
		for (const item of init) {
			this.add(item)
		}
	}

	port(item: T): D.Signal<boolean> {
		if (!this.keys.has(item)) {
			this.onAddKey(true)
			this.keys.set(item, $(false))
		}
		return this.keys.get(item)!
	}

	has(item: T) {
		return this.port(item)()
	}

	add(item: T) {
		this.port(item)(true)
	}

	delete(item: T) {
		this.port(item)(false)
	}

	clear() {
		for (const port of this.keys.values()) {
			port(false)
		}
	}

	*[Symbol.iterator](): Generator<T> {
		this.onAddKey()
		for (const [key, port] of this.keys.entries()) {
			if (port()) {
				yield key
			}
		}
	}
}
