const css = `
div#tsguess-window {
	position: fixed;
	left: 10%;
	top: 10%;
	bottom: 10%;
	right: 10%;
	border: solid black 2px;
	background-color: #AAAAAA;
}
`;

const head = document.head || document.getElementsByTagName('head')[0],
const style = document.createElement('style');
style.type = 'text/css';
style.appendChild(document.createTextNode(css));
console.log(style);

const displayWindow = document.createElement('div');
displayWindow.setAttribute('id', 'tsguess-window');
document.body.appendChild(displayWindow);


