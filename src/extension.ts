import * as vscode from 'vscode';

var outputChannel: vscode.OutputChannel;
var lastOperation: string = "";

export function activate(context: vscode.ExtensionContext) {

	console.log('"Math Operations On All Numbers" is now active!');

	if (outputChannel === undefined){
		outputChannel = vscode.window.createOutputChannel("Math On All Numbers");
	}

	let selectionMathFunction = vscode.commands.registerCommand('math-on-all-numbers.mathOnAllNumbers', () => {
		newSelectionMathOperationFromuser();
	});

	let performLastOperationFunction = vscode.commands.registerCommand('math-on-all-numbers.performLastOperation', () => {
		selectionMath(lastOperation, true);
	});

	context.subscriptions.push(selectionMathFunction);
	context.subscriptions.push(performLastOperationFunction);
}

export function deactivate() {} 

export function newSelectionMathOperationFromuser() {
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		vscode.window.showInputBox({
		prompt: "Enter math operator for numbers in selection. e.g +1, -0.1, *2.2, /3, %4, ^5",

		}).then(operation => {
			if (operation){
				lastOperation = operation;
				selectionMath(operation, true);
			} 
		});
	}
}

export function selectionMath(operation:string, bLastOperation:boolean) {
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		if (operation !== ""){
			let mathOperator = operation.charAt(0);
			lastOperation = operation;
			//outputChannel.appendLine("selection math " + operation + " " + mathOperator);
			//outputChannel.show();
			let value = operation.substring(1);
			let decimals = getNumberofDecimalPlacesInNumberString(value);
			switch(mathOperator){
				case '+':
					doMathSelection(function(a:number, b:number) { return (a + b); }, Number(value), decimals);
					break;
				case '-':
					doMathSelection(function(a:number, b:number) { return (a - b); }, Number(value), decimals);
					break;
				case '*':
					doMathSelection(function(a:number, b:number) { return (a * b); }, Number(value), decimals);
					break;
				case '/':
					doMathSelection(function(a:number, b:number) { return (a / b); }, Number(value), decimals);
					break;
				case '%':
					doMathSelection(function(a:number, b:number) { return (a % b); }, Number(value), decimals);
					break;
				case '^':
					doMathSelection(function(a:number, b:number) { return (a ** b); }, Number(value), decimals);
					break;
				default:
					outputChannel.appendLine("operator " + mathOperator + " not recognized");
					outputChannel.show();
			}

		} else if (bLastOperation){
			outputChannel.appendLine("No selection math operations have been performed in this session yet.");
			outputChannel.show();
		} 
	} else {
		outputChannel.appendLine("No open file found.");
		outputChannel.show();
	}
} 

export function doMathSelection(expression:Function, value:number, valueDecimals:number){
	//outputChannel.appendLine("doMathSelection " + value);
	//outputChannel.show();

	const editor = vscode.window.activeTextEditor;
	if (editor){
		const document = editor.document;
		const selection = editor.selection; 
		// Get the word within the selection
		let selectedText = document.getText(selection); 
		let entireDocument = false;

		if (selectedText === "" || selectedText === undefined){
			selectedText = document.getText();
			entireDocument = true;
		}
		
		let lines = selectedText.split("\n");
		for (let i = 0; i < lines.length; i++){
			let iStart = getNextIndexOfNumberInString(lines[i]); 
			let iEnd = getNextIndexOfNonNumberInString(lines[i], iStart); 
			while (iStart !== -1){
				if (iEnd === -1){
					iEnd = lines[i].length;
				} 

				if (lines[i].charAt(iEnd) === "."){
					let nextiEnd = iEnd + 1; 
					if (nextiEnd < lines[i].length){
						if (isCharNumber(lines[i].charAt(nextiEnd))){
							iEnd = getNextIndexOfNonNumberInString(lines[i], nextiEnd); 
							if (iEnd === -1){
								iEnd = lines[i].length;
							}
						}
					}
				}

				let sNumber = lines[i].substring(iStart, iEnd); 
				let numberOfDecimals = getNumberofDecimalPlacesInNumberString(sNumber);

				if (valueDecimals > numberOfDecimals){
					numberOfDecimals = valueDecimals;
				}

				let iNumber = Number(sNumber);
				iNumber = expression(iNumber, value);
				let siNumber = iNumber.toFixed(numberOfDecimals);

				let sStart = lines[i].substring(0, iStart); 
				lines[i] = sStart + siNumber + lines[i].substring(iEnd); 
				iStart = getNextIndexOfNumberInString(lines[i], (iStart + siNumber.length)); 
				iEnd = getNextIndexOfNonNumberInString(lines[i], iStart);
			}
		}
		
		selectedText = lines.join("");

		if (entireDocument){
			editor.edit(builder => {
				builder.replace(new vscode.Range(document.lineAt(0).range.start, document.lineAt(document.lineCount - 1).range.end), selectedText);
			});
		} else {
			editor.edit(editBuilder => {
				editBuilder.replace(selection, selectedText);
			});
		}
	}
}

export function getNumberofDecimalPlacesInNumberString(s:string){
	let i = s.indexOf('.');
	if (i > -1){
		return ((s.length - i) - 1);
	}
	return 0;
}

export function getNextIndexOfNumberInString(s:string, startIndex:number = 0){
	let i = startIndex; 
	let m = s.length; 

	if (i >= m){
		return -1;
	}

	while (i < m){
		if (isCharNumber(s.charAt(i))){
			return i;
		}
		i++;
	}
	return -1;
} 

export function getNextIndexOfNonNumberInString(s:string, startIndex:number = 0){
	let i = startIndex; 
	let m = s.length; 

	if (i >= m){
		return -1;
	}

	while (i < m){
		if (!isCharNumber(s.charAt(i))){
			return i;
		}
		i++;
	}
	return -1;
} 

export function isCharNumber(c:string) {
	return c >= '0' && c <= '9';
} 