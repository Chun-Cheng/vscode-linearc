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
    try {
      this.linearClient = new LinearClient({
        accessToken: session.accessToken,
      });
      this.me = await this.linearClient.viewer;
    } catch (error) {
      let selection = await vscode.window.showErrorMessage("Failed to connect to Linear. Please log out you Linear account and try again.", "Reconnect");
      if (selection === "Reconnect") {
        await vscode.commands.executeCommand("linear-connect.logout");  // log out all linear accounts
        this.connect(); // reconnect
      }
      return;
    }

    // emit event to notify the issue provider to refresh the data
    vscode.commands.executeCommand("lineboard.refresh-issues");
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
      // TODO: remove all these error notification in linear.ts. These error messages to user should be handled at the caller side.
      vscode.window.showErrorMessage("Failed to get data from Linear. (linear.getMyIssues)");
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
      vscode.window.showErrorMessage("Failed to get data from Linear. (linear.getMyTeams)");
    }
    return null;
  }

  async getIssuesByTeam() : Promise<{ [teamId: string]: Issue[] } | null> {
    if (await this.connectCheckPrompt() === false) {
      return null;
    }

    try {
      // TODO: try to achieve this by using native SDK functions
      const issues = await this.linearClient!.issues();
      const issuesByTeam: { [teamId: string]: Issue[] } = {};

      for (const issue of issues.nodes) {
        const team = await issue.team;
        if (!team) {
          continue;
        }
        const teamId = team.id;
        if (!issuesByTeam[teamId]) {
          issuesByTeam[teamId] = [];
        }
        issuesByTeam[teamId].push(issue);
      }

      return issuesByTeam;
    } catch (error) {
      vscode.window.showErrorMessage("Failed to get data from Linear. (linear.getIssuesByTeam)");
    }
    return null;
  }

  async getMyIssuesByTeams() : Promise<{ [teamId: string]: Issue[] } | null> {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return null;
    }

    // get data
    try {
      // TODO: try to achieve this by using native SDK functions
      const myIssuesConnection = await this.me!.assignedIssues();
      const myIssues = myIssuesConnection.nodes;
      const issuesByTeam: { [teamId: string]: Issue[] } = {};

      for (const issue of myIssues) {
        const team = await issue.team;
        if (!team) {
          continue;
        }
        const teamId = team.id;
        if (!issuesByTeam[teamId]) {
          issuesByTeam[teamId] = [];
        }
        issuesByTeam[teamId].push(issue);
      }

      return issuesByTeam;

    } catch (error) {
      vscode.window.showErrorMessage("Failed to get data from Linear. (linear.getMyIssuesByTeams)");
    }
    return null;
  }

  async getActiveIssuesByTeams() : Promise<{ [teamId: string]: Issue[] } | null> {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return null;
    }

    // get data
    try {
      // TODO: try to achieve this by using native SDK functions
      const issues = await this.linearClient!.issues();
      const activeIssuesInTeam: { [teamId: string]: Issue[] } = {};

      for (const issue of issues.nodes) {
        // team
        const team = await issue.team;
        if (!team) {
          continue;
        }
        const issueTeamId = team.id;
        // workflow state
        const issueState = await issue.state;
        if (!issueState) {
          continue;
        }
        if (!activeIssuesInTeam[issueTeamId]) {
          activeIssuesInTeam[issueTeamId] = [];
        }
        if (issueState.type === "unstarted" || issueState.type === "started") {
          activeIssuesInTeam[issueTeamId].push(issue);
        }
      }

      return activeIssuesInTeam;
      
    } catch (error) {
      vscode.window.showErrorMessage("Failed to get data from Linear. (linear.getActiveIssuesByTeams)");
    }
    return null;
  }

  async getIssueByIdentifier(identifier: string) : Promise<Issue | null> {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return null;
    }

    // get data
    try {
      const issue = await this.linearClient!.issue(identifier);
      return issue || null;
    } catch (error) {
      vscode.window.showErrorMessage("Failed to get data from Linear. (linear.getIssueByIdentifier)");
    }
    return null;
  }

  async getIssueById(id: string) : Promise<Issue | null> {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return null;
    }

    // get data
    try {
      const issue = await this.linearClient!.issue(id);
      return issue || null;
    } catch (error) {
      vscode.window.showErrorMessage("Failed to get data from Linear. (linear.getIssueById)");
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
      vscode.window.showErrorMessage("Failed to get data from Linear. (linear.getWorkflowStates)");
    }
    return null;
  };

  // useless
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
      vscode.window.showErrorMessage("Failed to get data from Linear. (linear.getPriorityValues)");
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
      vscode.window.showErrorMessage("Failed to get data from Linear. (linear.getTeamMembers)");
    }
    return null;
  };

  async getIssues() {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return;
    }

    // get data
    try {
      const issues = await this.linearClient!.issues();
      return issues.nodes;
    } catch (error) {
      vscode.window.showErrorMessage("Failed to get data from Linear. (linear.getIssues)");
    }
    return null;
  }

  async getUser(user_id: string) {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return;
    }

    // get data
    try {
      const user = await this.linearClient!.user(user_id);
      return user;
    } catch (error) {
      vscode.window.showErrorMessage("Failed to get data from Linear. (linear.getUser)");
    }
    return null;
  }

  async getTeam(team_id: string) {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return;
    }

    // get data
    try {
      const team = await this.linearClient!.team(team_id);
      return team;
    } catch (error) {
      vscode.window.showErrorMessage("Failed to get data from Linear. (linear.getTeam)");
    }
    return null;
  }

}
 
export const linear = new Linear();
