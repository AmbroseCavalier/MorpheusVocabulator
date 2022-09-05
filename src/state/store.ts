import * as D from "dynein"
import { WatchedMap, WatchedSet, WatchedArray } from "@dynein/watched-builtins"
import FastSet from "./FastSet"

class PersistentStore {
	private key: string
	private formatVersion: number
	private updaters: ((oldDB: any)=>void)[] //updater[i] converts DB of version[i] to version[i+1]
	private raw: any

	constructor(localStorageKey: string, formatVersion: number, updaters: ((oldDB: any)=>void)[]) {
		this.key = localStorageKey
		this.formatVersion = formatVersion
		this.updaters = updaters
		if (this.updaters.length !== this.formatVersion) {
			throw new Error("number of DB updaters does not match current version")
		}

		this.init()
	}

	private init() {
		const raw = localStorage.getItem(this.key)
		if (!raw) {
			console.warn("Creating new database.")
			this.reset()
			return
		}
		let value = JSON.parse(raw)
		if (typeof value.v !== "number") {
			console.warn("got invalid database. Resetting")
			this.reset()
			return
		}
		if (value.v < this.formatVersion) {
			const oldVersion = value.v
			console.warn("Got old DB version. Attempting to update...")
			for (let i = 0; i<this.updaters.length; i++) {
				this.updaters[i](value.d)
			}
			const backupKey = `${this.key}_old${oldVersion}`
			console.log(`Update successful. Backing up old version to "${backupKey}".`)
			localStorage.setItem(backupKey, raw)
			this.raw = value.d
			this.save()
		} else {
			this.raw = value.d
		}
	}

	private reset() {
		this.raw = {}
		this.save()
	}

	private save() {
		console.log("Saving...")
		localStorage.setItem(this.key, JSON.stringify({v: this.formatVersion, d: this.raw}))
	}

	map(name: string, defaultValue: [string,string][]): WatchedMap<string,string> {
		const out = new WatchedMap<string,string>()
		const init = this.raw[name] ?? defaultValue
		for (let [key,value] of init) {
			out.set(key,value)
		}
		D.createRootScope(()=>{
			D.createEffect(()=>{
				this.raw[name] = Array.from(out.value().entries())
				this.save()
			})
		})
		return out
	}

	set(name: string, defaultValue: string[]): WatchedSet<string> {
		const out = new WatchedSet<string>()
		const init = this.raw[name] ?? defaultValue
		for (let v of init) {
			out.add(v)
		}
		D.createRootScope(()=>{
			D.createEffect(()=>{
				this.raw[name] = Array.from(out.value())
				this.save()
			})
		})
		return out
	}

	fastSet(name: string, defaultValue: string[]): FastSet<string> {
		const out = new FastSet<string>()
		const init = this.raw[name] ?? defaultValue
		for (let v of init) {
			out.add(v)
		}
		D.createRootScope(()=>{
			D.createEffect(()=>{
				const flat: string[] = Array.from(out)
				this.raw[name] = flat
				this.save()
			})
		})
		return out
	}

	value<T extends (number | string | boolean)>(name: string, defaultValue: T): D.Signal<T> {
		const out = D.createSignal<T>(undefined as unknown as T)
		if (this.raw[name] !== undefined) {
			out(this.raw[name])
		} else {
			out(defaultValue)
		}
		D.createRootScope(()=>{
			D.createEffect(()=>{
				this.raw[name] = out()
				this.save()
			})
		})
		return out
	}
}

export default PersistentStore
