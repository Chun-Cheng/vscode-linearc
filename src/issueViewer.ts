import * as vscode from 'vscode';

import { IssuePriority, IssueStatus, linear } from './linear';

export function activate(context: vscode.ExtensionContext) {
  // Track the current panel with a webview
  let currentPanel: vscode.WebviewPanel | undefined = undefined;

  context.subscriptions.push(
    vscode.commands.registerCommand('linear-sidebar.show-issue', async (issue_id: string) => {  // TODO: remove async?
      const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;

      if (currentPanel) {
        // If we already have a panel, show it in the target column
        currentPanel.reveal(columnToShowIn);

        if (currentPanel.title !== issue_id) { // if the original panel is showing other issue
          // update the content
          currentPanel.title = issue_id;
          currentPanel.webview.html = await getWebviewContent(issue_id);
        }

      } else {
        // Otherwise, create a new panel
        currentPanel = vscode.window.createWebviewPanel(
          'issue', // Identifies the type of the webview. Used internally
          issue_id, // Title of the panel displayed to the user
          columnToShowIn || vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
          {} // Webview options.
        );
        currentPanel.webview.html = await getWebviewContent(issue_id);

        // Reset when the current panel is closed
        currentPanel.onDidDispose(
          () => {
            currentPanel = undefined;
          },
          null,
          context.subscriptions
        );

        // TODO: remove debug messages
        // const datas = await linear.getIssues();
        // if (datas) {
        //   const data = datas[0];
        //   const team_id = data["_team"]["id"];
        //   const team = await linear.getTeam(team_id);
        //   vscode.window.showInformationMessage(`team:\n${JSON.stringify(team, null, 4)}`);
        //   const state_id = data["_state"]["id"];
        //   const state = await linear.getStatus(state_id);
        //   vscode.window.showInformationMessage(`state:\n${JSON.stringify(state, null, 4)}`);
        // }
      }
    })
  );

  return context;
};

async function getWebviewContent(issue_id: string) {
  // TODO: implement this function

  // TODO: get issue data (title, description, status, priority, assignee, estimate, project, milestone, labels, comments, reactions, etc.)
  const issue = await linear.getIssue(issue_id);

  if (issue === undefined) {
    // return 404 page
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${issue_id}</title>
      </head>
      <body>
          <h1>Issue Not Found</h1>
          <p>Issue <strong>${issue_id}</strong> not found.</p>
      </body>
      </html>`;
  }

  const statusEnum = await linear.getStatus(issue["_state"]["id"]);
  let status: string;
  switch (statusEnum) {
    case IssueStatus.Backlog:
      status = "Backlog";
      break;
    case IssueStatus.Todo:
      status = "Todo";
      break;
    case IssueStatus.InProgress:
      status = "In Progress";
      break;
    case IssueStatus.InReview:
      status = "In Review";
      break;
    case IssueStatus.Done:
      status = "Done";
      break;
    case IssueStatus.Canceled:
      status = "Canceled";
      break;
    case IssueStatus.Duplicate:
      status = "Duplicate";
      break;
    default:
      status = "Unknown";
  }
  
  // TODO: convert description from markdown to HTML

  // return page content
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${issue["identifier"]}</title>
    </head>
    <body>
        <h1>${issue["title"]}</h1>
        <p>${issue["description"]}</p>
        <p><b>priority: </b>${issue["priorityLabel"]}</p>
        <p><b>status: </b>${status}</p>
        <p><b>estimate: </b>${issue["estimate"]}</p>
    </body>
    </html>`;
};
