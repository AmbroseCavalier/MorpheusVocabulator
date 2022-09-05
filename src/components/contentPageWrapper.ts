import * as D from "dynein"
const {div} = D.elements

export default function contentPageWrapper(inner: ()=>void) {
	div({class:"container"}, ()=>{
		div({class:"row justify-content-center"}, ()=>{
			div({class:"col-sm-12 col-md-8 col-lg-6", style:"text-align:justify"}, ()=>{
				inner()
			})
		})
	})
}
