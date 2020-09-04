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
let badWords = ['master', 'slave'];

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

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	let text = textDocument.getText();
	let diagnostics: Diagnostic[] = [];
	let splitedText: Array<string> = text.split(" ");
	
	for (let word of badWords) {
		if (splitedText.indexOf(word) != -1) {
			let diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Warning,
				range: {
					start: textDocument.positionAt(text.indexOf(word)),
					end: textDocument.positionAt(text.indexOf(word) + word.length)
				},
				message: `${word} is not inclusive`,
				source: 'inclusivelint'
			};
			diagnostics.push(diagnostic);	
		}
	}
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

documents.listen(connection);
connection.listen();