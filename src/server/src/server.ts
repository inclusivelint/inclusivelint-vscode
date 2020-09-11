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

function createDiagnostic(textDocument: TextDocument, textWord: string): Diagnostic {
	let text = textDocument.getText();
	return {
		severity: DiagnosticSeverity.Warning,
		range: {
			start: textDocument.positionAt(text.indexOf(textWord)),
			end: textDocument.positionAt(text.indexOf(textWord) + textWord.length)
		},
		message: `${textWord} is not inclusive. Consider using ${replacementsMap.get(textWord)}`,
		source: 'inclusivelint'
	};
}

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	let text = textDocument.getText();
	let diagnostics: Diagnostic[] = [];
	let splitedText: Array<string> = text.split(" ");
	
	for (let textWord of splitedText) {
		if (replacementsMap.has(textWord.toLowerCase())) {
			diagnostics.push(createDiagnostic(textDocument, textWord));
		}
	}
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

documents.listen(connection);
connection.listen();