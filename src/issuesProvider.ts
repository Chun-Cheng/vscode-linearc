import * as vscode from 'vscode';

// Issues view
// All: all issues

export class Issue extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState?: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.contextValue = 'issue';
  }
}

export class IssuesProvider implements vscode.TreeDataProvider<Issue> {
  private dataStorage = [
    new Issue('Issue 1'),
    new Issue('Issue 2'),
    new Issue('Issue 3'),
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


