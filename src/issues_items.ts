import * as vscode from "vscode";
import * as path from "path";
import { Issue, Team, WorkflowState, User } from "@linear/sdk";

import { IssuePriority } from "./api/linear";

export class IssueItem extends vscode.TreeItem {
  constructor(
    public readonly issue: Issue,
    public readonly state: WorkflowState | undefined,
    public readonly assignee: User | undefined,
    public readonly teamId: string,
    public readonly categoryId: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
  ) {
    super(issue.identifier, undefined);

    const priority = issue.priority === 1 ? IssuePriority.Urgent :
      issue.priority === 2 ? IssuePriority.High :
      issue.priority === 3 ? IssuePriority.Medium :
      issue.priority === 4 ? IssuePriority.Low :
      IssuePriority.No_Priority;

    // set item icon
    const iconConfig = vscode.workspace.getConfiguration("linearc").get("issue-item-icon");
    if (iconConfig === "status") {
      // select icon according to data
      let statusIconFileName: string = "";
      if (state === undefined) {
        statusIconFileName = "";
      } else if (state.type === "triage") {
        statusIconFileName = "status_triage.svg";
      } else if (state.type === "backlog") {
        statusIconFileName = "status_backlog.svg";
      } else if (state.type === "unstarted") {
        statusIconFileName = "status_todo.svg";
      } else if (state.type === "started" && state.name === "In Progress") {
        statusIconFileName = "status_in_progress.svg";
      } else if (state.type === "started" && state.name === "In Review") {
        statusIconFileName = "status_in_review.svg";
      } else if (state.type === "completed") {
        statusIconFileName = "status_done.svg";
      } else if (state.type === "canceled") {
        statusIconFileName = "status_canceled.svg";
      }
      this.iconPath = {
        light: path.join(__dirname, "..", "media", "light", statusIconFileName),
        dark: path.join(__dirname, "..", "media", "dark", statusIconFileName)
      };

    } else if (iconConfig === "priority") {
      const priorityIconMap: { [key in IssuePriority]: string } = {
        [IssuePriority.Urgent]:      "priority_urgent.svg",
        [IssuePriority.High]:        "priority_high.svg",
        [IssuePriority.Medium]:      "priority_medium.svg",
        [IssuePriority.Low]:         "priority_low.svg",
        [IssuePriority.No_Priority]: "priority_no.svg",
      };
      this.iconPath = {
        light: path.join(__dirname, "..", "media", "light", priorityIconMap[priority] || ""),
        dark: path.join(__dirname, "..", "media", "dark", priorityIconMap[priority] || "")
      };

    } else if (iconConfig === "assignee") {
      // icon_path = "";  // TODO: implement assignee icon
      if (assignee === undefined) {
        this.iconPath = {
          light: path.join(__dirname, "..", "media", "light", "assignee_no.svg"),
          dark: path.join(__dirname, "..", "media", "dark", "assignee_no.svg")
        };
      } else {
        // get assignee icon
        this.iconPath = assignee.avatarUrl
          ? vscode.Uri.parse(assignee.avatarUrl)
          : {
            light: path.join(__dirname, "..", "media", "light", "assignee_yes.svg"),
            dark: path.join(__dirname, "..", "media", "dark", "assignee_yes.svg")
          };
      }
    } else {  // none
      this.iconPath = "";
    }

    this.id = `${teamId}.${categoryId}.${issue.id}`;
    this.description = issue.title;  // set the issue title as the TreeView item description
    this.tooltip = `${issue.identifier}: ${issue.title}`;
    this.command = {
      command: "linearc.show-issue",
      title: "Show Issue",
      arguments: [issue.identifier, issue]
    }; // open issue content when the issue item is selected
    this.contextValue = "issue";
  }
}

export class TeamItem extends vscode.TreeItem {
  constructor(
    public readonly team: Team,
    public readonly categories: CategoryItem[],
    public readonly collapsibleState: vscode.TreeItemCollapsibleState =   vscode.TreeItemCollapsibleState.Collapsed
  ) {
    super(team.name, collapsibleState);
    this.id = team.id;
    this.tooltip = `${team.name}`;
    // this.iconPath = {
    //   light: path.join(__dirname, "..", "media", "light", "teams.svg"),
    //   dark: path.join(__dirname, "..", "media", "light", "teams.svg")
    // };
    this.contextValue = "team";
  }
}

export class CategoryItem extends vscode.TreeItem {
  constructor(
    public readonly name: string,
    public readonly teamId: string,
    public issues: IssueItem[],
    public collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed
  ) {
    const categoryId = name.toLowerCase().replace(" ", "-");

    super(name, collapsibleState);
    this.id = `${teamId}.${categoryId}`;
    this.tooltip = `${name}`;
  }
}

export class MessageItem extends vscode.TreeItem {
  constructor(
    public readonly type: "no-data" | "error",
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
  ) {
    super(type, collapsibleState);
    switch (type) {
      case "no-data":
        this.label = "No data";
        break;
      case "error":
        this.label = "Error";
        break;
    }
  }
}
