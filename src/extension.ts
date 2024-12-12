// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { showIssue } from './issue_viewer';
import { linear } from './linear';
import { IssuesProvider } from './issues_provider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // views
  const issuesProvider = new IssuesProvider();
  let issuesView = vscode.window.createTreeView('linear-issues', {
    treeDataProvider: issuesProvider,
  });

  // commands
  const helloWorld = vscode.commands.registerCommand('linearc.hello-world', () => {
    vscode.window.showInformationMessage('Hello World from Linear Sidebar!');
  });
  context.subscriptions.push(helloWorld);

  const connect = vscode.commands.registerCommand('linearc.connect', async () => {
    await linear.connect();
    issuesProvider.refresh();
  });
  context.subscriptions.push(connect);

  const refreshIssues = vscode.commands.registerCommand('linearc.refresh-issues', () => {
    issuesProvider.refresh();
  });
  context.subscriptions.push(refreshIssues);

  const debug = vscode.commands.registerCommand('linearc.debug', async () => {
    const debug_data = await linear.getPriorityValues();
    vscode.window.showInformationMessage(`${JSON.stringify(debug_data, null, 4)}`);
  });
  context.subscriptions.push(debug);

  // TODO: remove this command from here and package.json
  const showCategory = vscode.commands.registerCommand('linearc.show-category', async (category: string) => {
    issuesProvider.showTeamCategory(category);
  });
  context.subscriptions.push(showCategory);

  // when user settings is changed
  vscode.workspace.onDidChangeConfiguration(event => {
    // issue-item-icon setting changed => refresh the issues view
    let affected = event.affectsConfiguration("linearc.issue-item-icon");
    if (affected) {
        issuesProvider.refresh();
    }
  });

  // issue viewer

  // Track the current panel with a webview
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  context.subscriptions.push(
    vscode.commands.registerCommand('linearc.show-issue', async (issueIdentifier: string | undefined) => {
      await showIssue(issueIdentifier, context, currentPanel);
    })
  );

  // other initialization
  // prompt the user to connect to Linear => run right after installation completed
  linear.connect();
}

// This method is called when your extension is deactivated
export function deactivate() {}
