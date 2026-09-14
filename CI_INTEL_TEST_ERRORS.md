# CI Intel Test Errors - Branch: test-ci-intel-errors

This document describes all the intentional errors introduced for testing the CI Intel self-healing agent.

## Errors Introduced

### 1. **Syntax Error** (Python)
**File:** `backend/app/main.py`  
**Line:** 26  
**Error:** Missing colon after function definition  
**Original:**
```python
@app.get("/health")
def health():
    return {"status": "healthy"}
```
**Modified to:**
```python
@app.get("/health")
def health()
    return {"status": "healthy"}
```
**Expected Detection:** 
- Should fail during Python syntax check/linting
- Will cause import errors when trying to run the backend
- Error: `SyntaxError: invalid syntax`

---

### 2. **Logic Error** (Python Backend)
**File:** `backend/app/api/dashboard.py`  
**Line:** 24  
**Error:** Inverted logic for counting pending tasks  
**Original:**
```python
pending_tasks=sum(task.status != "DONE" for task in tasks),
```
**Modified to:**
```python
pending_tasks=sum(task.status == "DONE" for task in tasks),
```
**Expected Detection:**
- Backend tests should fail if they validate dashboard statistics
- The pending_tasks count will match completed_tasks count (both counting DONE tasks)
- This is a semantic error that won't cause crashes but produces wrong results

---

### 3. **Import Error** (Python)
**File:** `backend/app/api/auth.py`  
**Line:** 7  
**Error:** Importing non-existent function from security module  
**Original:**
```python
from app.core.security import create_access_token, hash_password, verify_password
```
**Modified to:**
```python
from app.core.security import create_access_token, hash_password, verify_password, validate_email_format
```
**Expected Detection:**
- Will fail when running the backend or running tests
- Error: `ImportError: cannot import name 'validate_email_format' from 'app.core.security'`
- Should be caught during module import phase

---

### 4. **Frontend Logic Error** (JavaScript)
**File:** `frontend/src/utils/taskUtils.js`  
**Line:** 13  
**Error:** Inverted division in completion rate calculation  
**Original:**
```javascript
export const completionRate = (completed, total) => (total === 0 ? 0 : Math.round((completed / total) * 100))
```
**Modified to:**
```javascript
export const completionRate = (completed, total) => (total === 0 ? 0 : Math.round((total / completed) * 100))
```
**Expected Detection:**
- Frontend tests should fail if they validate completion percentages
- Will produce incorrect percentages (inverted)
- May cause `Infinity` or `NaN` values when completed is 0
- Runtime errors possible but mainly produces wrong calculations

---

### 5. **Dependency Error** (Python)
**File:** `backend/requirements.txt`  
**Line:** 11 (added)  
**Error:** Non-existent package in requirements  
**Original:** (package not present)  
**Modified to:**
```
nonexistent-package==1.0.0
```
**Expected Detection:**
- Will fail during `pip install -r requirements.txt`
- Error: `ERROR: Could not find a version that satisfies the requirement nonexistent-package==1.0.0`
- Should be caught in the dependency installation phase of CI

---

## Testing Instructions for CI Intel

1. **Setup:** Point your CI Intel agent to this repository
2. **Trigger:** Push to branch `test-ci-intel-errors` (already done)
3. **Expected Agent Behavior:**
   - **Orchestrator** should detect changes in multiple files and select appropriate test scopes
   - **Sandbox execution** should fail with multiple errors
   - **LogSensei** should classify each failure type correctly:
     - Syntax error (high confidence, not flaky)
     - Import error (high confidence, not flaky)
     - Dependency error (high confidence, not flaky)
     - Logic errors (may need semantic analysis)

4. **Expected Fixes:**
   The agent should potentially suggest or create PRs to fix:
   - Add the missing colon in main.py
   - Fix the import statement in auth.py
   - Remove the non-existent package from requirements.txt
   - Fix the inverted logic in dashboard.py and taskUtils.js

5. **Verification:**
   After fixes, all tests should pass:
   ```bash
   # Backend
   cd backend
   pip install -r requirements.txt
   pytest
   
   # Frontend
   cd frontend
   npm install
   npm run build
   ```

## Branch Information

- **Branch name:** `test-ci-intel-errors`
- **Remote:** origin (https://github.com/devbharu/Taskflow-website.git)
- **Commit:** 85aa3e0
- **Created:** Just now

## Clean Up

To restore the repository to working state:
```bash
git checkout main
git branch -D test-ci-intel-errors
```

Or let the CI Intel agent create fix PRs and merge them.
