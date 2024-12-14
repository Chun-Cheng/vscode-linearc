import * as vscode from "vscode";
import { LinearClient, Issue, Team, User, WorkflowState, Organization } from "@linear/sdk";

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
      const selection = await vscode.window.showErrorMessage(`You need to connect to Linear first.`, "Connect Linear");
      if (selection === "Connect Linear") {
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
    vscode.commands.executeCommand("linearc.refresh-issues");
  }

  async getOrganization() : Promise<Organization | null> {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return null;
    }

    // get data
    try {
      const organization = await this.linearClient!.organization;
      return organization;
    } catch (error) {
      vscode.window.showErrorMessage("Failed to get data from Linear. (linear.getOrganization)");
    }
    return null;
  }

  // useless
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

  async getTeamIssuesById(teamId: string) : Promise<Issue[] | null> {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return null;
    }

    // get data
    try {
      const issues = await this.linearClient!.issues({ 
        filter: {
          team: { id: { eq: teamId }}
        }  // TODO: sort
      });
      return issues.nodes;
    } catch (error) {
      vscode.window.showErrorMessage("Failed to get data from Linear. (linear.getTeamIssuesById)");
    }
    return null;
  }

  async getMyTeamIssuesById(teamId: string) : Promise<Issue[] | null> {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return null;
    }

    // get data
    try {
      const issues = await this.linearClient!.issues({ 
        filter: {
          team: { id: { eq: teamId }},
          assignee: { isMe: { eq: true }}
        }  // TODO: sort
      });
      return issues.nodes;
    } catch (error) {
      vscode.window.showErrorMessage("Failed to get data from Linear. (linear.getMyTeamIssuesById)");
    }
    return null;
  }

  async getTeamActiveIssuesById(teamId: string) : Promise<Issue[] | null> {
    // check if the user is connected to Linear
    if (await this.connectCheckPrompt() === false) {
      return null;
    }

    // get data
    try {
      const issues = await this.linearClient!.issues({ 
        filter: {
          team: { id: { eq: teamId }},
          state: { type: { in: ["unstarted", "started"] } }
        }  // TODO: sort
      });
      return issues.nodes;
    } catch (error) {
      vscode.window.showErrorMessage("Failed to get data from Linear. (linear.getTeamActiveIssuesById)");
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

  // useless
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

  // useless
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

  // useless
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

  // useless
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

  // useless
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

  // useless
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
