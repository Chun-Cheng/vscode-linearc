import * as vscode from 'vscode';

const eventEmitter = new vscode.EventEmitter();

eventEmitter.fire("new changed data!");

eventEmitter.event(message => {
  console.log(`received message: ${message}`);
});
