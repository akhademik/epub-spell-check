\# AI CLI Development Instructions



\## Project Setup Requirements



\### Tech Stack

\- \*\*Runtime:\*\* Bun

\- \*\*Language:\*\* TypeScript

\- \*\*Build Tool:\*\* Vite

\- \*\*Styling:\*\* Tailwind CSS

\- \*\*Framework:\*\* None (vanilla TypeScript)

\- \*\*Hot Reload:\*\* Required for development



\### Code Style \& Conventions



\#### Naming Conventions

\- \*\*Files/folders:\*\* `kebab-case`

&nbsp; - Examples: `user-service.ts`, `api-client/`

\- \*\*Variables/functions:\*\* `camelCase`

&nbsp; - Examples: `userName`, `getUserData()`

\- \*\*Types/interfaces:\*\* `PascalCase`

&nbsp; - Examples: `UserProfile`, `ApiResponse`

\- \*\*Constants:\*\* `UPPER\_SNAKE\_CASE`

&nbsp; - Examples: `API\_BASE\_URL`, `MAX\_RETRY\_COUNT`



\#### Project Structure

\- \*\*Shared utilities:\*\* Place in `utils/` directory

\- \*\*Shared types:\*\* Place in `types/` directory

\- \*\*Logging:\*\* Use `Logger` class/utility, NOT `console.log`



\### Development Commands

\- \*\*Start dev server:\*\* `bun run dev`

\- \*\*Run linting:\*\* `bun run lint`



---



\## Development Workflow



\### Step-by-Step Process



When I provide a task or request:



1\. \*\*Break down the task\*\* into discrete steps

2\. \*\*Execute ONE step at a time\*\*

3\. \*\*Wait for my review/approval\*\* before proceeding to the next step

4\. \*\*Only mark as "done"\*\* after:

&nbsp;  - Syntax validation passes

&nbsp;  - ESLint checks pass

&nbsp;  - TypeScript checks pass

&nbsp;  - All code quality checks succeed



\### Development Server Guidelines



When `bun run dev` is needed:

\- \*\*Do NOT run it automatically\*\*

\- \*\*Ask me to run it\*\* with clear instructions

\- \*\*Provide the exact command\*\* to execute

\- \*\*If errors occur:\*\*

&nbsp; - Ask me to share the error logs

&nbsp; - Analyze the logs I provide

&nbsp; - Suggest fixes based on the actual error output



\### Quality Checks Before Completion



Before confirming any step as complete, verify:

\- \[ ] TypeScript compilation succeeds (no type errors)

\- \[ ] ESLint passes (no linting errors)

\- \[ ] Syntax is valid

\- \[ ] Code follows naming conventions

\- \[ ] No `console.log` statements (use `Logger` instead)

\- \[ ] Files/folders use `kebab-case`

\- \[ ] Shared code is in appropriate directories (`utils/`, `types/`)



---



\## Example Workflow



\*\*Request:\*\* "Create a user authentication service"



\*\*AI Response:\*\*

```

I'll create a user authentication service. Here's my plan:



Step 1: Create the auth service file structure

Step 2: Define TypeScript types for auth

Step 3: Implement the auth service logic

Step 4: Add logging with Logger utility

Step 5: Run linting and type checks



Let me start with Step 1:

\[Implementation details]



Please review this structure. Once approved, I'll proceed to Step 2.

```



\*\*After each step:\*\*

\- Wait for approval

\- Address any feedback

\- Only proceed when explicitly confirmed



\*\*Before final completion:\*\*

\- Run `bun run lint`

\- Check TypeScript compilation

\- Confirm all quality checks pass

\- Only then mark as ✅ Done



---



\## Important Reminders



\- ⚠️ \*\*No frameworks\*\* (React, Vue, Svelte, etc.)

\- ⚠️ \*\*Use Logger, not console.log\*\*

\- ⚠️ \*\*One step at a time\*\* - wait for approval

\- ⚠️ \*\*Quality checks required\*\* before completion

\- ⚠️ \*\*Ask user to run dev server\*\* - don't assume it's running

