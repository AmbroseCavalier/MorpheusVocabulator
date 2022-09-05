import * as D from "dynein"
const { div, span, button, nav, li, ul} = D.elements
const $if = D.addIf
const $ = D.createSignal
const $text = D.addText

interface NavPage {
	name: string
	,inner: ()=>void
}

export default function navbar(brand: string, pages: NavPage[]) {
	const currentPage = $(0)

	div({class:"d-flex flex-column", style:"max-height: 100vh"}, ()=>{
		nav({class:"navbar navbar-expand navbar-light bg-light"},()=>{
			div({class:"container-fluid"},()=>{
				D.elements.a({class:"navbar-brand", onclick:()=>{
					currentPage(0)
				}},brand)
				div({class:"collapse navbar-collapse"},()=>{
					ul({class:"navbar-nav me-auto mb-2 mb-lg-0"},()=>{
						for (let i = 0; i<pages.length; i++) {
							li({class:"nav-item", onclick:()=>{
								currentPage(i)
							}},()=>{
								D.elements.a({class:()=>`nav-link ${i === currentPage() ? "active" : ""}`},pages[i].name)
							})
						}
					})
				})
			})
		})

		div({style:"max-height:calc(100vh - 63px);"}, ()=>{
			for (let i = 0; i<pages.length; i++) {
				$if(()=>i === currentPage(), ()=>{
					pages[i].inner()
				})
			}
		})
	})
}
