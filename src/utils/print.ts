import * as D from "dynein"

export default function print(inner: ()=>void) {
	console.log("attempting to print...")
	let hiddenFrame = document.createElement("iframe");
	hiddenFrame.onload = ()=>{
		console.log("hidden frame loaded!")
		if (!hiddenFrame.contentWindow) {
			throw new Error("Unable to print: No window")
		}
		const doc = hiddenFrame.contentWindow.document

		D.createRootScope(()=>{
			D.addPortal(doc.body, inner) //inner will append elements created in document not doc, but that seems to work.
		})
		hiddenFrame.contentWindow.print()
	}
	hiddenFrame.style.position = "fixed";
	hiddenFrame.style.right = "0";
	hiddenFrame.style.bottom = "0";
	hiddenFrame.style.width = "0";
	hiddenFrame.style.height = "0";
	hiddenFrame.style.border = "0";
	hiddenFrame.srcdoc = ""
	document.body.appendChild(hiddenFrame);
}
