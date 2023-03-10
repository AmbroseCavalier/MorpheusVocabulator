import * as D from "dynein"

import mainPage from "./pages/main.js"
import helpPage from "./pages/help.js"
import editPage from "./pages/edit.js"
import aboutPage from "./pages/about.js"

import navbar from "./components/navbar.js"

import { css } from "./utils/utils.js"

console.log(`
Welcome to Greek Vocabulator vDEVELOPMENT!
====================================

For more information, see the writeup at https://ambrosecavalier.com/projects/greek-vocabulator/about
`)

const { div, span, button, strong, a } = D.elements
const $ = D.createSignal
const $text = D.addText

D.createRootScope(()=>{
	css`
	a {
		cursor: pointer;
	}

	div {
		scrollbar-color: var(--bs-primary) var(--bs-light);
	}

	.header {
		font-size: 3.5em;
		text-align: center;
		margin-top: 2em;
		margin-bottom: 1em;
	}

	h1 {
		text-align: left;
	}

	.subheader {
		font-size: 1.2em;
		text-align: center;
		font-weight: normal;
		margin-bottom: 1em;
		font-family: "Times New Roman", serif;
		font-style: italic;
	}

	.word, .result {
		cursor: pointer;
	}

	.word {
		padding-left: 2px;
		padding-right: 2px;
	}

	.word:hover:not(.active) {
		background-color: #b3ffb3;
	}

	.word.active, .result.active {
		background-color: black;
		color: white;
	}

	.word.ignored {
		color: gray;
	}
	`
})


const latestVersion = $("")

//@ts-ignore
window.latestVersion = latestVersion
async function tryGetLatestVersion() {
	//@ts-ignore
	latestVersion(window.LATESTVERSION ?? "")
}


async function app() {
	tryGetLatestVersion()
	document.body.textContent = ""
	D.createRootScope(()=>{
		D.addPortal(document.body, ()=>{
			navbar("Vocabulator"
			,[
				{
					name:"Reader"
					,inner:mainPage
				}
				,{
					name:"Edit"
					,inner:editPage
				}
				,{
					name:"Help"
					,inner:helpPage
				}
				,{
					name:"About"
					,inner:aboutPage
				}
			])

			//@ts-ignore
			if (window.STANDALONE) {
				const versionPopupDismissed = $(false)
				D.addIf(()=>
					latestVersion() !== ""
					&& latestVersion() !== "vDEVELOPMENT" //vDEVELOPMENT will be replaced in final build with actual build version
					&& !versionPopupDismissed()
				, ()=>{
					div({class:"position-fixed bottom-0 end-0 p-3"}, ()=>{
						div({class:"toast show"}, ()=>{
							div({class:"toast-header"}, ()=>{
								strong({class:"me-auto"}, "New Version Available!")
								button({class:"btn-close", onclick:()=>{
									versionPopupDismissed(true)
								}})
							})
							div({class:"toast-body"}, ()=>{
								$text(()=>`Greek Vocabulator ${latestVersion()} has been released! You are currently using vDEVELOPMENT. Go to `)
								a({href:"https://ambrosecavalier.com/projects/greek-vocabulator/Vocabulator.zip"}, "https://ambrosecavalier.com/projects/greek-vocabulator/Vocabulator.zip")
								$text(" to download the latest version.")
							})
						})
					})
				})
			} else {
				const offlinePopupDismissed = $(false)
				D.addIf(()=>
					!offlinePopupDismissed()
				, ()=>{
					div({class:"position-fixed bottom-0 end-0 p-3"}, ()=>{
						div({class:"toast show", style:"background-color: white;"}, ()=>{
							div({class:"toast-header", style:"background-color: white;"}, ()=>{
								strong({class:"me-auto"}, "Offline Version")
								button({class:"btn-close", onclick:()=>{
									offlinePopupDismissed(true)
								}})
							})
							div({class:"toast-body"}, ()=>{
								$text(()=>`Want to use Greek Vocabulator without an internet connection? Download the offline version from `)
								a({href:"https://ambrosecavalier.com/projects/greek-vocabulator/Vocabulator.zip"}, "https://ambrosecavalier.com/projects/greek-vocabulator/Vocabulator.zip")
								$text(" and save it on your computer.")
							})
						})
					})
				})
			}
		})
	})
}
app()
