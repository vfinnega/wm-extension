import TelemetryReporter from "@vscode/extension-telemetry";
import * as vscode from "vscode";
import {
  WATERMELON_HISTORY_COMMAND,
  WATERMELON_OPEN_LINK_COMMAND,
  WATERMELON_PULLS_COMMAND,
} from "../../constants";
import getNumberOfFileChanges from "../getNumberOfFileChanges";
import getLatestCommit from "../others/git/getLatestCommit";
import getPlural from "../others/text/getPlural";
import getGitAPI from "../vscode/getGitAPI";

const hover = ({ reporter }: { reporter: TelemetryReporter | null }) => {
  return vscode.languages.registerHoverProvider("*", {
    async provideHover(document, position, token) {
      let gitAPI = await getGitAPI();
      let latestCommit = await getLatestCommit({
        startLine: position.line,
        endLine: position.line,
        currentlyOpenTabfilePath: document,
        gitAPI,
      });
      let numberOfFileChanges = await getNumberOfFileChanges(
        document.uri.fsPath || ".",
        gitAPI as any
      );
      const args = [{ startLine: position.line, endLine: position.line }];
      const startCommandUri = vscode.Uri.parse(
        `command:${WATERMELON_PULLS_COMMAND}?${encodeURIComponent(
          JSON.stringify(args)
        )}`
      );
      const blameCommandUri = vscode.Uri.parse(
        `command:${WATERMELON_HISTORY_COMMAND}?${encodeURIComponent(
          JSON.stringify(args)
        )}`
      );
      const mailtoLinkCommandUri = vscode.Uri.parse(
        `command:${WATERMELON_OPEN_LINK_COMMAND}?${encodeURIComponent(
          JSON.stringify({
            url: `mailto:${latestCommit.authorEmail}`,
            source: "hover",
          })
        )}`
      );
      const content = new vscode.MarkdownString(
        `$(git-pull-request)[Understand the code context](${startCommandUri}) with Watermelon 🍉`
      );
      content.appendMarkdown(`\n\n`);
      content.appendMarkdown(
        `The latest commit was made by ${
          latestCommit.authorEmail
            ? `[$(mail)${latestCommit.authorName}](${mailtoLinkCommandUri})`
            : `*${latestCommit.authorName}*`
        } on **${latestCommit.commitDate.toLocaleDateString()}**:
        `
      );
      content.appendMarkdown(`\n`);
      content.appendMarkdown(latestCommit.message);
      content.appendMarkdown(`\n\n`);
      content.appendMarkdown(
        `$(git-commit)[View the history for this line](${blameCommandUri}) with Watermelon 🍉`
      );
      content.appendMarkdown(`\n\n`);
      content.appendMarkdown(
        `This file has changed ${numberOfFileChanges} time${getPlural(
          numberOfFileChanges
        )}`
      );
      content.supportHtml = true;
      content.isTrusted = true;
      content.supportThemeIcons = true;
      reporter?.sendTelemetryEvent("hover");
      return new vscode.Hover(content);
    },
  });
};
export default hover;
