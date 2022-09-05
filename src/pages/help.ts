import * as D from "dynein"
import contentPageWrapper from "../components/contentPageWrapper.js"

export default function aboutPage() {
	contentPageWrapper(()=>{
		D.addHTML(`
		<h1 class="header">Help</h1>
		<p>The Vocabulator is a tool for reading Greek text. (There's also a <a href="https://ambrosecavalier.com/projects/vocabulator/about/" target="_blank">Latin version</a>.) To get started, can copy and paste some Greek text into the box.
		</p>
		<p>
		When you hover over a word, the Vocabulator will analyze it and show a parsing and definition.
		</p>
		<p>
		The other topics on this page cover how to work with other Greek texts, create printable vocabulary lists, and add your own entries to the dictionary.
		</p>
		<h1>1. Getting Text</h1>

		<p>There are lots of Greek texts online that can easily be copied and pasted into Vocabulator. The <a href="https://scaife.perseus.org/">Perseus Library</a> is an especially useful source.</p>

		<p>If you click on a word, it will “anchor” as the current word.</p>

		<h1>2. Creating a list of unknown vocabulary</h1>

		<p>The original purpose of the tool was to make it easier to create a personalized list of unknown vocabulary.</p>
		<ul><li>Every word starts on the “unknown” list.</li>
		<li>You can easily change a word from known to unknown and back by ctrl-clicking or right-clicking on the word, or by using the “Known” switch in the vocabulary area.</li>
		<li>Words that are known appear in the text in a light gray color.</li>
		<li>Vocabulator stores your personalized list on the computer you are using, and will use it for future texts.</li>
		</ul>

		<h1>3. Showing the Vocabulary List</h1>

		<p>You can list all the words in the passage that are unknown by switching the vocabulary display mode “Hover Only” to “For Print”.</p>
		<p>Clicking a Greek word in the list will highlight occurences in the passage. You can also ctrl-click or right-click on a Greek word in the list to add the source word to the known list.<p>
		<p>Clicking a word in the passage switches back to “Hover Only”.</p>

		<h1>4. Exporting the Vocabulary List</h1>
		<p>Pressing the “Print” button will open the browser print dialog. (Before you do this, you can set an informational header using the textbox, and set the font size and columns used.)</p>

		<h1>5. Adding custom notes</h1>

		<p>You can add notes and replace missing definitions with “Custom Results” box.</p>

		<h1>Other Problems</h1>

		<p>If you have any questions/comments/concerns/suggestions/bugs/etc. you can always shoot me an email at <a href="mailto:ambrose.cavalier@christendom.edu">ambrose.cavalier@christendom.edu</a>.</p>

		<p>Happy reading!</p>
		`)
	})
}
