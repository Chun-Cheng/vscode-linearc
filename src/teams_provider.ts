// import * as vscode from 'vscode';

// import { IssuesProvider } from './issues_provider';
// import { IssueStatus, IssuePriority, linear } from './linear';


// export class TeamsProvider implements vscode.TreeDataProvider<IssuesProvider> {
//   private dataStorage: IssuesProvider[] = [];
//   private isLoading: boolean = false;

//   private _onDidChangeTreeData: vscode.EventEmitter<IssuesProvider | undefined | null | void> = new vscode.EventEmitter<IssuesProvider | undefined | null | void>();  // event emitter
//   readonly onDidChangeTreeData: vscode.Event<IssuesProvider | undefined | null | void> = this._onDidChangeTreeData.event;

//   public getTreeItem(element: IssuesProvider): vscode.TreeItem | Thenable<vscode.TreeItem> {
//     return element;
//   }

//   public getChildren(element?: IssuesProvider | undefined): vscode.ProviderResult<IssuesProvider[]> {
//     return Promise.resolve(this.dataStorage);
//   }

//   private updateView() {
//     this._onDidChangeTreeData.fire();
//   }

//   // getParent?(element: Issue): vscode.ProviderResult<Issue> {
//   //   throw new Error('Method not implemented.');
//   // }
//   // resolveTreeItem?(item: vscode.TreeItem, element: Issue, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
//   //   throw new Error('Method not implemented.');
//   // }


//   public async refresh() {
//     this.isLoading = true;
//     this.updateView();

//     const data = await linear.getIssues();
//     // vscode.window.showInformationMessage(`${JSON.stringify(data, null, 4)}`);
//     if (!data) {
//       this.dataStorage = [];
//       this.isLoading = false;
//       this.updateView();
//       return;
//     }
//     this.dataStorage = await Promise.all(data.map(async (issue: any) => {
//       let status = await linear.getStatus(issue["_state"]["id"]);
//       if (status === undefined) {
//         status = IssueStatus.Backlog;
//       }

//       const priority = issue["priority"] === 1 ? IssuePriority.Urgent :
//         issue["priority"] === 2 ? IssuePriority.High :
//         issue["priority"] === 3 ? IssuePriority.Medium :
//         issue["priority"] === 4 ? IssuePriority.Low :
//         IssuePriority.No_Priority;

//       return new IssueItem(
//         status,
//         priority,
//         issue.identifier, // issue_id
//         issue.title,
//       );
//     }));

//     this.isLoading = false;
//     this.updateView();
//   }
  
// }
