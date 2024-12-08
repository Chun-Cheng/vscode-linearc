import * as vscode from "vscode";
import { LinearClient } from "@linear/sdk";

class LinearProvider {
  linearClient: LinearClient | undefined;

  constructor() {
    this.linearClient = undefined;
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

    const me = await this.linearClient.viewer;
    const myIssues = await me.assignedIssues();
  
    if (myIssues.nodes.length) {
      myIssues.nodes.map(issue => console.log(`${me.displayName} has issue: ${issue.title}`));
    } else {
      console.log(`${me.displayName} has no issues`);
    }
  }


}
 
export const linear = new LinearProvider();
