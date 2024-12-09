import * as vscode from 'vscode';

import { IssueStatus, Issue } from './issueItem';

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


export class IssuesProvider implements vscode.TreeDataProvider<Issue> {
  private dataStorage = [
    new Issue(IssueStatus.Todo, 'URB-1', 'Issue 1'),
    new Issue(IssueStatus.InProgress, 'URB-2', 'Issue 2'),
    new Issue(IssueStatus.InReview, 'URB-3', 'Issue 3'),
  ];

  private eventEmitter = new vscode.EventEmitter<Issue | undefined | void>();

  public get onDidChangeTreeData(): vscode.Event<Issue | undefined | void> {
    return this.eventEmitter.event;
  }

  public getTreeItem(element: Issue): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  public getChildren(element?: Issue | undefined): vscode.ProviderResult<Issue[]> {
    return Promise.resolve(this.dataStorage);
  }

  private updateView() {
    this.eventEmitter.fire();
  }

  // getParent?(element: Issue): vscode.ProviderResult<Issue> {
  //   throw new Error('Method not implemented.');
  // }
  // resolveTreeItem?(item: vscode.TreeItem, element: Issue, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
  //   throw new Error('Method not implemented.');
  // }
  
}


