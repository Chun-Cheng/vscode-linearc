import * as vscode from 'vscode';
import { Issue, Team, WorkflowState } from '@linear/sdk';

import { IssueItem, TeamItem } from './issueItem';
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


export class IssuesProvider implements vscode.TreeDataProvider<IssueItem | TeamItem> {
  private data: (IssueItem | TeamItem)[] = [];
  private isLoading: boolean = false;

  // private eventEmitter = new vscode.EventEmitter<IssueItem | undefined | void>();

  private _onDidChangeTreeData: vscode.EventEmitter<IssueItem | undefined | null | void> = new vscode.EventEmitter<IssueItem | undefined | null | void>();  // event emitter
  readonly onDidChangeTreeData: vscode.Event<IssueItem | undefined | null | void> = this._onDidChangeTreeData.event;

  public getTreeItem(element: IssueItem | TeamItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  public async getChildren(element?: IssueItem | TeamItem | undefined): Promise<(IssueItem | TeamItem)[]> {
    if (!element) {
      return this.data.filter(item => item instanceof TeamItem);
    } else if (element instanceof TeamItem) {
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

    const issuesByTeam = await linear.getIssuesByTeam();
    if (!issuesByTeam) {
      this.data = [];
      this.isLoading = false;
      this.updateView();
      return;
    }

    this.data = await Promise.all(Object.keys(issuesByTeam).map(async (teamId) => {
      const team = await linear.getTeam(teamId);
      if (!team) {
        throw new Error(`Team not found for id: ${teamId}`);
      }
      const issues = await Promise.all(issuesByTeam[teamId].map(async issue => new IssueItem(issue, await issue.state)));

      // Sort issues by status and updated time
      // TODO: improve performance
      issues.sort((a, b) => {
        const statusOrder = ["triage", "started", "unstarted", "backlog", "completed", "canceled"];
        const statusA = statusOrder.indexOf(a.state?.type || "");
        const statusB = statusOrder.indexOf(b.state?.type || "");
        if (statusA !== statusB) {
          return statusA - statusB;
        }
        return new Date(b.issue.updatedAt).getTime() - new Date(a.issue.updatedAt).getTime();
      });

      return new TeamItem(team, issues);
    }));

    this.isLoading = false;
    this.updateView();
  }  
}
