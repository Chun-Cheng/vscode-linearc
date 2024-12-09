import * as vscode from "vscode";
import { LinearClient } from "@linear/sdk";

class Linear {
  linearClient: LinearClient | undefined;

  constructor() {
    this.linearClient = undefined;
  }

  isConnected() {
    return this.linearClient !== undefined;
  }

  async connect() {
    const session = await vscode.authentication.getSession(
      "linear", // Linear VS Code authentication provider ID
      ["read"], // OAuth scopes we're requesting
      { createIfNone: true }
    );

    if (!session) {
      vscode.window.showErrorMessage(
        `Something went wrong, could not log you into Linear.`
      );
      return;
    }

    // OAuth2 authentication
    this.linearClient = new LinearClient({
      accessToken: session.accessToken,
    });

    // emit event to notify the issue provider to refresh the data
    vscode.commands.executeCommand("linear-sidebar.refresh-issues");
  }

  async getMyIssues() {
    // check if the user is connected to Linear
    if (this.linearClient === undefined) {
      // first chance: prompt the user to connect to Linear
      const selection = await vscode.window.showErrorMessage(`You need to connect to Linear first.`, 'Connect Linear');
      if (selection === 'Connect Linear') {
        this.connect();
      }

      // second chance: if the user still hasn't connected, return
      if (this.linearClient === undefined) {
        return;
      }
    }

    // get data
    const me = await this.linearClient.viewer;
    const myIssues = await me.assignedIssues();
  
    return myIssues;

    // if (myIssues.nodes.length) {
    //   myIssues.nodes.map(issue => console.log(`${me.displayName} has issue: ${issue.title}`));
    // } else {
    //   console.log(`${me.displayName} has no issues`);
    // }
  }

  async getIssues() {
    // check if the user is connected to Linear
    if (this.linearClient === undefined) {
      // first chance: prompt the user to connect to Linear
      const selection = await vscode.window.showErrorMessage(`You need to connect to Linear first.`, 'Connect Linear');
      if (selection === 'Connect Linear') {
        this.connect();
      }

      // second chance: if the user still hasn't connected, return
      if (this.linearClient === undefined) {
        return;
      }
    }

    // get data
    const issues = await this.linearClient.issues();
    // returned data format:
    // {
    //   "pageInfo": {
    //     "endCursor": "abcd1234-ab12-ab12-ab12-abcdef123456",
    //     "hasNextPage": bool,
    //     "hasPreviousPage": bool,
    //     "startCursor": "abcd1234-ab12-ab12-ab12-abcdef123456"
    //   },
    //   "nodes": [
    //     {
    //       "boardOrder": int,
    //       "branchName": "user/issue-branch-name",
    //       "createdAt": "2024-00-00T00:00:00.000Z",
    //       "customerTicketCount": int,
    //       "description": "markdown description contents",
    //       "estimate": int,  // optional
    //       "id": "abcd1234-ab12-ab12-ab12-abcdef123456",
    //       "identifier": "issue-id",
    //       labelIds": [
    //         "abcd1234-ab12-ab12-ab12-abcdef123456"
    //       ],
    //       "number": int,
    //       "previousIdentifiers": [],
    //       "priority": int,  // 0: No priority, 1: Urgent, 2: High, 3: Medium, 4: Low
    //       "priorityLabel": "Low",
    //       "reactionData": [],
    //       "slaType": "all",
    //       "sortOrder": number,
    //       "title": "issue title",
    //       "updatedAt": "2024-00-00T00:00:00.000Z",
    //       "url": "issue URL => to the Linear web app",
    //       "botActor": {  // optional
    //         "avatarUrl": "https://static.linear.app/assets/pwa/icon_maskable_512.png",
    //         "id": "5c07d33f-5e8f-484b-8100-67908589ec45",
    //         "name": "Linear",
    //         "type": "workflow"
    //       },
    //       "reactions": [],
    //       "_assignee": {  // optional
    //         "id": "abcd1234-ab12-ab12-ab12-abcdef123456"
    //       },
    //       "_creator": {  // optional
    //         "id": "abcd1234-ab12-ab12-ab12-abcdef123456"
    //       },
    //       "_state": {
    //         "id": "abcd1234-ab12-ab12-ab12-abcdef123456"
    //       },
    //       "_team": {
    //         "id": "abcd1234-ab12-ab12-ab12-abcdef123456"
    //       }
    //     }
    //   ]
    // }

  
    return issues["nodes"];
  }

}
 
export const linear = new Linear();
