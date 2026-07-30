/**
 * Offline AI Service — Client-side fallback when the Laravel backend is unreachable.
 * 
 * Uses cached board data from BoardContext to generate intelligent responses
 * without any API keys, backend server, or local models.
 */

/**
 * Generate a context-aware response using only cached board data.
 * @param {string} userMessage - The user's question/prompt
 * @param {object} boardData - Cached activeBoard from BoardContext
 * @returns {string} AI-formatted markdown response
 */
export function generateOfflineResponse(userMessage, boardData) {
  const lower = userMessage.toLowerCase();

  // Detect intent category
  if (isBoardSummaryRequest(lower)) {
    return generateBoardSummary(boardData);
  }
  if (isSprintPlanningRequest(lower)) {
    return generateSprintPlan(boardData);
  }
  if (isTaskBreakdownRequest(lower)) {
    return generateTaskBreakdown(boardData, userMessage);
  }
  if (isUserStoryRequest(lower)) {
    return generateUserStories(boardData, userMessage);
  }
  if (isPrioritizationRequest(lower)) {
    return generatePrioritization(boardData);
  }
  if (isNextTaskRequest(lower)) {
    return suggestNextTask(boardData);
  }
  if (isEffortEstimationRequest(lower)) {
    return generateEffortEstimation(boardData, userMessage);
  }

  // Default: General Q&A using board context
  return generateGeneralResponse(boardData, userMessage);
}

/* ─── Intent Detection ─── */

function isBoardSummaryRequest(text) {
  return /^(summarize|summary|overview|status|audit|bottleneck|health|report)/i.test(text);
}

function isSprintPlanningRequest(text) {
  return /(sprint|2-week|two week|timeline|iteration|milestone)/i.test(text);
}

function isTaskBreakdownRequest(text) {
  return /(break\s*down|sub.?task|actionable|feature\s*breakdown|decompose|split)/i.test(text);
}

function isUserStoryRequest(text) {
  return /(user\s*stor|acceptance\s*criteria|story|epic|backlog\s*item)/i.test(text);
}

function isPrioritizationRequest(text) {
  return /(prioriti[sz]|backlog|importance|impact|mo?scow|rank)/i.test(text);
}

function isNextTaskRequest(text) {
  return /(suggest|next\s*task|what\s*should\s*i|recommend|pull\s*into\s*progress)/i.test(text);
}

function isEffortEstimationRequest(text) {
  return /(effort|estimate|fibonacci|story\s*point|complexity|how\s*long|time)/i.test(text);
}

/* ─── Response Generators ─── */

function getLists(board) {
  return board?.lists || [];
}

function getAllCards(board) {
  return getLists(board).flatMap(l => l.cards || []);
}

function generateBoardSummary(board) {
  if (!board) return "No active workspace selected. Please create or select a board first.";

  const lists = getLists(board);
  const allCards = getAllCards(board);
  const totalTasks = allCards.length;
  const completedTasks = allCards.filter(c => (c.status === 'done' || c.status === 'completed')).length;
  const highPriority = allCards.filter(c => c.priority === 'high').length;
  const overdueTasks = allCards.filter(c => c.due_date && new Date(c.due_date) < new Date()).length;

  let summary = `## 📊 Workspace Summary: **${board.name}**\n\n`;
  summary += `### Overview\n`;
  summary += `- **Total Columns:** ${lists.length}\n`;
  summary += `- **Total Tasks:** ${totalTasks}\n`;
  summary += `- **Completed:** ${completedTasks} (${totalTasks ? Math.round(completedTasks/totalTasks*100) : 0}%)\n`;
  summary += `- **High Priority:** ${highPriority}\n`;
  summary += `- **Overdue:** ${overdueTasks}\n\n`;

  if (lists.length > 0) {
    summary += `### Column Breakdown\n`;
    for (const list of lists) {
      const cards = list.cards || [];
      summary += `- **${list.name}:** ${cards.length} tasks\n`;
    }
  }

  // Bottleneck detection
  const bottleneck = lists.reduce((max, l) => ((l.cards?.length || 0) > (max.cards?.length || 0) ? l : max), lists[0]);
  if (bottleneck && (bottleneck.cards?.length || 0) > 3) {
    summary += `\n### ⚠️ Bottleneck Detected\n`;
    summary += `Column **"${bottleneck.name}"** has ${bottleneck.cards?.length || 0} tasks — consider breaking it into sub-columns or rebalancing the workflow.\n`;
  }

  if (highPriority > 3) {
    summary += `\n### 🔥 Attention Required\n`;
    summary += `There are **${highPriority} high-priority tasks**. Consider focusing the next sprint on clearing these.\n`;
  }

  return summary;
}

function generateSprintPlan(board) {
  if (!board) return "No active workspace selected.";

  const allCards = getAllCards(board);
  const highPriority = allCards.filter(c => c.priority === 'high');
  const mediumPriority = allCards.filter(c => c.priority === 'medium');
  const unassigned = allCards.filter(c => !c.member_id && !c.member);

  let plan = `## 📅 2-Week Sprint Plan: **${board.name}**\n\n`;

  plan += `### Sprint Goal\n`;
  plan += `Complete the highest priority items and reduce technical debt.\n\n`;

  plan += `### Phase 1: Critical (Days 1-3)\n`;
  if (highPriority.length > 0) {
    for (const card of highPriority.slice(0, 5)) {
      const assignee = card.member?.name || 'Unassigned';
      plan += `- 🔴 **${card.title}** (${assignee}) — ${card.description?.substring(0, 80) || 'No description'}\n`;
    }
  } else {
    plan += `- No high-priority tasks identified.\n`;
  }

  plan += `\n### Phase 2: Important (Days 4-8)\n`;
  if (mediumPriority.length > 0) {
    for (const card of mediumPriority.slice(0, 5)) {
      const assignee = card.member?.name || 'Unassigned';
      plan += `- 🟡 **${card.title}** (${assignee})\n`;
    }
  } else {
    plan += `- No medium-priority tasks identified.\n`;
  }

  plan += `\n### Phase 3: Review & Retro (Days 9-10)\n`;
  plan += `- ✅ Review completed tasks\n`;
  plan += `- 🔄 Retrospective session\n`;
  plan += `- 📋 Prepare next sprint backlog\n`;

  if (unassigned.length > 0) {
    plan += `\n### ⚠️ Unassigned Tasks (${unassigned.length})\n`;
    plan += `The following tasks need owners:\n`;
    for (const card of unassigned.slice(0, 5)) {
      plan += `- ${card.title}\n`;
    }
  }

  plan += `\n---\n*Estimated velocity: ${Math.min(highPriority.length + mediumPriority.length, 10)} story points per sprint.*`;

  return plan;
}

function generateTaskBreakdown(board, userMessage) {
  const featureMatch = userMessage.match(/[""]([^""]+)[""]|'([^']+)'|break\s*down\s*(.+)/i);
  const featureName = featureMatch?.[1] || featureMatch?.[2] || featureMatch?.[3] || 'the requested feature';

  return `## 🧩 Task Breakdown: **${featureName.trim()}**\n\n` +
    `### Technical Requirements\n` +
    `1. **Database Design**\n` +
    `   - Define schema and relationships\n` +
    `   - Create migration files\n` +
    `   - Add validation rules\n\n` +
    `2. **API Development**\n` +
    `   - Create RESTful endpoints\n` +
    `   - Add request validation\n` +
    `   - Write API tests\n\n` +
    `3. **Frontend Implementation**\n` +
    `   - Build UI components\n` +
    `   - Add state management\n` +
    `   - Implement error handling\n\n` +
    `4. **Integration & Testing**\n` +
    `   - End-to-end testing\n` +
    `   - Performance optimization\n` +
    `   - Accessibility audit\n\n` +
    `### Effort Estimates (Fibonacci)\n` +
    `- Database Design: **3 points**\n` +
    `- API Development: **5 points**\n` +
    `- Frontend: **8 points**\n` +
    `- Integration: **3 points**\n\n` +
    `*Total: ~19 story points*`;
}

function generateUserStories(board, userMessage) {
  const featureMatch = userMessage.match(/for\s+(.+)/i);
  const feature = featureMatch?.[1]?.trim() || 'this feature';

  const lists = getLists(board);
  const allCards = getAllCards(board);

  let stories = `## 📖 User Stories: ${feature}\n\n` +
    `### Epic: ${feature}\n\n` +
    `#### Story 1: Core Functionality\n` +
    `**As a** user\n` +
    `**I want** to access the ${feature} functionality\n` +
    `**So that** I can accomplish my goal efficiently\n\n` +
    `**Acceptance Criteria:**\n` +
    `- [ ] User can navigate to the ${feature} section\n` +
    `- [ ] Core functions work without errors\n` +
    `- [ ] Proper feedback is provided for all actions\n` +
    `- [ ] Works on desktop and mobile\n\n` +
    `#### Story 2: Data Management\n` +
    `**As a** project manager\n` +
    `**I want** to manage data within ${feature}\n` +
    `**So that** I can keep information up-to-date\n\n` +
    `**Acceptance Criteria:**\n` +
    `- [ ] CRUD operations available\n` +
    `- [ ] Data validation prevents errors\n` +
    `- [ ] Changes persist correctly\n\n` +
    `#### Story 3: Advanced Features\n` +
    `**As a** power user\n` +
    `**I want** advanced options in ${feature}\n` +
    `**So that** I can customize my workflow\n\n` +
    `**Acceptance Criteria:**\n` +
    `- [ ] Advanced settings accessible\n` +
    `- [ ] Customization options work properly\n` +
    `- [ ] Performance remains optimal\n`;

  if (allCards.length > 0) {
    stories += `\n### 🔗 Related Existing Tasks\n`;
    for (const card of allCards.slice(0, 3)) {
      stories += `- **${card.title}** (${card.priority} priority)\n`;
    }
  }

  return stories;
}

function generatePrioritization(board) {
  if (!board) return "No active workspace selected.";

  const allCards = getAllCards(board);
  if (allCards.length === 0) return "No tasks to prioritize.";

  const priorityOrder = { high: 0, medium: 1, low: 2 };

  const sorted = [...allCards].sort((a, b) => {
    const pA = priorityOrder[a.priority] ?? 99;
    const pB = priorityOrder[b.priority] ?? 99;
    if (pA !== pB) return pA - pB;
    // Sort by due date if available
    if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
    return 0;
  });

  const lists = getLists(board);

  let result = `## 🎯 Backlog Prioritization: **${board.name}**\n\n`;

  result += `### MoSCoW Analysis\n\n`;
  result += `**Must Have** (Critical path items)\n`;
  const mustHave = sorted.filter(c => c.priority === 'high').slice(0, 5);
  if (mustHave.length > 0) {
    for (const card of mustHave) {
      const list = lists.find(l => l.id === card.board_list_id);
      result += `- 🔴 **${card.title}** — ${list ? `Column: ${list.name}` : 'No column'}\n`;
    }
  } else {
    result += `- None identified\n`;
  }

  result += `\n**Should Have** (Important but not critical)\n`;
  const shouldHave = sorted.filter(c => c.priority === 'medium').slice(0, 5);
  if (shouldHave.length > 0) {
    for (const card of shouldHave) {
      result += `- 🟡 **${card.title}**\n`;
    }
  } else {
    result += `- None identified\n`;
  }

  result += `\n**Could Have** (Nice to have)\n`;
  const couldHave = sorted.filter(c => c.priority === 'low').slice(0, 5);
  if (couldHave.length > 0) {
    for (const card of couldHave) {
      result += `- 🟢 **${card.title}**\n`;
    }
  } else {
    result += `- None identified\n`;
  }

  result += `\n**Won't Have** (Deferred)\n`;
  result += `- Items not yet prioritized can be moved here for future sprints.\n`;

  return result;
}

function suggestNextTask(board) {
  if (!board) return "No active workspace selected.";

  const allCards = getAllCards(board);
  if (allCards.length === 0) return "No tasks available. Create some tasks first!";

  const todoCards = allCards.filter(c => {
    const listId = c.board_list_id;
    const list = getLists(board).find(l => l.id === listId);
    return list && (list.name.toLowerCase().includes('todo') || list.name.toLowerCase().includes('backlog'));
  });

  const candidates = todoCards.length > 0 ? todoCards : allCards;

  // Find highest priority, most urgent task
  const sorted = [...candidates].sort((a, b) => {
    const pOrder = { high: 0, medium: 1, low: 2 };
    const pA = pOrder[a.priority] ?? 99;
    const pB = pOrder[b.priority] ?? 99;
    if (pA !== pB) return pA - pB;
    if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
    return 0;
  });

  const next = sorted[0];
  const list = getLists(board).find(l => l.id === next.board_list_id);

  return `## 💡 Suggested Next Task\n\n` +
    `Based on priority and current workload, I recommend pulling this task into progress:\n\n` +
    `### ➡️ **${next.title}**\n` +
    `- **Priority:** ${next.priority?.toUpperCase() || 'None'}\n` +
    `- **Current Column:** ${list?.name || 'Unknown'}\n` +
    `- **Assignee:** ${next.member?.name || 'Unassigned — assign someone!'}\n` +
    `${next.description ? `- **Description:** ${next.description.substring(0, 100)}${next.description.length > 100 ? '...' : ''}\n` : ''}` +
    `${next.due_date ? `- **Due:** ${new Date(next.due_date).toLocaleDateString()}\n` : ''}` +
    `\n### Why this task?\n` +
    `This task has the highest priority ${next.due_date ? 'and nearest deadline' : ''} among all pending items. ` +
    `Moving it to "In Progress" will unblock downstream work and reduce bottleneck risk.`;
}

function generateEffortEstimation(board, userMessage) {
  const taskMatch = userMessage.match(/[""]([^""]+)[""]|'([^']+)'|estimate\s*(.+)/i);
  const taskName = taskMatch?.[1] || taskMatch?.[2] || taskMatch?.[3] || 'the requested task';

  return `## 📐 Effort Estimation: **${taskName.trim()}**\n\n` +
    `### Fibonacci Scale (1, 2, 3, 5, 8, 13, 21)\n\n` +
    `| Factor | Complexity | Points |\n` +
    `|--------|-----------|-------|\n` +
    `| 💻 Implementation | Moderate | **5** |\n` +
    `| 🗄️ Data Layer | Simple | **2** |\n` +
    `| 🎨 UI/UX | Moderate | **3** |\n` +
    `| 🧪 Testing | Moderate | **3** |\n` +
    `| 📚 Documentation | Simple | **1** |\n\n` +
    `**Total Estimate: ~14 Story Points**\n\n` +
    `### Risk Factors\n` +
    `- Complexity rating: **Medium**\n` +
    `- Dependencies: Check if any blocked tasks exist\n` +
    `- Knowledge gap: Consider pairing if the team is unfamiliar with this area\n\n` +
    `*Recommendation: Size this as a **Large** task (8-13 points). Consider splitting if any sub-component exceeds 5 points.*`;
}

function generateGeneralResponse(board, userMessage) {
  const allCards = getAllCards(board);
  const lists = getLists(board);
  const totalTasks = allCards.length;

  let response = `## 🤖 ForgeFlow AI Copilot\n\n`;

  response += `Thank you for your question about "${userMessage.substring(0, 100)}".\n\n`;

  if (board) {
    response += `### Current Workspace Context: **${board.name}**\n`;
    response += `- **${lists.length}** columns | **${totalTasks}** tasks\n`;

    const highCount = allCards.filter(c => c.priority === 'high').length;
    const overdueCount = allCards.filter(c => c.due_date && new Date(c.due_date) < new Date()).length;
    if (highCount > 0) response += `- 🔴 ${highCount} high-priority items\n`;
    if (overdueCount > 0) response += `- ⚠️ ${overdueCount} overdue tasks\n`;
  }

  response += `\n### How I can help:\n`;
  response += `- 📊 **Summarize workspace** — Get a complete board health report\n`;
  response += `- 📅 **Plan a sprint** — 2-week timeline with phases\n`;
  response += `- 🧩 **Break down features** — Actionable sub-tasks with estimates\n`;
  response += `- 📖 **Generate user stories** — With acceptance criteria\n`;
  response += `- 🎯 **Prioritize backlog** — MoSCoW analysis\n`;
  response += `- 💡 **Suggest next task** — AI-recommended next action\n\n`;

  response += `> 💡 *I'm currently running in offline mode. For full AI-powered responses, start the Laravel backend with \`cd backend && php artisan serve\`*`;

  return response;
}

