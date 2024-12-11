import * as vscode from 'vscode';
import { marked } from 'marked';
import { Issue } from '@linear/sdk';

import { linear } from './linear';

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
          currentPanel.webview.html = getLoadingWebviewContent();  // loading screen
          currentPanel.webview.html = await getIssueWebviewContent(issue_id, currentPanel.webview, context.extensionUri);
        }

      } else {
        // Otherwise, create a new panel
        currentPanel = vscode.window.createWebviewPanel(
          'issue', // Identifies the type of the webview. Used internally
          issue_id, // Title of the panel displayed to the user
          columnToShowIn || vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
          {
            // And restrict the webview to only loading content from the extension's `media` directory.
            localResourceRoots: [
              vscode.Uri.joinPath(
                vscode.Uri.file(context.extensionPath), 'media'
              )
            ]
          } // Webview options.
        );
        currentPanel.webview.html = getLoadingWebviewContent();  // loading screen
        currentPanel.webview.html = await getIssueWebviewContent(issue_id, currentPanel.webview, context.extensionUri);

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

/**
 * return loading screen HTML
 */
function getLoadingWebviewContent() {
  return `<!DOCTYPE html>
    <html lang="en">
    <body>
        <p><i>Loading...</i></p>
    </body>
    </html>`;
}

async function getIssueWebviewContent(issue_id: string, webview: vscode.Webview, extensionUri: vscode.Uri) {
  // TODO: implement this function

  // Get path to resource on disk
  const mediaPath = vscode.Uri.joinPath(extensionUri, 'media');

  // TODO: get issue data (title, description, status, priority, assignee, estimate, project, milestone, labels, comments, reactions, etc.)
  let issue: Issue | undefined = undefined;
  try {
    issue = await linear.getIssueByIdentifier(issue_id) || undefined;
  } catch (e) {
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${issue_id}</title>
      </head>
      <body>
          <h1>Error</h1>
      </body>
      </html>`;
  }
  

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

  // status
  const issueState = await issue.state;
  let statusName: string = issueState ? issueState.name : "Unknown";
  let statusIconSrc: vscode.Uri;
  if (!issueState) {
    statusIconSrc = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'status_canceled.svg'));  // unknown
  } else if (issueState.type === "triage") {
    statusIconSrc = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'status_triage.svg'));
  } else if (issueState.type === "backlog") {
    statusIconSrc = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'status_backlog.svg'));
  } else if (issueState.type === "unstarted") {
    statusIconSrc = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'status_todo.svg'));
  } else if (issueState.type === "started" && issueState.name === "In Progress") {
    statusIconSrc = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'status_in_progress.svg'));
  } else if (issueState.type === "started" && issueState.name === "In Review") {
    statusIconSrc = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'status_in_review.svg'));
  } else if (issueState.type === "completed") {
    statusIconSrc = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'status_done.svg'));
  } else if (issueState.type === "canceled") {
    statusIconSrc = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'status_canceled.svg'));
  } else {
    statusIconSrc = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'status_canceled.svg'));  // unknown
  }

  // priority
  const priorityId = issue.priority;
  let priorityName: string;
  let priorityIconSrc: vscode.Uri;
  switch (priorityId) {
    case 1:
      priorityName = "Urgent";
      priorityIconSrc = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'priority_urgent.svg'));
      break;
    case 2:
      priorityName = "High";
      priorityIconSrc = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'priority_high.svg'));
      break;
    case 3:
      priorityName = "Medium";
      priorityIconSrc = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'priority_medium.svg'));
      break;
    case 4:
      priorityName = "Low";
      priorityIconSrc = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'priority_low.svg'));
      break;
    default:
      priorityName = "No Priority";
      priorityIconSrc = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'priority_no.svg'));
  }

  // assignee
  let assigneeName: string;
  let assigneeIconSrc: vscode.Uri;

  let assignee = await issue.assignee;
  if (assignee === undefined) {
    // no assignee
    assigneeName = "-";  // unassigned
    assigneeIconSrc = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'assignee_no.svg'));
  } else {
    if (assignee === undefined) {  // not found
      assigneeName = "-";  // unassigned
      assigneeIconSrc = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'assignee_no.svg'));
    } else {  // found successfully
      assigneeName = assignee["name"];
      assigneeIconSrc = assignee["avatarUrl"] !== undefined
        ? webview.asWebviewUri(vscode.Uri.parse(assignee["avatarUrl"]))
        : webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'assignee_yes.svg')); // default icon // TODO: change to user name icon?
    }
  }

  // estimate
  const estimate = issue.estimate;
  const estimateIconSrc = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'estimate.svg'));
  
  // labels
  const labels = await issue.labels();  // TODO: implement this
  
  

  

  // return page content
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${issue["identifier"]}</title>
    </head>
    <body>
        <h1>${
          issue["title"]
            ? marked.parse(issue["title"])
            : "" // no title
        }</h1>

        <div style="
          flex-wrap: wrap;
          display: flex;
          padding: 0;
          padding-bottom: 8px;
          align-items: center;
          gap: 6px;
        ">
          <!-- status -->
          <div data-menu-open="false" style="
            min-width: 32px;
            display: inline-flex;
            flex: initial;
            flex-direction: row;
          ">
            <div role="combobox" type="button" style="
              min-width: 32px;
              max-width: 100%;
              align-items: center;
              position: relative;
              display: inline-flex;
              vertical-align: top;
              border-radius: 5px;
              border: 1px solid lch(19 3.54 272);
              padding: 2px 8px;
            ">
              <span aria-hidden="true" style="
                margin-right: 4px;
                display: inline-flex;
                flex-grow: 0;
                flex-shrink: 0;
                align-items: center;
                justify-content: center;
              ">
                <img style="
                  width: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
                  height: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
                " src="${statusIconSrc}">
              </span>
              <span style="
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                line-height: normal;
              ">${statusName}</span>
            </div>
          </div>

          <!-- priority -->
          <div data-menu-open="false" style="
            min-width: 32px;
            display: inline-flex;
            flex: initial;
            flex-direction: row;
          ">
            <div role="combobox" type="button" style="
              min-width: 32px;
              max-width: 100%;
              align-items: center;
              position: relative;
              display: inline-flex;
              vertical-align: top;
              border-radius: 5px;
              border: 1px solid lch(19 3.54 272);
              padding: 2px 8px;
            ">
              <span aria-hidden="true" style="
                margin-right: 4px;
                display: inline-flex;
                flex-grow: 0;
                flex-shrink: 0;
                align-items: center;
                justify-content: center;
              ">
                <img style="
                  width: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
                  height: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
                " src="${priorityIconSrc}">
              </span>
              <span style="
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                line-height: normal;
              ">${priorityName}</span>
            </div>
          </div>

          <!-- assignee -->
          <div data-menu-open="false" style="
            min-width: 14px;
            display: inline-flex;
            flex: initial;
            flex-direction: row;
          ">
            <div role="combobox" type="button" style="
              min-width: 14px;
              max-width: 100%;
              align-items: center;
              position: relative;
              display: inline-flex;
              vertical-align: top;
              border-radius: 5px;
              border: 1px solid lch(19 3.54 272);
              padding: 2px 8px;
            ">
              <span aria-hidden="true" style="
                margin-right: 4px;
                display: inline-flex;
                flex-grow: 0;
                flex-shrink: 0;
                align-items: center;
                justify-content: center;
              ">
                <img style="
                  width: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
                  height: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
                  border-radius: 50%;
                " src="${assigneeIconSrc}">
              </span>
              <span style="
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                line-height: normal;
              ">${assigneeName}</span>
            </div>
          </div>

          <!-- project -->

          <!-- milestone -->

          <!-- estimate -->
          <div data-menu-open="false" style="
            min-width: 14px;
            display: inline-flex;
            flex: initial;
            flex-direction: row;
          ">
            <div role="combobox" type="button" style="
              min-width: 14px;
              max-width: 100%;
              align-items: center;
              position: relative;
              display: inline-flex;
              vertical-align: top;
              border-radius: 5px;
              border: 1px solid lch(19 3.54 272);
              padding: 2px 8px;
            ">
              <span aria-hidden="true" style="
                margin-right: 4px;
                display: inline-flex;
                flex-grow: 0;
                flex-shrink: 0;
                align-items: center;
                justify-content: center;
              ">
                <img style="
                  width: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
                  height: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
                " src="${estimateIconSrc}">
              </span>
              <span style="
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                line-height: normal;
              ">${estimate === null ? "-" : estimate}</span>
            </div>
          </div>

          <!-- labels -->

          <!-- cycle -->


        </div>
        <hr>
        <div>
          ${
            issue["description"]
              ? marked.parse(issue["description"])
              : "" // no description
          }
        </div>
    </body>
    </html>`;
};
