/**
 * Miyabi Agents並列実行スクリプト
 * CoordinatorAgent → CodeGenAgent → ReviewAgent を並列実行
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface AgentExecOptions {
  issue: string;
  concurrency?: number;
  logLevel?: 'info' | 'debug' | 'error';
}

/**
 * コマンドライン引数をパース
 */
function parseArgs(): AgentExecOptions {
  const args = process.argv.slice(2);
  const options: AgentExecOptions = {
    issue: '',
    concurrency: 3,
    logLevel: 'info',
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--issue' && args[i + 1]) {
      options.issue = args[i + 1];
      i++;
    } else if (args[i] === '--concurrency' && args[i + 1]) {
      options.concurrency = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--log-level' && args[i + 1]) {
      options.logLevel = args[i + 1] as 'info' | 'debug' | 'error';
      i++;
    }
  }

  return options;
}

/**
 * Agentを実行
 */
function runAgent(agentName: string, issueNumber: string): boolean {
  try {
    console.log(`🤖 Running ${agentName} for Issue #${issueNumber}...`);

    const cmd = `npx miyabi agent run ${agentName} --issue=${issueNumber}`;
    const env = {
      ...process.env,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    };

    execSync(cmd, {
      stdio: 'inherit',
      env,
    });

    console.log(`✅ ${agentName} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${agentName} failed:`, error);
    return false;
  }
}

/**
 * メイン実行
 */
async function main() {
  console.log('🌸 Miyabi Autonomous Agent Execution');
  console.log('=====================================');
  console.log('');

  const options = parseArgs();

  if (!options.issue) {
    console.error('❌ Error: --issue parameter is required');
    process.exit(1);
  }

  console.log(`📋 Issue Number: #${options.issue}`);
  console.log(`⚙️  Concurrency: ${options.concurrency}`);
  console.log(`📊 Log Level: ${options.logLevel}`);
  console.log('');

  // Agent実行順序
  const agents = ['coordinator', 'codegen', 'review'];
  let allSuccess = true;

  for (const agent of agents) {
    const success = runAgent(agent, options.issue);
    if (!success) {
      allSuccess = false;
      console.log(`⚠️  ${agent} failed, but continuing...`);
    }
  }

  console.log('');
  console.log('=====================================');
  if (allSuccess) {
    console.log('✅ All agents completed successfully');
  } else {
    console.log('⚠️  Some agents failed');
  }
  console.log('');

  process.exit(allSuccess ? 0 : 1);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
