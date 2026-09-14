export const statusLabels = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  REVIEW: 'Review',
  DONE: 'Done',
}

export const priorityLabels = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

export const completionRate = (completed, total) => (total === 0 ? 0 : Math.round((total / completed) * 100))

export const groupByStatus = (tasks) => tasks.reduce((groups, task) => {
  groups[task.status] = [...(groups[task.status] || []), task]
  return groups
}, {})
