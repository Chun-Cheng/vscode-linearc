import * as vscode from 'vscode';
import * as path from 'path';
import { Issue, Team, WorkflowState } from '@linear/sdk';

import { IssuePriority } from './linear';

export class IssueItem extends vscode.TreeItem {
  constructor(
    public readonly issue: Issue,
    public readonly state: WorkflowState | undefined,
    public readonly collapsibleState?: vscode.TreeItemCollapsibleState
  ) {
    const issueIdentifier = issue.identifier;
    const title = issue.title;

    const priority = issue.priority === 1 ? IssuePriority.Urgent :
      issue.priority === 2 ? IssuePriority.High :
      issue.priority === 3 ? IssuePriority.Medium :
      issue.priority === 4 ? IssuePriority.Low :
      IssuePriority.No_Priority;

    // set item icon
    let icon_path: string | { light: string, dark: string };
    const iconConfig = vscode.workspace.getConfiguration('linear-sidebar').get('issue-item-icon');
    if (iconConfig === "status") {
      // select icon according to data
      let statusIconFileName: string = '';
      if (state === undefined) {
        statusIconFileName = '';
      } else if (state.type === "triage") {
        statusIconFileName = 'status_triage.svg';
      } else if (state.type === "backlog") {
        statusIconFileName = 'status_backlog.svg';
      } else if (state.type === "unstarted") {
        statusIconFileName = 'status_todo.svg';
      } else if (state.type === "started" && state.name === "In Progress") {
        statusIconFileName = 'status_in_progress.svg';
      } else if (state.type === "started" && state.name === "In Review") {
        statusIconFileName = 'status_in_review.svg';
      } else if (state.type === "completed") {
        statusIconFileName = 'status_done.svg';
      } else if (state.type === "canceled") {
        statusIconFileName = 'status_canceled.svg';
      }
      icon_path = {
        light: path.join(__dirname, '..', 'media', 'light', statusIconFileName),
        dark: path.join(__dirname, '..', 'media', 'dark', statusIconFileName)
      };

    } else if (iconConfig === "priority") {
      const priorityIconMap: { [key in IssuePriority]: string } = {
        [IssuePriority.Urgent]:      'priority_urgent.svg',
        [IssuePriority.High]:        'priority_high.svg',
        [IssuePriority.Medium]:      'priority_medium.svg',
        [IssuePriority.Low]:         'priority_low.svg',
        [IssuePriority.No_Priority]: 'priority_no.svg',
      };
      icon_path = {
        light: path.join(__dirname, '..', 'media', 'light', priorityIconMap[priority] || ''),
        dark: path.join(__dirname, '..', 'media', 'dark', priorityIconMap[priority] || '')
      };

    } else if (iconConfig === "assignee") {
      icon_path = '';  // TODO: implement assignee icon
    } else {  // none
      icon_path = '';
    }

    // super(label, collapsibleState);
    super(issue.identifier, undefined);
    // this.contextValue = 'issue';
    
    this.iconPath = icon_path;
    this.id = issue.id;
    this.description = issue.title;  // set the issue title as the TreeView item description
    this.tooltip = `${issue.identifier}: ${issue.title}`;
    this.command = {
      command: 'linear-sidebar.show-issue',
      title: 'Show Issue',
      arguments: [issue.identifier]
    } // open issue content when the issue item is selected

  }
}

export class TeamItem extends vscode.TreeItem {
  constructor(
    public readonly team: Team,
    public readonly issues: IssueItem[],
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed
  ) {
    super(team.name, collapsibleState);
    this.id = team.id;
    this.tooltip = `${team.name}`;
    // this.iconPath = new vscode.ThemeIcon('organization');
  }
}
