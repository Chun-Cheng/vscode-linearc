import * as vscode from 'vscode';
import { Issue } from '@linear/sdk';

import { GitExtension } from "./api/git";
import { linear } from "./api/linear";

let myStatusBarItem: vscode.StatusBarItem;

export function activate({ subscriptions }: vscode.ExtensionContext) {

  // create a new status bar item that we can now manage
  myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  subscriptions.push(myStatusBarItem);

  // register some listener that make sure the status bar item always up-to-date
  const gitExtension = vscode.extensions.getExtension<GitExtension>("vscode.git");
  if (gitExtension && gitExtension.isActive) {
    const git = gitExtension.exports.getAPI(1);
    const repository = git.repositories[0];
    if (repository) {
      subscriptions.push(repository.state.onDidChange(() => {
        if (repository.state.HEAD) {
          updateStatusBarItem();
        }
      }));
    }
  }

  // update status bar item once at start
  // updateStatusBarItem();
}

async function updateStatusBarItem(): Promise<void> {
  const issue = await getCurrentIssue();
  if (issue === undefined) {
    // myStatusBarItem.hide();
  } else {
    myStatusBarItem.text = `${issue.identifier}`;
    myStatusBarItem.tooltip = `${issue.identifier}: ${issue.title}`;
    myStatusBarItem.command = {
      command: "linearc.show-issue",
      title: "Show Issue",
      arguments: [issue.identifier]
    };
    myStatusBarItem.show();
  }
}

async function getCurrentIssue(): Promise<Issue | undefined> {
  const branchName = getCurrentGitBranch();
  if (branchName === undefined) {
    return undefined;
  }
  const branchNameTokens = branchName.split(/[/\-]/); // split by / or -

  const teams = await linear.getMyTeams() || []; // e.g. LIN
  const teamKeys = teams.map(team => team.key);
  for (let i = 0; i < branchNameTokens.length; i++) { // go throught branchNameTokens
    for (let j = 0; j < teamKeys.length; j++) { // go throught teamKeys
      if (branchNameTokens[i].toLowerCase() === teamKeys[j].toLowerCase()) {
        const issueIdentifier = `${teamKeys[j]}-${branchNameTokens[i + 1]}`; // e.g. LIN-12
        const issue = await linear.getIssueByIdentifier(issueIdentifier);
        if (issue !== null) {
          return issue;
        }
      }
    }
  }
  return undefined; // issue not exist or teamKey not found in branch name
}

function getCurrentGitBranch(): string | undefined {
  const gitExtension = vscode.extensions.getExtension<GitExtension>("vscode.git");
  if (!gitExtension) {
    // console.warn("Git extension not available");
    return undefined;
  }
  if (!gitExtension.isActive) {
    // console.warn("Git extension not active");
    return undefined;
  }

  // get version 1 of the API
  const git = gitExtension.exports.getAPI(1);
  const repository = git.repositories[0];
  if (!repository) {
    // console.warn("No Git repository for current document", docUri);
    return undefined;
  }

  const currentBranch = repository.state.HEAD;
  if (!currentBranch) {
    // console.warn("No HEAD branch for current document", docUri);
    return undefined;
  }

  const branchName = currentBranch.upstream?.name || undefined;
  if (!branchName) {
    // console.warn("Current branch has no name", docUri, currentBranch);
    return undefined;
  }

  return branchName;
}
