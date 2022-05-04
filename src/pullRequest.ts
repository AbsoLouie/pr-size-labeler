import { ConfigEntry } from './config';
import { getInput, info } from '@actions/core';
import * as github from '@actions/github';

export async function getPullRequest() {
  info('Getting information about pull request');

  const octokit = github.getOctokit(getInput('token'));

  const { data: files } = await octokit.rest.pulls.listFiles({
    ...github.context.repo,
    pull_number: github.context.issue.number,
  });

  info(`${files.length}`);

  return {
    ...github.context.payload.pull_request,
    numberOfFiles: files.length,
  };
}

export async function applyLabelOnPullRequest(entry: ConfigEntry, configuration: ConfigEntry[]) {
  // @ts-ignore
  const { labels } = github.context.payload.pull_request;
  info(`Find existing labels ${labels}`);

  const octokit = github.getOctokit(getInput('token'));

  if (labels.include(entry.label)) {
    return;
  }

  const possibleLabels = configuration.map((entry) => entry.label);
  const existingLabels = labels.filter((label: string) => possibleLabels.includes(label));
  if (existingLabels.length) {
    await octokit.rest.issues.removeLabel({
      ...github.context.repo,
      issue_number: github.context.issue.number,
      name: existingLabels[0],
    });
  }

  await octokit.rest.issues.addLabels({
    ...github.context.repo,
    issue_number: github.context.issue.number,
    labels: [{ name: entry.label }],
  });
}

export const getSize = (entryParamName: string) => (
  configuration: ConfigEntry[],
  currentCount: number,
): ConfigEntry => {
  const level = configuration.find((entry) => {
    // @ts-ignore
    const entryLevel: number = entry[entryParamName];
    return entryLevel < currentCount;
  });

  if (!level) {
    return configuration[configuration.length - 1];
  }

  return level;
};

export const getFileSize = getSize('files');

export const getDiffSize = getSize('diff');
