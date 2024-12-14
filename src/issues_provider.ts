import * as vscode from "vscode";
import { Issue, Team, WorkflowState } from "@linear/sdk";

import { TeamItem, CategoryItem, IssueItem, MessageItem } from "./issues_items";
import { IssuePriority, linear } from "./api/linear";

// Issues view
//   team 1
//     my issues
//       issue 1
//     active issues
//     all issues
//   team 2

// Project view
//   project 1
//   project 2

// status bar
//   show issue id of the current branch


export class IssuesProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private data: (vscode.TreeItem)[] = [];
  private isLoading: boolean = false;

  // private teams: Team[] = [];
  // private categories: string[] = ["My Issues", "Active Issues", "All Issues"];
  // private issues: { [teamId: string]: Issue[] } = {};

  // private eventEmitter = new vscode.EventEmitter<IssueItem | undefined | void>();

  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();  // event emitter
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  public getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  public async getChildren(element?: vscode.TreeItem | undefined): Promise<(vscode.TreeItem)[]> {
    if (!element) {
      const teamItems = this.data.filter(item => item instanceof TeamItem);
      if (teamItems.length === 0) {
        return [new MessageItem("no-data")];
      }
      return teamItems;
    } else if (element instanceof TeamItem) {
      const catogoryItems = element.categories;
      if (catogoryItems.length === 0) {
        return [new MessageItem("no-data")];
      }
      return catogoryItems;
    } else if (element instanceof CategoryItem) {
      if (element.issues.length >= 1 && !(element.issues[0] instanceof MessageItem)) {
        return element.issues;
      }

      // issues is empty => fetching data
      const teamId = element.teamId;
      const categoryId = element.name.toLowerCase().replace(" ", "-");
      const iconConfig = vscode.workspace.getConfiguration("linearc").get("issue-item-icon");
      let issues: Issue[] = [];

      switch (categoryId) {
        case "my-issues":
          issues = await linear.getMyTeamIssuesById(teamId) || [];
          break;
        case "active-issues":
          issues = await linear.getTeamActiveIssuesById(teamId) || [];
          break;
        case "all-issues":
          issues = await linear.getTeamIssuesById(teamId) || [];
          break;
      }

      element.issues = await Promise.all(issues.map(async issue => {
        let assignee = undefined;
        if (iconConfig === "assignee") {
          assignee = await issue.assignee;
        }
        return new IssueItem(issue, await issue.state, assignee, teamId, categoryId);
      }));

      if (element.issues.length === 0) {
        return [new MessageItem("no-data")];
      }
      return element.issues;
    }
    return [new MessageItem("error")];
  }

  private updateView() {
    this._onDidChangeTreeData.fire();
  }

  // getParent?(element: Issue): vscode.ProviderResult<Issue> {
  //   throw new Error("Method not implemented.");
  // }
  // resolveTreeItem?(item: vscode.TreeItem, element: Issue, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
  //   throw new Error("Method not implemented.");
  // }

  public async refresh() {
    this.isLoading = true;
    this.updateView();

    // teams of user
    const myTeams = await linear.getMyTeams() || [];

    if (myTeams === null) {
      this.data = [];
      this.isLoading = false;
      this.updateView();
      return;
    }

    this.data = await Promise.all(myTeams.map(async (team) => {
      const categories = [
        new CategoryItem("My Issues", team.id, []),
        new CategoryItem("Active Issues", team.id, []),
        new CategoryItem("All Issues", team.id, []),
      ];

      // TODO: Sort issues by status, priority and updated time, with acceptable performance

      return new TeamItem(team, categories);
    }));

    this.isLoading = false;
    this.updateView();
  }
}
