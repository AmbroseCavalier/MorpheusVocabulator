import * as D from "dynein"

const { div, h5, button } = D.elements


export default function modal({title, body, footer, onclose}: {title: ()=>void, body: (closeModal:()=>void)=>void, footer?:()=>void, onclose?: ()=>void}) {
	const open = D.createSignal(true)
	const closeModal = ()=>open(false)
	D.createEffect(()=>{
		if (open()) {
			D.addPortal(document.body, ()=>{
				div({class:"modal show", style:"display:block; overflow-y: auto;"}, ()=>{
					div({class:"modal-dialog"}, ()=>{
						div({class:"modal-content"}, ()=>{
							div({class:"modal-header"}, ()=>{
								h5({class:"modal-title"}, title)
								button({class:"btn-close", onclick:()=>{
									closeModal()
									if (onclose) {
										onclose()
									}
								}})
							})
							div({class:"modal-body"}, ()=>{
								body(closeModal)
							})
							if (footer) {
								div({class:"modal-footer"}, footer)
							}
						})
					})
				})
				div({class:"modal-backdrop show"})
			})
		}
	})
}
