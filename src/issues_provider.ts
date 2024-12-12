import * as vscode from 'vscode';
import { Issue, Team, WorkflowState } from '@linear/sdk';

import { TeamItem, CategoryItem, IssueItem, MessageItem } from './issues_items';
import { IssuePriority, linear } from './linear';

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
      // TODO: call for fetching data
      const issues = element.issues;
      if (issues.length === 0) {
        return [new MessageItem("no-data")];
      }
      return issues;
    }
    return [];
  }

  private updateView() {
    this._onDidChangeTreeData.fire();
  }

  // getParent?(element: Issue): vscode.ProviderResult<Issue> {
  //   throw new Error('Method not implemented.');
  // }
  // resolveTreeItem?(item: vscode.TreeItem, element: Issue, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
  //   throw new Error('Method not implemented.');
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
  
  public async showTeamCategory(teamCategoryId: string) {
    this.isLoading = true;
    this.updateView();

    const tokens = teamCategoryId.split('.');
    if (tokens.length !== 2) {
      this.isLoading = false;
      this.updateView();
      return;
    }
    const teamId = tokens[0];
    const categoryId = tokens[1];

    // get team
    const team = this.data.find(item => item instanceof TeamItem && item.team.id === teamId) as TeamItem;
    if (!team) {
      vscode.window.showErrorMessage(`Team "${teamId}" not found. (showTeamCategory)`);
      this.isLoading = false;
      this.updateView();
      return;
    }

    // get category
    const category = team.categories.find(category => category.id === teamCategoryId);
    if (category === undefined) {
      vscode.window.showErrorMessage(`Category "${categoryId}" not found. (showTeamCategory)`);
      this.isLoading = false;
      this.updateView();
      return;
    }

    // expand the category
    category.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;

    if (category.issues.length === 0) {
      // get issues of the category

      // TODO: implement this
      switch (categoryId) {
        case 'my-issues':
          const myTeamIssues = await linear.getMyTeamIssuesById(teamId) || [];
          category.issues = await Promise.all(myTeamIssues.map(async issue => 
            new IssueItem(issue, await issue.state, teamId, categoryId))
          )
          break;
        case 'active-issues':
          const teamActiveIssues = await linear.getTeamActiveIssuesById(teamId) || [];
          category.issues = await Promise.all(teamActiveIssues.map(async issue => 
            new IssueItem(issue, await issue.state, teamId, categoryId))
          )
          break;
        case 'all-issues':
          const teamIssues = await linear.getTeamIssuesById(teamId) || [];
          category.issues = await Promise.all(teamIssues.map(async issue => 
            new IssueItem(issue, await issue.state, teamId, categoryId))
          )
          break;
      }
    }

    this.isLoading = false;
    this.updateView();
  }
}
