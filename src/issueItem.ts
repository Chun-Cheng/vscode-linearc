import * as vscode from 'vscode';
import * as path from 'path';

import { IssueStatus, IssuePriority } from './linear';

export class IssueItem extends vscode.TreeItem {
  constructor(
    public readonly status: IssueStatus,
    public readonly priority: IssuePriority,
    public readonly issue_id: string,
    public readonly title: string,
    // public readonly collapsibleState?: vscode.TreeItemCollapsibleState
  ) {
    // super(label, collapsibleState);
    super(issue_id, undefined);
    // this.contextValue = 'issue';

    // set item icon
    let icon_path: string;
    if (true) {  // TODO: change this to user_preference.issue_icon === status
      const statusIconMap: { [key in IssueStatus]: string } = {
        [IssueStatus.Backlog]:    'status_backlog.svg',
        [IssueStatus.Todo]:       'status_todo.svg',
        [IssueStatus.InProgress]: 'status_in_progress.svg',
        [IssueStatus.InReview]:   'status_in_review.svg',
        [IssueStatus.Done]:       'status_done.svg',
        [IssueStatus.Canceled]:   'status_cross.svg',
        [IssueStatus.Duplicate]:  'status_cross.svg',
      };
      icon_path = path.join(__dirname, '..', 'media', statusIconMap[status] || '');

    } else if (true) {  // user_preference.issue_icon === priority
      const priorityIconMap: { [key in IssuePriority]: string } = {
        [IssuePriority.Urgent]:      'priority_urgent.svg',
        [IssuePriority.High]:        'priority_high.svg',
        [IssuePriority.Medium]:      'priority_medium.svg',
        [IssuePriority.Low]:         'priority_low.svg',
        [IssuePriority.No_Priority]: 'priority_no.svg',
      };
      icon_path = path.join(__dirname, '..', 'media', priorityIconMap[priority] || '');

    } else if (true) {  // user_preference.issue_icon === assignee
      icon_path = '';
    } else {  // user_preference.issue_icon === no_icon
      icon_path = '';
    }
    
    this.iconPath = {
      light: icon_path,
      dark: icon_path,
    };

    this.id = issue_id;  // TODO: change it to avoid conflict, or just remove it.
    this.description = title;  // set the issue title as the TreeView item description
    this.command = {
      command: 'linear-sidebar.show-issue',
      title: 'Show Issue',
      arguments: [this.issue_id]
    } // open issue content when the issue item is selected

  }
}
