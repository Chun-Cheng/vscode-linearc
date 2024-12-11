import * as vscode from "vscode";
import { LinearClient, Issue, Team, User, WorkflowState } from "@linear/sdk";

export enum IssuePriority {
  No_Priority,
  Urgent,
  High,
  Medium,
  Low,
}

class Linear {
  linearClient: LinearClient | null;
  me: User | null;

  constructor() {
    this.linearClient = null;
    this.me = null;
  }

  isConnected() : boolean {
    return (this.linearClient !== null && this.me !== null);
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
    this.me = await this.linearClient.viewer;

    // emit event to notify the issue provider to refresh the data
    vscode.commands.executeCommand("linear-sidebar.refresh-issues");
  }

  async getMyIssues() : Promise<Issue[] | null> {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return null;
    }

    // get data
    try {
      const myIssues = await this.me!.assignedIssues();
      return myIssues.nodes;
    } catch (error) {
      vscode.window.showErrorMessage("Failed to get data from Linear.");
    }
    return null;
  }

  async getMyTeams() : Promise<Team[] | null> {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return null;
    }

    // get data
    try {
      const myTeams = await this.me!.teams();
      return myTeams.nodes;
    } catch (error) {
      vscode.window.showErrorMessage("Failed to get data from Linear.");
    }
    return null;
  }

  async getIssueByIdentifier(identifier: string) {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return null;
    }

    // get data
    try {
      const issue = await this.linearClient!.issue(identifier);
      return issue || null;
    } catch (error) {
      vscode.window.showErrorMessage("Failed to get data from Linear.");
    }
    return null;
  }

  async getWorkflowStates() : Promise<WorkflowState[] | null> {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return null;
    }

    // get data
    try {
      const workflowStates = await this.linearClient!.workflowStates();
      return workflowStates.nodes;
    } catch (error) {
      vscode.window.showErrorMessage("Failed to get data from Linear.");
    }
    return null;
  };

  async getPriorityValues() {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return null;
    }

    // get data
    try {
      const priorityValues = await this.linearClient!.issuePriorityValues;
      return priorityValues;
    } catch (error) {
      vscode.window.showErrorMessage("Failed to get data from Linear.");
    }
    return null;
  };

  async getTeamMembers(team: Team) {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return null;
    }

    // get data
    try {
      const teamMembers = await team.members();
      return teamMembers.nodes;
    } catch (error) {
      vscode.window.showErrorMessage("Failed to get data from Linear.");
    }
    return null;
  };



  




  
  async getWorkflowStateById(id: string) {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return null;
    }

    // get data
    try {
      const workflowState = await this.linearClient!.workflowState(id);
      return workflowState;
    } catch (error) {
      vscode.window.showErrorMessage("Failed to get data from Linear.");
    }
    return null;
  };

  // async getStatus(state_id: string) {
  //   // check if the user is connected to Linear
  //   if (await this.connectCheckPrompt() === false) {
  //     return;
  //   }

  //   // get data
  //   const workflowState = await this.linearClient!.workflowState(state_id);
  //   // {
  //   //   "color": "#0f783c",
  //   //   "createdAt": "2024-00-00T00:00:00.000Z",
  //   //   "description": "Pull request is being reviewed",
  //   //   "id": "abcd1234-ab12-ab12-ab12-abcdef123456",
  //   //   "name": "In Review",
  //   //   "position": 1002,
  //   //   "type": "started",
  //   //   "updatedAt": "2024-00-00T00:00:00.000Z",
  //   //   "_team": {
  //   //     "id": "abcd1234-ab12-ab12-ab12-abcdef123456"
  //   //   }
  //   // }

  //   switch (workflowState["name"]) {
  //     case "Backlog":
  //       return IssueStatus.Backlog;
  //     case "Todo":
  //       return IssueStatus.Todo;
  //     case "In Progress":
  //       return IssueStatus.InProgress;
  //     case "In Review":
  //       return IssueStatus.InReview;
  //     case "Done":
  //       return IssueStatus.Done;
  //     case "Canceled":
  //       return IssueStatus.Canceled;
  //     case "Duplicate":
  //       return IssueStatus.Duplicate;
  //     default:
  //       return undefined;
  //   }
  // }







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

  
    return issues.nodes;
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
