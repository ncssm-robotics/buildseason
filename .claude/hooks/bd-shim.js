#!/usr/bin/env node
/**
 * bd-shim.js - A minimal beads reader for Claude Code Web
 * Provides "ready" command to show next available tasks
 */

const fs = require('fs');
const path = require('path');

const BEADS_DIR = path.join(process.cwd(), '.beads');
const ISSUES_FILE = path.join(BEADS_DIR, 'issues.jsonl');

function loadIssues() {
  if (!fs.existsSync(ISSUES_FILE)) {
    console.error('No .beads/issues.jsonl found');
    process.exit(1);
  }

  const lines = fs.readFileSync(ISSUES_FILE, 'utf-8').split('\n').filter(Boolean);
  return lines.map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

function getBlockingIds(issues) {
  const blocking = new Set();
  for (const issue of issues) {
    if (issue.dependencies) {
      for (const dep of issue.dependencies) {
        if (dep.type === 'blocks' || dep.type === 'parent-child') {
          blocking.add(dep.depends_on_id);
        }
      }
    }
  }
  return blocking;
}

function ready(limit = 10, json = false) {
  const issues = loadIssues();
  const closedIds = new Set(issues.filter(i => i.status === 'closed' || i.status === 'done').map(i => i.id));

  // Find issues that are blocked by unclosed issues
  const blockedIds = new Set();
  for (const issue of issues) {
    if (issue.dependencies) {
      for (const dep of issue.dependencies) {
        if ((dep.type === 'blocks' || dep.type === 'parent-child') && !closedIds.has(dep.depends_on_id)) {
          blockedIds.add(issue.id);
        }
      }
    }
  }

  // Filter to open tasks (not epics) that aren't blocked
  const ready = issues.filter(i =>
    (i.status === 'open' || i.status === 'in_progress') &&
    i.issue_type === 'task' &&
    !blockedIds.has(i.id)
  ).sort((a, b) => (a.priority || 99) - (b.priority || 99))
   .slice(0, limit);

  if (json) {
    console.log(JSON.stringify(ready, null, 2));
  } else {
    if (ready.length === 0) {
      console.log('No ready tasks found.');
      return;
    }
    console.log('Ready tasks (sorted by priority):\n');
    for (const issue of ready) {
      const status = issue.status === 'in_progress' ? '[IN PROGRESS]' : '';
      console.log(`  ${issue.id} [P${issue.priority || '?'}] ${status}`);
      console.log(`    ${issue.title}`);
      console.log('');
    }
  }
}

function show(id) {
  const issues = loadIssues();
  const issue = issues.find(i => i.id === id);
  if (!issue) {
    console.error(`Issue ${id} not found`);
    process.exit(1);
  }
  console.log(JSON.stringify(issue, null, 2));
}

function list(status = null) {
  const issues = loadIssues();
  const filtered = status ? issues.filter(i => i.status === status) : issues;

  console.log(`Issues (${filtered.length} total):\n`);
  for (const issue of filtered.slice(0, 20)) {
    console.log(`  ${issue.id} [${issue.status}] ${issue.title}`);
  }
  if (filtered.length > 20) {
    console.log(`  ... and ${filtered.length - 20} more`);
  }
}

// CLI
const args = process.argv.slice(2);
const cmd = args[0];

switch (cmd) {
  case 'ready':
    const jsonFlag = args.includes('--json');
    const limitIdx = args.indexOf('--limit');
    const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) || 10 : 10;
    ready(limit, jsonFlag);
    break;
  case 'show':
    show(args[1]);
    break;
  case 'list':
    list(args[1]);
    break;
  case 'version':
    console.log('bd-shim 0.1.0 (Claude Code Web fallback)');
    break;
  default:
    console.log('bd-shim - Beads reader for Claude Code Web');
    console.log('');
    console.log('Commands:');
    console.log('  ready [--limit N] [--json]  Show ready tasks');
    console.log('  show <id>                   Show issue details');
    console.log('  list [status]               List issues');
    console.log('  version                     Show version');
}
