import * as vscode from 'vscode';
import * as path from 'path';
import { WorkflowState } from '@linear/sdk';

import { IssuePriority } from './linear';

export class IssueItem extends vscode.TreeItem {
  constructor(
    public readonly status: WorkflowState | undefined,
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
    const iconConfig = vscode.workspace.getConfiguration('linear-sidebar').get('issue-item-icon');
    if (iconConfig === "status") {
      // select icon according to data
      let statusIconFileName: string = '';
      if (status === undefined) {
        statusIconFileName = '';
      } else if (status.type === "triage") {
        statusIconFileName = 'status_triage.svg';
      } else if (status.type === "backlog") {
        statusIconFileName = 'status_backlog.svg';
      } else if (status.type === "unstarted") {
        statusIconFileName = 'status_todo.svg';
      } else if (status.type === "started" && status.name === "In Progress") {
        statusIconFileName = 'status_in_progress.svg';
      } else if (status.type === "started" && status.name === "In Review") {
        statusIconFileName = 'status_in_review.svg';
      } else if (status.type === "completed") {
        statusIconFileName = 'status_done.svg';
      } else if (status.type === "canceled") {
        statusIconFileName = 'status_canceled.svg';
      }
      icon_path = path.join(__dirname, '..', 'media', statusIconFileName);

    } else if (iconConfig === "priority") {
      const priorityIconMap: { [key in IssuePriority]: string } = {
        [IssuePriority.Urgent]:      'priority_urgent.svg',
        [IssuePriority.High]:        'priority_high.svg',
        [IssuePriority.Medium]:      'priority_medium.svg',
        [IssuePriority.Low]:         'priority_low.svg',
        [IssuePriority.No_Priority]: 'priority_no.svg',
      };
      icon_path = path.join(__dirname, '..', 'media', priorityIconMap[priority] || '');

    } else if (iconConfig === "assignee") {
      icon_path = '';  // TODO: implement assignee icon
    } else {  // none
      icon_path = '';
    }
    
    this.iconPath = {
      light: icon_path,
      dark: icon_path,
    };

    this.id = issue_id;  // TODO: change it to avoid conflict, or just remove it.
    this.description = title;  // set the issue title as the TreeView item description
    this.tooltip = `${issue_id}: ${title}`;
    this.command = {
      command: 'linear-sidebar.show-issue',
      title: 'Show Issue',
      arguments: [this.issue_id]
    } // open issue content when the issue item is selected

  }
}
