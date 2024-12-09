// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as issueViewer from './issueViewer';
import { linear } from './linear';
import { IssueItem } from './issueItem';
import { IssuesProvider } from './issuesProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // commands
  const helloWorld = vscode.commands.registerCommand('linear-sidebar.hello-world', () => {
    vscode.window.showInformationMessage('Hello World from Linear Sidebar!');
  });
  context.subscriptions.push(helloWorld);

  const connect = vscode.commands.registerCommand('linear-sidebar.connect', () => {
    linear.connect();
  });

  const refreshIssues = vscode.commands.registerCommand('linear-sidebar.refresh-issues', () => {
    issuesProvider.refresh();
    // vscode.window.showInformationMessage('Refreshing issues...');
  });

  // views

  const issuesProvider = new IssuesProvider();
  let issuesView = vscode.window.createTreeView('linear-issues', {
    treeDataProvider: issuesProvider,
  });

  // issue viewer
  context = issueViewer.activate(context);

  // other initialization
  // prompt the user to connect to Linear => run right after installation completed
  // linear.connect();
}

// This method is called when your extension is deactivated
export function deactivate() {}
