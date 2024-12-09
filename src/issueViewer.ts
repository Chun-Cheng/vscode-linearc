import * as vscode from 'vscode';

import { linear } from './linear';

export function activate(context: vscode.ExtensionContext) {
  // Track the current panel with a webview
  let currentPanel: vscode.WebviewPanel | undefined = undefined;

  context.subscriptions.push(
    vscode.commands.registerCommand('linear-sidebar.show-issue', (issue_id: string) => {
      const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;

      if (currentPanel) {
        // If we already have a panel, show it in the target column
        currentPanel.reveal(columnToShowIn);

        if (currentPanel.title !== issue_id) { // if the original panel is showing other issue
          // update the content
          currentPanel.title = issue_id;
          currentPanel.webview.html = getWebviewContent(issue_id);
        }

      } else {
        // Otherwise, create a new panel
        currentPanel = vscode.window.createWebviewPanel(
          'issue', // Identifies the type of the webview. Used internally
          issue_id, // Title of the panel displayed to the user
          columnToShowIn || vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
          {} // Webview options.
        );
        currentPanel.webview.html = getWebviewContent(issue_id);

        // Reset when the current panel is closed
        currentPanel.onDidDispose(
          () => {
            currentPanel = undefined;
          },
          null,
          context.subscriptions
        );
      }
    })
  );

  return context;
};

function getWebviewContent(issue_id: string) {
  // TODO: implement this function
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cat Coding</title>
    </head>
    <body>
        <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
    </body>
    </html>`;
};
