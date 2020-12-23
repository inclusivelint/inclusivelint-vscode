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
import { InclusiveDiagnostic, scan } from 'inclusivelint';

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

function createDiagnostic(textDocument: TextDocument, warning: InclusiveDiagnostic): Diagnostic {
	return {
		severity: DiagnosticSeverity.Warning,
		range: {
			start: textDocument.positionAt(warning.termStartIndex),
			end: textDocument.positionAt(warning.termEndIndex)
		},
		message: `${warning.term} is not inclusive. Consider using ${warning.suggestedTerms}`,
		source: 'inclusivelint'
	};
}

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	let text = textDocument.getText();
	let diagnostics: Diagnostic[] = [];

	let listOfWarnings: InclusiveDiagnostic[] = await scan(text);
	for (let warning of listOfWarnings) {
		var diagnostic = createDiagnostic(textDocument, warning)
		diagnostics.push(diagnostic)
	}

	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

documents.listen(connection);
connection.listen();