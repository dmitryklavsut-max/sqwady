// ── Claude Code Prompt Generator ──────────────────────────────────
// Generates structured prompts for complex tasks that need Claude Code
// to implement multi-file changes, full features, or architecture updates.

import { DESKS } from '../data/constants'

// Determine relevant files based on role and task
function getRelevantFiles(agentRole, project) {
  const stack = (project?.techStack || '').toLowerCase()

  const FILE_MAP = {
    back: ['src/backend/', 'src/api/', 'src/services/', 'src/models/', 'package.json'],
    front: ['src/components/', 'src/pages/', 'src/styles/', 'src/hooks/', 'package.json'],
    mob: ['src/screens/', 'src/navigation/', 'app.json', 'package.json'],
    cto: ['src/', 'docs/architecture/', 'package.json', 'tsconfig.json'],
    ops: ['.github/workflows/', 'Dockerfile', 'docker-compose.yml', 'infra/', 'package.json'],
    qa: ['tests/', 'src/**/*.test.*', 'jest.config.*', 'playwright.config.*'],
    ml: ['src/ml/', 'src/models/', 'requirements.txt', 'notebooks/'],
    des: ['src/styles/', 'src/components/', 'public/assets/'],
    pm: ['docs/', 'README.md'],
    ceo: ['docs/', 'README.md', 'package.json'],
    mrk: ['docs/marketing/', 'public/', 'src/pages/landing/'],
    wr: ['docs/', 'README.md', 'CHANGELOG.md'],
  }

  return FILE_MAP[agentRole] || ['src/', 'docs/']
}

// Generate implementation steps from artifact content
function extractSteps(artifactContent, artifactType) {
  if (!artifactContent) return ['Implement the task as described']

  const lines = artifactContent.split('\n')
  const steps = []

  // Extract headers as steps
  for (const line of lines) {
    if (line.startsWith('## ') && !line.startsWith('## Обзор') && !line.startsWith('## Overview')) {
      steps.push(line.replace(/^## /, '').trim())
    }
  }

  if (steps.length === 0) {
    // Fallback: extract key points
    if (artifactType === 'code') {
      steps.push('Create the files as specified in the artifact')
      steps.push('Implement all functions and classes')
      steps.push('Add necessary imports and exports')
      steps.push('Write tests if applicable')
    } else if (artifactType === 'spec') {
      steps.push('Review the specification')
      steps.push('Implement all requirements listed')
      steps.push('Ensure acceptance criteria are met')
    } else {
      steps.push('Implement the changes described in the artifact')
    }
  }

  return steps
}

// Generate verification steps
function getVerifySteps(agentRole, project) {
  const stack = (project?.techStack || '').toLowerCase()

  const VERIFY_MAP = {
    back: [
      'API endpoints respond correctly (test with curl/httpie)',
      'Database migrations run without errors',
      'All existing tests pass',
    ],
    front: [
      'Components render without errors',
      'No console errors in browser',
      'Responsive on mobile/tablet/desktop',
      'npm run build succeeds',
    ],
    ops: [
      'Docker build succeeds',
      'CI/CD pipeline passes',
      'Health check endpoint responds',
    ],
    qa: [
      'All test cases pass',
      'Coverage meets threshold',
      'No regressions in existing tests',
    ],
    cto: [
      'Architecture is consistent',
      'No circular dependencies',
      'npm run build succeeds',
    ],
  }

  const base = VERIFY_MAP[agentRole] || ['Changes work as expected', 'No errors in console']
  base.push('npm run build succeeds')
  return [...new Set(base)]
}

/**
 * Generate a Claude Code prompt for a complex task.
 * @param {object} task - The task to implement
 * @param {object} artifact - The spec/requirements artifact already generated
 * @param {object} projectContext - { project, memoryFiles, team }
 * @returns {{ prompt, estimatedComplexity, requiredContext }}
 */
export function generateClaudeCodePrompt(task, artifact, projectContext) {
  const { project, memoryFiles } = projectContext
  const agentRole = task.assignee || 'back'
  const desk = DESKS.find(d => d.id === agentRole)

  const relevantFiles = getRelevantFiles(agentRole, project)
  const steps = extractSteps(artifact?.content, artifact?.type)
  const verifySteps = getVerifySteps(agentRole, project)

  const commitMsg = `${artifact?.type === 'code' ? 'feat' : 'docs'}: ${task.title}`

  const prompt = `Read CLAUDE.md in the project root.

TASK: ${task.title}
PRIORITY: ${task.priority || 'P1'}
ASSIGNED ROLE: ${desk?.label || agentRole}

${task.description ? `DESCRIPTION:\n${task.description}\n` : ''}
PROJECT CONTEXT:
- Project: ${project?.name || 'Project'}
- Stack: ${project?.techStack || 'Not specified'}
- Stage: ${project?.stage || 'MVP'}
- Features: ${project?.mvpFeatures || 'Core features'}

${memoryFiles?.ARCHITECTURE ? `ARCHITECTURE:\n${memoryFiles.ARCHITECTURE.slice(0, 1500)}\n` : ''}
RELEVANT FILES TO CHECK:
${relevantFiles.map(f => `- ${f}`).join('\n')}

REQUIREMENTS (from ${desk?.label || agentRole} agent):
${artifact?.content ? artifact.content.slice(0, 3000) : 'Implement the task as described above.'}

WHAT TO IMPLEMENT:
${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

VERIFY:
${verifySteps.map(s => `- ${s}`).join('\n')}

After done: git add . && git commit -m "${commitMsg}" && git push origin main`

  // Estimate complexity
  const contentLen = (artifact?.content || '').length
  const stepCount = steps.length
  let estimatedComplexity = 'medium'
  if (contentLen > 2000 || stepCount > 5) estimatedComplexity = 'high'
  if (contentLen < 500 && stepCount <= 3) estimatedComplexity = 'low'

  return {
    prompt,
    estimatedComplexity,
    requiredContext: ['CLAUDE.md', ...relevantFiles],
    commitMessage: commitMsg,
  }
}
