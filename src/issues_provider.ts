import * as vscode from 'vscode';
import { WorkflowState } from '@linear/sdk';

import { IssueItem } from './issueItem';
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


export class IssuesProvider implements vscode.TreeDataProvider<IssueItem> {
  private data: IssueItem[] = [];
  private isLoading: boolean = false;

  // private eventEmitter = new vscode.EventEmitter<IssueItem | undefined | void>();

  private _onDidChangeTreeData: vscode.EventEmitter<IssueItem | undefined | null | void> = new vscode.EventEmitter<IssueItem | undefined | null | void>();  // event emitter
  readonly onDidChangeTreeData: vscode.Event<IssueItem | undefined | null | void> = this._onDidChangeTreeData.event;

  public getTreeItem(element: IssueItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  public getChildren(element?: IssueItem | undefined): vscode.ProviderResult<IssueItem[]> {
    return Promise.resolve(this.data);
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
      this.data = [];
      this.isLoading = false;
      this.updateView();
      return;
    }
    this.data = await Promise.all(data.map(async (issue: any) => {
      let status: WorkflowState | undefined = undefined;
      if (issue._state.id !== undefined) {
        status = await linear.getWorkflowStateById(issue._state.id) || undefined;
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


