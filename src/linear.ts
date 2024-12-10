import * as vscode from "vscode";
import { LinearClient } from "@linear/sdk";

export enum IssueStatus {
  Backlog,
  Todo,
  InProgress,
  InReview,
  Done,
  Canceled,
  Duplicate,
}

export enum IssuePriority {
  No_Priority,
  Urgent,
  High,
  Medium,
  Low,
}

class Linear {
  linearClient: LinearClient | undefined;

  constructor() {
    this.linearClient = undefined;
  }

  isConnected() {
    return this.linearClient !== undefined;
  }

  async connectCheckPrompt() {
    // check if the user is not connected to Linear
    if (this.isConnected() === false) {
      // prompt the user to connect to Linear
      const selection = await vscode.window.showErrorMessage(`You need to connect to Linear first.`, 'Connect Linear');
      if (selection === 'Connect Linear') {
        this.connect();
      }
      return false;
    }
    return true;
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
    if (await this.connectCheckPrompt() === false) {
      return;
    }

    // get data
    const me = await this.linearClient!.viewer;
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
    if (await this.connectCheckPrompt() === false) {
      return;
    }

    // get data
    const issues = await this.linearClient!.issues();
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

  async getIssue(issue_id: string) {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return;
    }

    // get data
    // TODO: optimize this by using the native Linear SDK method
    const issues = await this.linearClient!.issues();
    for (let i = 0; i < issues["nodes"].length; i++) {
      if (issues["nodes"][i]["identifier"] === issue_id) {
        return issues["nodes"][i];
      }
    }
    return undefined;
  }

  async getUser(user_id: string) {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return;
    }

    // get data
    const user = await this.linearClient!.user(user_id);
    // {
    //   "active": bool,
    //   "admin": bool,
    //   "avatarBackgroundColor": "#abc123",
    //   "avatarUrl": "URL to get user avatar",
    //   "createdAt": "2024-00-00T00:00:00.000Z",
    //   "createdIssueCount": 0,
    //   "displayName": "username",
    //   "email": "user email",
    //   "guest": bool,
    //   "id": "abcd1234-ab12-ab12-ab12-abcdef123456",
    //   "initials": "half user name (?)",
    //   "inviteHash": "abcdefgh12345678",
    //   "isMe": bool,
    //   "name": "user full name",
    //   "timezone": "Asia/Taipei",
    //   "updatedAt": "2024-00-00T00:00:00.000Z",
    //   "url": "URL to user profile in Linear web app"
    // }
    return user;
  }

  async getTeam(team_id: string) {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return;
    }

    // get data
    const team = await this.linearClient!.team(team_id);
    // {
    //   "autoArchivePeriod": 6,
    //   "autoClosePeriod": 6,
    //   "autoCloseStateId": "abcd1234-ab12-ab12-ab12-abcdef123456",
    //   "color": "#5d85ff",
    //   "createdAt": "abcd1234-ab12-ab12-ab12-abcdef123456",
    //   "cycleCalenderUrl": "URL to cycles.ics",
    //   "cycleCooldownTime": 0,
    //   "cycleDuration": 2,
    //   "cycleIssueAutoAssignCompleted": true,
    //   "cycleIssueAutoAssignStarted": true,
    //   "cycleLockToActive": false,
    //   "cycleStartDay": 1,
    //   "cyclesEnabled": false,
    //   "defaultIssueEstimate": 1,
    //   "groupIssueHistory": true,
    //   "icon": "Chat",
    //   "id": "abcd1234-ab12-ab12-ab12-abcdef123456",
    //   "inviteHash": "97216e5157034374",
    //   "issueCount": 10,
    //   "issueEstimationAllowZero": true,
    //   "issueEstimationExtended": false,
    //   "issueEstimationType": "exponential",
    //   "issueOrderingNoPriorityFirst": false,
    //   "issueSortOrderDefaultToBottom": false,
    //   "key": "MES",
    //   "name": "Message-exp",
    //   "private": false,
    //   "requirePriorityToLeaveTriage": false,
    //   "scimManaged": false,
    //   "setIssueSortOrderOnStateChange": "first",
    //   "slackIssueComments": true,
    //   "slackIssueStatuses": true,
    //   "slackNewIssue": true,
    //   "timezone": "Asia/Taipei",
    //   "triageEnabled": false,
    //   "upcomingCycleCount": 2,
    //   "updatedAt": "2024-00-00T00:00:00.000Z",
    //   "_defaultIssueState": {
    //     "id": "abcd1234-ab12-ab12-ab12-abcdef123456"
    //   },
    //   "_markedAsDuplicateWorkflowState": {
    //     "id": "abcd1234-ab12-ab12-ab12-abcdef123456"
    //   }
    // }
    
    return team;
  }

  async getStatus(state_id: string) {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return;
    }

    // get data
    const workflowState = await this.linearClient!.workflowState(state_id);
    // {
    //   "color": "#0f783c",
    //   "createdAt": "2024-00-00T00:00:00.000Z",
    //   "description": "Pull request is being reviewed",
    //   "id": "abcd1234-ab12-ab12-ab12-abcdef123456",
    //   "name": "In Review",
    //   "position": 1002,
    //   "type": "started",
    //   "updatedAt": "2024-00-00T00:00:00.000Z",
    //   "_team": {
    //     "id": "abcd1234-ab12-ab12-ab12-abcdef123456"
    //   }
    // }

    switch (workflowState["name"]) {
      case "Backlog":
        return IssueStatus.Backlog;
      case "Todo":
        return IssueStatus.Todo;
      case "In Progress":
        return IssueStatus.InProgress;
      case "In Review":
        return IssueStatus.InReview;
      case "Done":
        return IssueStatus.Done;
      case "Canceled":
        return IssueStatus.Canceled;
      case "Duplicate":
        return IssueStatus.Duplicate;
      default:
        return undefined;
    }
  }

  // async getLabel(label_id: string) {
  //   // check if the user is connected to Linear
  //   if (await this.connectCheckPrompt() === false) {
  //     return;
  //   }

  //   // get data
  //   const label = await this.linearClient!.issueLabel(label_id);
  //   // TODO: check the returned data format
  //   return label;
  // }

}
 
export const linear = new Linear();
