import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	TextDocumentSyncKind,
	InitializeResult
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { replacementsMap } from './dictionary';

let connection = createConnection(ProposedFeatures.all);
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {
	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Full
		}
	};
	return result;
});

documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});

function createDiagnostic(textDocument: TextDocument, textWord: string, wordIndex: number): Diagnostic {
	let text = textDocument.getText();
	return {
		severity: DiagnosticSeverity.Warning,
		range: {
			start: textDocument.positionAt(wordIndex),
			end: textDocument.positionAt(wordIndex + textWord.length)
		},
		message: `${textWord} is not inclusive. Consider using ${replacementsMap.get(textWord)}`,
		source: 'inclusivelint'
	};
}

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	let text = textDocument.getText();
	let diagnostics: Diagnostic[] = [];
	var lastWordStartIndex = 0;
	
	let splitedText: Array<string> = splitTextIntoWords();
	
	for (let textWord of splitedText) {
		let wordStartIndexInText = text.indexOf(textWord, lastWordStartIndex);
		//add the length t position the index search after the last work start index.
		//It is import as the next word may be the same as the last one and
		//the indexOf will return the index of the first occurence only. 
		lastWordStartIndex = wordStartIndexInText + textWord.length;
		
		var lcTextWord = textWord.toLowerCase();

		if (replacementsMap.has(lcTextWord)) {
			diagnostics.push(createDiagnostic(textDocument, textWord, wordStartIndexInText));
		}
	}
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
	
	function splitTextIntoWords(): string[] {
		//replace all non word by space. Numbers are not replaced.
		return text.replace(/(\W*)\s/g, " ").split(" ");
	}
}

documents.listen(connection);
connection.listen();