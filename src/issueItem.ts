import * as vscode from 'vscode';
import * as path from 'path';
import { match } from 'assert';

export enum IssueStatus {
  Backlog,
  Todo,
  InProgress,
  InReview,
  Done,
  Canceled,
  Duplicate,
}

export class Issue extends vscode.TreeItem {
  constructor(
    public readonly status: IssueStatus,
    public readonly issue_id: string,
    public readonly title: string,
    // public readonly collapsibleState?: vscode.TreeItemCollapsibleState
  ) {
    // super(label, collapsibleState);
    super(`${issue_id}: ${title}`, undefined);
    // this.contextValue = 'issue';

    // set status icon
    // murmur: this syntax is ugly
    let icon_path: string;
    switch (status) {
      case IssueStatus.Backlog:
        icon_path = path.join(__dirname, '..', 'media', 'status_backlog.svg');
        break;
      case IssueStatus.Todo:
        icon_path = path.join(__dirname, '..', 'media', 'status_todo.svg');
        break;
      case IssueStatus.InProgress:
        icon_path = path.join(__dirname, '..', 'media', 'status_in_progress.svg');
        break;
      case IssueStatus.InReview:
        icon_path = path.join(__dirname, '..', 'media', 'status_in_review.svg');
        break;
      case IssueStatus.Done:
        icon_path = path.join(__dirname, '..', 'media', 'status_done.svg');
        break;
      case IssueStatus.Canceled:
      case IssueStatus.Duplicate:
        icon_path = path.join(__dirname, '..', 'media', 'status_cross.svg');
        break;
      default:
        icon_path = '';
    }
    this.iconPath = {
      light: icon_path,
      dark: icon_path,
    };
  }
}
