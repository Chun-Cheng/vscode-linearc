// The module "vscode" contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// import { showIssue } from "./issue_viewer";
import { linear } from "./linear";
import { IssuesProvider } from "./issues_provider";
import { IssueViewer } from './issue_viewer';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // views
  const issuesProvider = new IssuesProvider();
  let issuesView = vscode.window.createTreeView("linear-issues", {
    treeDataProvider: issuesProvider,
  });

  // commands
  const helloWorld = vscode.commands.registerCommand("linearc.hello-world", () => {
    vscode.window.showInformationMessage("Hello World from Linear Sidebar!");
  });
  context.subscriptions.push(helloWorld);

  const connect = vscode.commands.registerCommand("linearc.connect", async () => {
    await linear.connect();
    issuesProvider.refresh();
  });
  context.subscriptions.push(connect);

  const refreshIssues = vscode.commands.registerCommand("linearc.refresh-issues", () => {
    issuesProvider.refresh();
  });
  context.subscriptions.push(refreshIssues);

  // open organization in Linear
  const openOrganizationInLinearFunction = async () => {
    const organization = await linear.getOrganization();
    if (organization === null) {
      return vscode.window.showErrorMessage("Failed to get organization data.");
    }
    vscode.env.openExternal(vscode.Uri.parse(`https://linear.app/${organization.urlKey}`));
  };
  const hideOpenOrganizationInLinear = vscode.commands.registerCommand("linearc.hide-open-organization-in-linear", openOrganizationInLinearFunction);
  context.subscriptions.push(hideOpenOrganizationInLinear);
  const openOrganizationInLinear = vscode.commands.registerCommand("linearc.open-organization-in-linear", openOrganizationInLinearFunction);
  context.subscriptions.push(openOrganizationInLinear);

  const debug = vscode.commands.registerCommand("linearc.debug", async () => {
    const debug_data = await linear.getPriorityValues();
    vscode.window.showInformationMessage(`${JSON.stringify(debug_data, null, 4)}`);
  });
  context.subscriptions.push(debug);

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
  // let currentPanel: vscode.WebviewPanel | undefined = context.workspaceState.get('currentPanel');
  // context.subscriptions.push(
  //   vscode.commands.registerCommand("linearc.show-issue", async (issueIdentifier: string | undefined) => {
  //     currentPanel = await showIssue(issueIdentifier, context, currentPanel);
  //     context.workspaceState.update('currentPanel', currentPanel);
  //   })
  // );

  let showIssueCommand = vscode.commands.registerCommand('linearc.show-issue', (issueId) => {
    IssueViewer.show(context, issueId);
  });
  context.subscriptions.push(showIssueCommand);

  // other initialization
  // prompt the user to connect to Linear => run right after installation completed
  linear.connect();
}

// This method is called when your extension is deactivated
export function deactivate() {}
