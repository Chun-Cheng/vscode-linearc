// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { linear } from './linear';
import { Issue } from './issueItem';
import { IssuesProvider } from './issuesProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // commands
  const helloWorld = vscode.commands.registerCommand('linear-sidebar.hello-world', () => {
    vscode.window.showInformationMessage('Hello World from Linear Sidebar!');
  });

  const connect = vscode.commands.registerCommand('linear-sidebar.connect', () => {
    linear.connect();
  });

  context.subscriptions.push(helloWorld);

  // views

  const issuesProvider = new IssuesProvider();
  let issuesView = vscode.window.createTreeView('linear-issues', {
    treeDataProvider: issuesProvider,
  });

  // other initialization
  // prompt the user to connect to Linear => run right after installation completed
  // linear.connect();
}

// This method is called when your extension is deactivated
export function deactivate() {}
