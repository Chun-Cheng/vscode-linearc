import * as vscode from 'vscode';
import { Issue, Team, WorkflowState } from '@linear/sdk';

import { TeamItem, CategoryItem, IssueItem } from './issueItem';
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


export class IssuesProvider implements vscode.TreeDataProvider<TeamItem | CategoryItem | IssueItem> {
  private data: (TeamItem | CategoryItem | IssueItem)[] = [];
  private isLoading: boolean = false;

  // private eventEmitter = new vscode.EventEmitter<IssueItem | undefined | void>();

  private _onDidChangeTreeData: vscode.EventEmitter<IssueItem | undefined | null | void> = new vscode.EventEmitter<IssueItem | undefined | null | void>();  // event emitter
  readonly onDidChangeTreeData: vscode.Event<IssueItem | undefined | null | void> = this._onDidChangeTreeData.event;

  public getTreeItem(element: TeamItem | CategoryItem | IssueItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  public async getChildren(element?: TeamItem | CategoryItem | IssueItem | undefined): Promise<(TeamItem | CategoryItem | IssueItem)[]> {
    if (!element) {
      return this.data.filter(item => item instanceof TeamItem);
    } else if (element instanceof TeamItem) {
      return element.categories;
    } else if (element instanceof CategoryItem) {
      return element.issues;
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

    // all issues in teams
    const issuesByTeam = await linear.getIssuesByTeam();
    // issues in the team assigned to the user
    const myIssuesByTeam = await linear.getMyIssuesByTeams();
    // active issues in the team
    const activeIssuesByTeam = await linear.getActiveIssuesByTeams();

    if (
      myTeams === null ||
      issuesByTeam === null ||
      myIssuesByTeam === null ||
      activeIssuesByTeam === null
    ) {
      this.data = [];
      this.isLoading = false;
      this.updateView();
      return;
    }

    this.data = await Promise.all(myTeams.map(async (team) => {
      // const team = await linear.getTeam(teamId);
      // if (!team) {
      //   throw new Error(`Team not found.`);
      // }

      const allIssues = issuesByTeam[team.id] || [];
      const myIssues = myIssuesByTeam[team.id] || [];
      const activeIssues = activeIssuesByTeam[team.id] || [];

      const categories = [
        new CategoryItem(
          "Assigned to me",
          await Promise.all(myIssues.map(async issue => new IssueItem(issue, await issue.state)))
        ),
        new CategoryItem(
          "Active Issues",
          await Promise.all(activeIssues.map(async issue => new IssueItem(issue, await issue.state)))
        ),
        new CategoryItem(
          "All Issues",
          await Promise.all(allIssues.map(async issue => new IssueItem(issue, await issue.state)))
        ),
      ];

      // Sort issues by status, priority and updated time
      // TODO: improve performance
      // issues.sort((a, b) => {
      //   const statusOrder = ["triage", "started", "unstarted", "backlog", "completed", "canceled"];
      //   const statusA = statusOrder.indexOf(a.state?.type || "");
      //   const statusB = statusOrder.indexOf(b.state?.type || "");
      //   if (statusA !== statusB) {
      //     return (statusA - statusB) * 65536;
      //   }

      //   const priorityOrder = [1, 2, 3, 4, 0];
      //   const priorityA = priorityOrder.indexOf(a.issue.priority || -1);
      //   const priorityB = priorityOrder.indexOf(a.issue.priority || -1);
      //   if (priorityA !== priorityB) {
      //     return (priorityA - priorityB) * 256;
      //   }

      //   return new Date(b.issue.updatedAt).getTime() - new Date(a.issue.updatedAt).getTime();
      // });

      return new TeamItem(team, categories);
    }));

    this.isLoading = false;
    this.updateView();
  }  
}
