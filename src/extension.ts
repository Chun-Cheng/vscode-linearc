// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as issueViewer from './issue_viewer';
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
  const helloWorld = vscode.commands.registerCommand('linear-sidebar.hello-world', () => {
    vscode.window.showInformationMessage('Hello World from Linear Sidebar!');
  });
  context.subscriptions.push(helloWorld);

  const connect = vscode.commands.registerCommand('linear-sidebar.connect', async () => {
    await linear.connect();
    issuesProvider.refresh();
  });
  context.subscriptions.push(connect);

  const refreshIssues = vscode.commands.registerCommand('linear-sidebar.refresh-issues', () => {
    issuesProvider.refresh();
    // vscode.window.showInformationMessage('Refreshing issues...');
  });
  context.subscriptions.push(refreshIssues);

  const debug = vscode.commands.registerCommand('linear-sidebar.debug', async () => {
    const debug_data = await linear.getWorkflowStates();
    vscode.window.showInformationMessage(`workflow states:\n${JSON.stringify(debug_data, null, 4)}`);
  });
  context.subscriptions.push(debug);

  // when user settings is changed
  vscode.workspace.onDidChangeConfiguration(event => {
    // issue-item-icon setting changed => refresh the issues view
    let affected = event.affectsConfiguration("linear-sidebar.issue-item-icon");
    if (affected) {
        issuesProvider.refresh();
    }
  });

  // issue viewer
  context = issueViewer.activate(context);

  // other initialization
  // prompt the user to connect to Linear => run right after installation completed
  linear.connect();
}

// This method is called when your extension is deactivated
export function deactivate() {}
