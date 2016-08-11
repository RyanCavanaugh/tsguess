import guess = require('../lib');

(function() {
	"use strict";

	let css = `position: fixed;
	left: 10%;
	top: 10%;
	bottom: 10%;
	right: 10%;
	border: solid black 2px;
	z-index: 100000;
	background-color: #AAAAAA;`;

	let displayWindow = document.createElement('div');
	displayWindow.setAttribute('id', 'tsguess-window');
	displayWindow.setAttribute('style', css);
	displayWindow.innerHTML = `
		<div>tsguess Browser Type Guesser</div>
		<div style="font-family: monospace">
		  <input type="text" length="40" id="tsguess-input" placeholder="Enter any JavaScript identifier or expression" />
		  <input type="submit" value="Generate" id="tsguess-generate" />
		</div>
		<textarea id="tsguess-output" style="font-family: monospace" rows="30" cols="80" placeholder="Generated .d.ts content will appear here" />
	`;
	window.setTimeout(() => {
		const button = document.getElementById('tsguess-generate') as HTMLInputElement;
		const input = document.getElementById('tsguess-input') as HTMLInputElement;
		const output = document.getElementById('tsguess-output') as HTMLTextAreaElement;
		button.addEventListener("click", () => {
			output.value = guess.generateIdentifierDeclarationFile(input.value, eval(input.value));
		});
	}, 10);
	
	document.body.appendChild(displayWindow);
})();
