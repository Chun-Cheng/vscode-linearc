import * as vscode from 'vscode';

import { IssueItem } from './issueItem';
import { IssueStatus, IssuePriority, linear } from './linear';

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


export class IssuesProvider implements vscode.TreeDataProvider<IssueItem> {
  private dataStorage: IssueItem[] = [
    // new IssueItem(IssueStatus.Backlog, IssuePriority.Urgent, 'URB-1', 'Issue 1'),
    // new IssueItem(IssueStatus.Todo, IssuePriority.High, 'URB-2', 'Issue 2'),
    // new IssueItem(IssueStatus.InProgress, IssuePriority.Medium, 'URB-3', 'Issue 3'),
    // new IssueItem(IssueStatus.InReview, IssuePriority.Low, 'URB-4', 'Issue 4'),
    // new IssueItem(IssueStatus.Done, IssuePriority.No_Priority, 'URB-5', 'Issue 5'),
    // new IssueItem(IssueStatus.Canceled, IssuePriority.No_Priority, 'URB-6', 'Issue 6'),
    // new IssueItem(IssueStatus.Duplicate, IssuePriority.No_Priority, 'URB-7', 'Issue 7'),
  ];
  private isLoading: boolean = false;

  // private eventEmitter = new vscode.EventEmitter<IssueItem | undefined | void>();

  private _onDidChangeTreeData: vscode.EventEmitter<IssueItem | undefined | null | void> = new vscode.EventEmitter<IssueItem | undefined | null | void>();  // event emitter
  readonly onDidChangeTreeData: vscode.Event<IssueItem | undefined | null | void> = this._onDidChangeTreeData.event;

  public getTreeItem(element: IssueItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  public getChildren(element?: IssueItem | undefined): vscode.ProviderResult<IssueItem[]> {
    return Promise.resolve(this.dataStorage);
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

    const data = await linear.getIssues();
    // vscode.window.showInformationMessage(`${JSON.stringify(data, null, 4)}`);
    if (!data) {
      this.dataStorage = [];
      this.isLoading = false;
      this.updateView();
      return;
    }
    this.dataStorage = await Promise.all(data.map(async (issue: any) => {
      let status = await linear.getStatus(issue["_state"]["id"]);
      if (status === undefined) {
        status = IssueStatus.Backlog;
      }

      const priority = issue["priority"] === 1 ? IssuePriority.Urgent :
        issue["priority"] === 2 ? IssuePriority.High :
        issue["priority"] === 3 ? IssuePriority.Medium :
        issue["priority"] === 4 ? IssuePriority.Low :
        IssuePriority.No_Priority;

      return new IssueItem(
        status,
        priority,
        issue.identifier, // issue_id
        issue.title,
      );
    }));

    this.isLoading = false;
    this.updateView();
  }
  
}


