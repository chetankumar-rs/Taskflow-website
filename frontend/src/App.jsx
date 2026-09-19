import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { BarChart3, CheckCircle2, ChevronDown, CirclePlus, ClipboardList, FolderKanban, LayoutDashboard, LogOut, Menu, Moon, Plus, Search, Settings2, Sparkles, Sun, UserRound, X } from 'lucide-react'
import { authApi, projectApi, taskApi } from './services/api'
import { useTaskflowData } from './hooks/useTaskflowData'
import { completionRate, priorityLabels, statusLabels } from './utils/taskUtils'
import { demoUser } from './utils/demoData'
import { useTheme } from './context/ThemeContext'

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'All tasks', icon: ClipboardList },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('taskflow_user') || 'null'))
  const [mobileNav, setMobileNav] = useState(false)
  const data = useTaskflowData()
  const { theme, toggleTheme } = useTheme()

  if (window.location.pathname === '/health') return <Health />

  const logout = () => {
    localStorage.removeItem('taskflow_token')
    localStorage.removeItem('taskflow_user')
    setUser(null)
  }

  return user ? (
    <div className="app-shell">
      <Sidebar user={user} logout={logout} mobileNav={mobileNav} closeMobile={() => setMobileNav(false)} />
      <main className="main-content">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="crumb"><span>Workspace</span><strong>/</strong><span className="crumb-current">My flow</span></div>
          <div className="topbar-actions"><button className="icon-button" aria-label="Search"><Search size={18} /></button><button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button><div className="avatar">{user.name?.slice(0, 1).toUpperCase()}</div></div>
        </header>
        {data.usingDemo && <div className="demo-banner"><Sparkles size={15} /> Showing a sample workspace. Start the API to sync your own tasks.</div>}
        <Routes>
          <Route path="/dashboard" element={<Dashboard data={data} user={user} />} />
          <Route path="/projects" element={<Projects data={data} />} />
          <Route path="/projects/:projectId" element={<ProjectDetails data={data} />} />
          <Route path="/tasks" element={<Tasks data={data} />} />
          <Route path="/profile" element={<Profile user={user} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  ) : <Auth onAuthenticated={setUser} />
}

function Health() {
  const [status, setStatus] = useState('Checking...')

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((result) => setStatus(result.status || 'healthy'))
      .catch(() => setStatus('unavailable'))
  }, [])

  return <main className="health-page"><div className="health-card"><span className="eyebrow">TaskFlow API</span><h1>Health check</h1><p className={status === 'healthy' ? 'health-ok' : ''}>{status}</p></div></main>
}

function Sidebar({ user, logout, mobileNav, closeMobile }) {
  return <>
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Sparkles size={17} /></div><span>taskflow</span></div>
      <div className="workspace-switcher"><div className="workspace-dot">TF</div><div><strong>Acme workspace</strong><small>Personal space</small></div><ChevronDown size={15} /></div>
      <nav className="nav-list">{navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={closeMobile} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-foot"><NavLink to="/profile" className="nav-link"><Settings2 size={18} /><span>Settings</span></NavLink><div className="user-row"><div className="avatar avatar-small">{user.name?.slice(0, 1).toUpperCase()}</div><div><strong>{user.name}</strong><small>{user.email}</small></div><button className="plain-button" onClick={logout} title="Log out"><LogOut size={16} /></button></div></div>
    </aside>
    {mobileNav && <button className="mobile-scrim" onClick={closeMobile} aria-label="Close navigation"><X size={1} /></button>}
  </>
}

function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>
}

function Dashboard({ data, user }) {
  const { dashboard, tasks, projects } = data
  const stats = [{ label: 'Projects', value: dashboard?.total_projects ?? 0, note: 'Across your workspace', tone: 'mint' }, { label: 'Open tasks', value: dashboard?.pending_tasks ?? 0, note: 'Keep the momentum', tone: 'peach' }, { label: 'Completed', value: dashboard?.completed_tasks ?? 0, note: `${completionRate(dashboard?.completed_tasks ?? 0, dashboard?.total_tasks ?? 0)}% of total`, tone: 'lavender' }, { label: 'Total tasks', value: dashboard?.total_tasks ?? 0, note: 'All active work', tone: 'yellow' }]
  return <div className="page"><PageHeader eyebrow="Monday, September 12" title={`Good morning, ${user.name?.split(' ')[0] || 'there'}.`} description="A clear view of what is moving, what needs attention, and what is next." action={<Link to="/tasks" className="button button-dark"><Plus size={17} /> New task</Link>} /><div className="stats-grid">{stats.map((stat) => <div className={`stat-card ${stat.tone}`} key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.note}</small></div>)}</div><div className="dashboard-grid"><section className="panel panel-chart"><div className="panel-heading"><div><span className="eyebrow">Flow overview</span><h2>Work by status</h2></div><span className="period-pill">This month <ChevronDown size={14} /></span></div><StatusBars dashboard={dashboard} /></section><section className="panel"><div className="panel-heading"><div><span className="eyebrow">Focus list</span><h2>Recent tasks</h2></div><Link to="/tasks" className="text-link">View all</Link></div><TaskList tasks={(dashboard?.recent_tasks?.length ? dashboard.recent_tasks : tasks).slice(0, 4)} /></section></div><section className="panel projects-panel"><div className="panel-heading"><div><span className="eyebrow">Your spaces</span><h2>Projects in motion</h2></div><Link to="/projects" className="text-link">See projects</Link></div><div className="project-mini-grid">{projects.slice(0, 3).map((project) => <ProjectMini key={project.id} project={project} />)}</div></section></div>
}

function StatusBars({ dashboard }) {
  const statuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']; const values = statuses.map((status) => dashboard?.tasks_by_status?.[status] || 0); const max = Math.max(...values, 1)
  return <div className="status-bars">{statuses.map((status, index) => <div className="bar-row" key={status}><span>{statusLabels[status]}</span><div className="bar-track"><div className={`bar-fill fill-${index}`} style={{ width: `${Math.max((values[index] / max) * 100, values[index] ? 8 : 0)}%` }} /></div><strong>{values[index]}</strong></div>)}</div>
}

function TaskList({ tasks }) { return <div className="task-list">{tasks.map((task) => <div className="task-list-item" key={task.id}><span className={`task-status-dot dot-${task.status}`} /><div><strong>{task.title}</strong><small>{task.project_name || 'Workspace'} · {priorityLabels[task.priority] || task.priority}</small></div><span className={`priority priority-${task.priority}`}>{task.priority}</span></div>)}{!tasks.length && <EmptyState label="No recent tasks yet" />}</div> }
function ProjectMini({ project }) { return <Link className="project-mini" to={`/projects/${project.id}`}><div className="project-icon"><FolderKanban size={19} /></div><div><strong>{project.name}</strong><small>{project.task_count || 0} tasks · {project.status.toLowerCase()}</small></div><ChevronDown size={16} className="rotate-chevron" /></Link> }

function Projects({ data }) {
  const [showForm, setShowForm] = useState(false); const [name, setName] = useState(''); const [description, setDescription] = useState('')
  const addProject = async (event) => { event.preventDefault(); if (!name.trim()) return; if (!data.usingDemo) await projectApi.create({ name, description }); data.refresh(); setName(''); setDescription(''); setShowForm(false) }
  return <div className="page"><PageHeader eyebrow="Workspace" title="Projects" description="The bigger picture, broken into meaningful pieces." action={<button className="button button-dark" onClick={() => setShowForm(!showForm)}><CirclePlus size={17} /> New project</button>} />{showForm && <form className="inline-form" onSubmit={addProject}><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Project name" autoFocus /><input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A short description" /><button className="button button-dark">Create project</button></form>}<div className="projects-grid">{data.projects.map((project) => <Link to={`/projects/${project.id}`} className="project-card" key={project.id}><div className="project-card-top"><div className="project-icon large"><FolderKanban size={21} /></div><span className={`status-chip ${project.status.toLowerCase()}`}>{project.status}</span></div><h2>{project.name}</h2><p>{project.description || 'No description yet.'}</p><div className="project-card-foot"><span>{project.task_count || 0} tasks</span><span className="text-link">Open project <ChevronDown size={14} className="rotate-chevron" /></span></div></Link>)}</div>{!data.projects.length && <EmptyState label="No projects yet" />}</div>
}

function ProjectDetails({ data }) { const { projectId } = useParams(); const project = data.projects.find((item) => String(item.id) === projectId); const tasks = data.tasks.filter((task) => String(task.project_id) === projectId); return <div className="page"><Link to="/projects" className="back-link">← All projects</Link><PageHeader eyebrow="Project view" title={project?.name || 'Project'} description={project?.description} action={<button className="button button-dark"><Plus size={17} /> Add task</button>} /><Kanban tasks={tasks} onStatusChange={data.changeTaskStatus} /></div> }

function Tasks({ data }) { return <div className="page"><PageHeader eyebrow="Execution" title="All tasks" description="One calm list for everything that still needs doing." action={<button className="button button-dark"><Plus size={17} /> New task</button>} /><div className="toolbar"><div className="search-field"><Search size={16} /><input placeholder="Search tasks" /></div><span className="toolbar-count">{data.tasks.length} tasks</span></div><Kanban tasks={data.tasks} onStatusChange={data.changeTaskStatus} /></div> }

function Kanban({ tasks, onStatusChange }) { const statuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']; return <div className="kanban">{statuses.map((status) => <section className="kanban-column" key={status}><div className="column-heading"><div><span className={`task-status-dot dot-${status}`} /><strong>{statusLabels[status]}</strong></div><span>{tasks.filter((task) => task.status === status).length}</span></div><div className="kanban-cards">{tasks.filter((task) => task.status === status).map((task) => <article className="kanban-card" key={task.id}><div className="card-meta"><span className={`priority priority-${task.priority}`}>{task.priority}</span><button className="plain-button" title="Change status"><ChevronDown size={15} /></button></div><h3>{task.title}</h3><small>{task.project_name || 'Workspace'}</small><select value={task.status} onChange={(event) => onStatusChange(task.id, event.target.value)} aria-label={`Status for ${task.title}`}>{statuses.map((option) => <option key={option} value={option}>{statusLabels[option]}</option>)}</select></article>)}{!tasks.filter((task) => task.status === status).length && <div className="column-empty">No tasks here</div>}</div></section>)}</div> }

function Profile({ user }) { return <div className="page"><PageHeader eyebrow="Your account" title="Profile" description="The details attached to your TaskFlow workspace." /><section className="panel profile-panel"><div className="profile-avatar">{user.name?.slice(0, 1).toUpperCase()}</div><div><span className="eyebrow">Member</span><h2>{user.name}</h2><p>{user.email}</p></div></section></div> }
function EmptyState({ label }) { return <div className="empty-state"><BarChart3 size={21} /><span>{label}</span></div> }

function Auth({ onAuthenticated }) { const [mode, setMode] = useState('login'); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const navigate = useNavigate();
  const submit = async (event) => { event.preventDefault(); setError(''); if (password.length < 8) { setError('Use at least 8 characters for your password.'); return } try { const response = mode === 'login' ? await authApi.login({ email, password }) : await authApi.register({ name, email, password }); localStorage.setItem('taskflow_token', response.data.access_token); localStorage.setItem('taskflow_user', JSON.stringify(response.data.user)); onAuthenticated(response.data.user); navigate('/dashboard') } catch { const fallback = { ...demoUser, name: name || demoUser.name, email: email || demoUser.email }; localStorage.setItem('taskflow_token', 'demo-token'); localStorage.setItem('taskflow_user', JSON.stringify(fallback)); onAuthenticated(fallback); navigate('/dashboard') } }
  return <div className="auth-page"><div className="auth-art"><div className="art-brand"><div className="brand-mark"><Sparkles size={17} /></div>taskflow</div><div className="art-copy"><span className="eyebrow">A better place for work</span><h1>Make progress visible.</h1><p>Bring projects, priorities, and people into one thoughtful workspace.</p></div><div className="art-note"><CheckCircle2 size={17} /> Designed for teams who care about the details.</div></div><div className="auth-panel"><div className="auth-form-wrap"><div className="mobile-brand"><div className="brand-mark"><Sparkles size={17} /></div>taskflow</div><span className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Start your workspace'}</span><h2>{mode === 'login' ? 'Sign in to TaskFlow' : 'Create your account'}</h2><p className="auth-subtitle">{mode === 'login' ? 'Pick up where you left off.' : 'A clear place for your next good idea.'}</p><form onSubmit={submit}>{mode === 'register' && <label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Morgan" required /></label>}<label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required /></label>{error && <div className="form-error">{error}</div>}<button className="button button-dark full-button">{mode === 'login' ? 'Sign in' : 'Create account'} <span>→</span></button></form><p className="auth-switch">{mode === 'login' ? 'New to TaskFlow?' : 'Already have an account?'} <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p></div></div></div>
}

export default App
