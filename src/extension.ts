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

    
    // debug messages: to check API response format
    // const user_data = await linear.getUser('01fea490-35cd-4d0b-975f-95dbf92d4d88');
    // vscode.window.showInformationMessage(JSON.stringify(user_data, null, 4));
  });

  const refreshIssues = vscode.commands.registerCommand('linear-sidebar.refresh-issues', () => {
    issuesProvider.refresh();
    // vscode.window.showInformationMessage('Refreshing issues...');
  });

  // issue viewer
  context = issueViewer.activate(context);

  // other initialization
  // prompt the user to connect to Linear => run right after installation completed
  linear.connect();
}

// This method is called when your extension is deactivated
export function deactivate() {}
