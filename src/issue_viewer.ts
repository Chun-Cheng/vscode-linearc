import * as vscode from 'vscode';
import { marked } from 'marked';
import { Issue } from '@linear/sdk';

import { linear } from './linear';


export async function showIssue(issueIdentifier: string | undefined, context: vscode.ExtensionContext, currentPanel: vscode.WebviewPanel | undefined) {
  if (issueIdentifier === undefined) {
    // prompt the user to enter the issue identifier
    issueIdentifier = await vscode.window.showInputBox({
      placeHolder: 'LIN-12',
      prompt: 'Enter the issue identifier to show'
    });

    if (!issueIdentifier) {
      vscode.window.showErrorMessage('No issue identifier provided.');
      return;
    }
  }

  const columnToShowIn = vscode.window.activeTextEditor
    ? vscode.window.activeTextEditor.viewColumn
    : undefined;

  if (currentPanel) {
    // If we already have a panel, show it in the target column
    currentPanel.reveal(columnToShowIn);

    if (currentPanel.title !== issueIdentifier) { // if the original panel is showing other issue
      // update the content
      currentPanel.title = issueIdentifier;
      currentPanel.webview.html = getLoadingWebviewContent();  // loading screen
      currentPanel.webview.html = await getIssueWebviewContent(issueIdentifier, currentPanel.webview, context.extensionUri);
    }

  } else {
    // Otherwise, create a new panel
    currentPanel = vscode.window.createWebviewPanel(
      'issue', // Identifies the type of the webview. Used internally
      issueIdentifier, // Title of the panel displayed to the user
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
    currentPanel.webview.html = await getIssueWebviewContent(issueIdentifier, currentPanel.webview, context.extensionUri);

    // Reset when the current panel is closed
    currentPanel.onDidDispose(
      () => {
        currentPanel = undefined;
      },
      null,
      context.subscriptions
    );
  }
};

/**
 * return loading screen HTML
 */
function getLoadingWebviewContent() {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none';">
    </head>
    <body>
      <p><i>Loading...</i></p>
    </body>
    </html>`;
}

async function getIssueWebviewContent(issueIdentifier: string, webview: vscode.Webview, extensionUri: vscode.Uri) {
  // Get path to resource on disk
  const mediaPath = vscode.Uri.joinPath(extensionUri, 'media');

  // TODO: get issue data (title, description, status, priority, assignee, estimate, project, milestone, labels, comments, reactions, etc.)
  const issue: Issue | undefined | null = await linear.getIssueByIdentifier(issueIdentifier);

  if (issue === null) {
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none';">
        <title>${issueIdentifier}</title>
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
        <meta http-equiv="Content-Security-Policy" content="default-src 'none';">
        <title>${issueIdentifier}</title>
      </head>
      <body>
        <h1>Issue Not Found</h1>
        <p>Issue <strong>${issueIdentifier}</strong> not found.</p>
      </body>
      </html>`;
  }

  // status
  const issueState = await issue.state;
  let statusName: string = issueState ? issueState.name : "Unknown";
  let statusIconSrc: { light: vscode.Uri, dark: vscode.Uri};
  if (!issueState) {
    statusIconSrc = {
      light: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'light', 'status_canceled.svg')),
      dark: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dark', 'status_canceled.svg'))
    };  // unknown
  } else if (issueState.type === "triage") {
    statusIconSrc = {
      light: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'light', 'status_triage.svg')),
      dark: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dark', 'status_triage.svg'))
    };
  } else if (issueState.type === "backlog") {
    statusIconSrc = {
      light: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'light', 'status_backlog.svg')),
      dark: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dark', 'status_backlog.svg'))
    };
  } else if (issueState.type === "unstarted") {
    statusIconSrc = {
      light: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'light', 'status_todo.svg')),
      dark: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dark', 'status_todo.svg'))
    };
  } else if (issueState.type === "started" && issueState.name === "In Progress") {
    statusIconSrc = {
      light: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'light', 'status_in_progress.svg')),
      dark: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dark', 'status_in_progress.svg'))
    };
  } else if (issueState.type === "started" && issueState.name === "In Review") {
    statusIconSrc = {
      light: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'light', 'status_in_review.svg')),
      dark: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dark', 'status_in_review.svg'))
    };
  } else if (issueState.type === "completed") {
    statusIconSrc = {
      light: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'light', 'status_done.svg')),
      dark: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dark', 'status_done.svg'))
    };
  } else if (issueState.type === "canceled") {
    statusIconSrc = {
      light: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'light', 'status_canceled.svg')),
      dark: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dark', 'status_canceled.svg'))
    };
  } else {
    statusIconSrc = {
      light: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'light', 'status_canceled.svg')),
      dark: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dark', 'status_canceled.svg'))
    };  // unknown
  }

  // priority
  const priorityId = issue.priority;
  let priorityName: string;
  let priorityIconSrc: { light: vscode.Uri, dark: vscode.Uri };
  switch (priorityId) {
    case 1:
      priorityName = "Urgent";
      priorityIconSrc = {
        light: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'light', 'priority_urgent.svg')),
        dark: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dark', 'priority_urgent.svg'))
      };
      break;
    case 2:
      priorityName = "High";
      priorityIconSrc = {
        light: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'light', 'priority_high.svg')),
        dark: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dark', 'priority_high.svg'))
      };
      break;
    case 3:
      priorityName = "Medium";
      priorityIconSrc = {
        light: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'light', 'priority_medium.svg')),
        dark: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dark', 'priority_medium.svg'))
      };
      break;
    case 4:
      priorityName = "Low";
      priorityIconSrc = {
        light: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'light', 'priority_low.svg')),
        dark: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dark', 'priority_low.svg'))
      };
      break;
    default:
      priorityName = "No Priority";
      priorityIconSrc = {
        light: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'light', 'priority_no.svg')),
        dark: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dark', 'priority_no.svg'))
      };
  }

  // assignee
  let assigneeName: string;
  let assigneeIconSrc: { light: vscode.Uri, dark: vscode.Uri };

  let assignee = await issue.assignee;
  if (assignee === undefined) {
    // no assignee
    assigneeName = "-";  // unassigned
    assigneeIconSrc = {
      light: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'light', 'assignee_no.svg')),
      dark: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dark', 'assignee_no.svg'))
    };
  } else {
    if (assignee === undefined) {  // not found
      assigneeName = "-";  // unassigned
      assigneeIconSrc = {
        light: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'light', 'assignee_no.svg')),
        dark: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dark', 'assignee_no.svg'))
      };
    } else {  // found successfully
      assigneeName = assignee.name;
      assigneeIconSrc = assignee.avatarUrl !== undefined
        ? {
          light: webview.asWebviewUri(vscode.Uri.parse(assignee.avatarUrl)),
          dark: webview.asWebviewUri(vscode.Uri.parse(assignee.avatarUrl))
        }
        : {
          light: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'light', 'assignee_yes.svg')),
          dark: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dark', 'assignee_yes.svg'))
        };; // default icon // TODO: change to user name icon?
    }
  }

  // estimate
  const estimate = issue.estimate;
  const estimateIconSrc = {
    light: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'light', 'estimate.svg')),
    dark: webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dark', 'estimate.svg'))
  };
  
  // labels
  const labelsConnection = await issue.labels();  // TODO: implement this
  const labels = labelsConnection.nodes;
  
  

  

  // return page content
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="
        default-src 'none';
        img-src ${webview.cspSource} https:;
        script-src ${webview.cspSource};
        style-src ${webview.cspSource} 'unsafe-inline';
      ">
      <title>${issue.identifier}</title>
    </head>
    <body>
      <h1>${
        issue["title"]
          ? marked.parse(issue.title)
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
            border: 1px solid var(--vscode-chat-requestBorder);
            background-color: var(--vscode-chat-requestBackground);
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
              <img data-theme="light" style="
                display: inherit;
                width: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
                height: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
              " src="${statusIconSrc.light}">
              <img data-theme="dark" style="
                display: none;
                width: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
                height: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
              " src="${statusIconSrc.dark}">
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
            border: 1px solid var(--vscode-chat-requestBorder);
            background-color: var(--vscode-chat-requestBackground);
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
              <img data-theme="light" style="
                display: inherit;
                width: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
                height: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
              " src="${priorityIconSrc.light}">
              <img data-theme="dark" style="
                display: none;
                width: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
                height: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
              " src="${priorityIconSrc.dark}">
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
            border: 1px solid var(--vscode-chat-requestBorder);
            background-color: var(--vscode-chat-requestBackground);
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
              <img data-theme="light" style="
                display: inherit;
                width: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
                height: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
                border-radius: 50%;
              " src="${assigneeIconSrc.light}">
              <img data-theme="dark" style="
                display: none;
                width: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
                height: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
                border-radius: 50%;
              " src="${assigneeIconSrc.dark}">
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
            border: 1px solid var(--vscode-chat-requestBorder);
            background-color: var(--vscode-chat-requestBackground);
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
              <img data-theme="light" style="
                display: inherit;
                width: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
                height: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
              " src="${estimateIconSrc.light}">
              <img data-theme="dark" style="
                display: none;
                width: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
                height: ${vscode.workspace.getConfiguration().get('editor.fontSize')}px;
              " src="${estimateIconSrc.dark}">
            </span>
            <span style="
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              line-height: normal;
            ">${estimate ? estimate : "-"}</span>
          </div>
        </div>

        <!-- labels -->
        ${ 
          labels.reduce((accumulator, label) => {
            return accumulator + `
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
                  border: 1px solid var(--vscode-chat-requestBorder);
                  background-color: var(--vscode-chat-requestBackground);
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
                    <div style="
                      width: 9px;
                      height: 9px;
                      border-radius: 50%;
                      background-color: ${label.color};
                    "></div>
                  </span>
                  <span style="
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    line-height: normal;
                  ">${label.name}</span>
                </div>
              </div>
            `;
          }, "")
        }

        <!-- cycle -->


      </div>
      <hr style="
        border-color: var(--vscode-widget-border);
        border-width: 1px 0 0;
      ">
      <div>
        ${
          issue["description"]
            ? marked.parse(issue.description)
            : "" // no description
        }
      </div>
    </body>
    </html>`;
};
