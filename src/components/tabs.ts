import * as D from "dynein"
const $if = D.addIf
const {ul, li, button} = D.elements

interface TabPage {
	name: string
	,inner: ()=>void
}

export default function tabs(pages: TabPage[], index: D.Signal<number>) {
	ul({class:"nav nav-pills"},()=>{
		for (let i = 0; i<pages.length; i++) {
			li({class:"nav-item"},()=>{
				D.elements.a({onclick:()=>{ index(i) }, class:()=>`nav-link ${i === index() ? "active" : ""}`},pages[i].name)
			})
		}
	})

	for (let i = 0; i<pages.length; i++) {
		$if(()=>i === index(), ()=>{
			pages[i].inner()
		})
	}
}
