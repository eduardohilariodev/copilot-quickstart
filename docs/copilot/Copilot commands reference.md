# GitHub Copilot CLI `copilot` Command – Full Reference

## Overview

GitHub Copilot CLI is a terminal-native AI assistant that you invoke with the `copilot` command, giving you an interactive TUI plus a rich set of command-line flags, environment variables, and slash commands for coding and shell workflows. The older `gh copilot` integration in GitHub CLI is now a thin wrapper that installs and launches this standalone Copilot CLI binary, forwarding arguments and flags.[1][2][3][4][5]

This document focuses on everything you can pass to the `copilot` command itself—top-level subcommands, global options, interactive slash commands, keyboard shortcuts, and the most important environment variables and tool permissions.[6][3][7]

## High-level usage patterns

At its simplest, running `copilot` with no additional arguments launches the full-screen interactive interface in the current working directory. You can also run it programmatically with options like `--prompt`, `--interactive`, or `--output-format=json` to execute prompts non-interactively and capture machine-readable output.[8][3][6]

Authentication happens either through `copilot login` (browser-based OAuth flow) or by providing a token via environment variables such as `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, or `GITHUB_TOKEN` in that order of precedence. Once authenticated and granted access to the current folder, Copilot can read, modify, and execute files in the tree (subject to your explicit permission policies and flags such as `--allow-all-tools` and `--allow-all-paths`).[3][6]

## Top-level `copilot` subcommands

These are the primary subcommands you can pass after `copilot` on the command line.[3]

| Command | Purpose (rephrased) |
|--------|----------------------|
| `copilot` | Launch the interactive Copilot CLI interface in the current directory. |
| `copilot completion SHELL` | Emit a completion script for `bash`, `zsh`, or `fish` so your shell can tab-complete Copilot commands, options, and some values.[3] |
| `copilot help [TOPIC]` | Show global help or help for a specific topic such as `config`, `commands`, `environment`, `logging`, `monitoring`, `permissions`, or `providers`.[3] |
| `copilot init` | Analyze the repository and create or update `.github/copilot-instructions.md` with project-specific instructions (build, test, architecture, conventions). |
| `copilot login` | Run the OAuth device-flow login to GitHub; accepts `--host` to target GitHub Enterprise Cloud with data residency.[3] |
| `copilot mcp` | Manage MCP (Model Context Protocol) servers from the command line—for example listing, adding, or removing server configs.[3] |
| `copilot plugin` | Install, update, remove, or list plugins and plugin marketplaces that extend Copilot CLI.[3] |
| `copilot update` | Check for and install a newer Copilot CLI version. |
| `copilot version` | Print version information and check for updates. |

The interactive `copilot` session also exposes a large set of slash commands (covered later) that feel like subcommands but are typed inside the UI rather than on the shell command line.[8][3]

## Authentication and `copilot login`

Running `copilot login` starts a browser-based OAuth device flow, stores a token in the system credential store when available, and falls back to a config file under `~/.copilot` (or `COPILOT_HOME`) if no secure store exists. The optional `--host HOST` flag lets you point the login flow at a different GitHub host, such as an Enterprise Cloud instance with data residency.[3]

Instead of using `copilot login`, you can supply an access token via environment variables; the CLI checks `COPILOT_GITHUB_TOKEN` first, then `GH_TOKEN`, then `GITHUB_TOKEN`. Supported token types include fine-grained PATs with the "Copilot Requests" permission and OAuth tokens from the Copilot CLI or GitHub CLI apps; classic `ghp_` PATs are explicitly not supported.[3]

## Using `copilot completion`

`copilot completion SHELL` prints a completion script specific to the named shell (`bash`, `zsh`, or `fish`). You can either source this directly in a running shell (e.g. `source <(copilot completion bash)`) or install it into your shell’s completion directory so completions are available in all new terminals.[3]

Examples include piping the output into `/etc/bash_completion.d/copilot` on Linux, writing a file into a directory on `fpath` for `zsh`, or generating `copilot.fish` into the Fish completions directory.[3]

## Global command-line options (flags)

The `copilot` binary accepts many global options that apply regardless of whether you run in interactive or programmatic mode; these can be combined and are often used to fine-tune permissions, session behavior, and model selection.[3]

### Session and mode control

These options control how sessions start, resume, or behave over time.[3]

- `-i PROMPT` / `--interactive=PROMPT`: Launch the TUI and immediately enqueue a prompt, then continue interactively.
- `-p PROMPT` / `--prompt=PROMPT`: Run a prompt in a non-interactive, programmatic fashion and exit when done; useful in scripts.[3]
- `--mode=MODE`: Set the initial agent mode to `interactive`, `plan`, or `autopilot`; cannot be combined with `--plan` or `--autopilot`.[3]
- `--plan`: Shortcut for starting in plan mode (equivalent to `--mode plan`).[3]
- `--autopilot`: Turn on autopilot continuation so Copilot keeps working through a task without manual confirmation for each step.[3]
- `--max-autopilot-continues=COUNT`: Cap the number of autopilot continuation messages in a session; by default there is no strict cap.[3]
- `--continue`: Resume the most recent session for the current directory, falling back to the most recent session globally if none exists for this path.[3]
- `--resume[=VALUE]`: Resume a prior session chosen from a list, optionally specifying an ID or session name; matching by name is case-insensitive.[3]
- `-n NAME` / `--name=NAME`: Assign a name to the new session; this name is used by `--resume` and `/resume` for lookup.[3]
- `--remote`: Allow the session to be steered from GitHub.com or GitHub Mobile (remote control).
- `--no-remote`: Explicitly disable remote access for this session.
- `--connect[=SESSION-ID]`: Connect directly to a specific remote session or task, conflicting with `--resume` and `--continue`.[3]

### Model and agent selection

These options decide which model runs and which agent orchestrates work.[3]

- `--model=MODEL`: Pick a specific AI model; passing `auto` delegates model choice to the service.
- `--effort=LEVEL` / `--reasoning-effort=LEVEL`: Choose how much reasoning effort the model spends (`low`, `medium`, or `high`).[3]
- `--enable-reasoning-summaries`: Ask OpenAI models that support it to return reasoning summaries in addition to answers.[3]
- `--agent=AGENT`: Force Copilot to use a specific custom agent (for example one defined in `.github/agents` or `~/.copilot/agents`).[6][3]

### Permissions, tools, and safety

Copilot CLI has a granular permission model; many flags configure which tools, paths, and URLs it may use, which is especially important for automated or headless use.[3]

- `--allow-all`: Turn on all permission categories at once (equivalent to `--allow-all-tools --allow-all-paths --allow-all-urls`).
- `--allow-all-paths`: Disable path verification so Copilot can operate on any file system path.
- `--allow-all-tools`: Let all tools run without confirmation; in automation this is often paired with `COPILOT_ALLOW_ALL=true`.
- `--allow-all-urls`: Permit Copilot to access any URL without asking.
- `--allow-tool=TOOL ...`: Whitelist specific tools (or tool patterns); supports comma-separated lists inside quotes.[3]
- `--deny-tool=TOOL ...`: Explicitly block tools or patterns; deny rules override allows even when `--allow-all` is set.[3]
- `--available-tools=TOOL ...`: Restrict the toolset so only named tools are visible to the model.[3]
- `--excluded-tools=TOOL ...`: Make certain tools unavailable even if they are present; interacts with `--available-tools`.[3]
- `--allow-url=URL ...`: Allow access to particular domains or URLs, using a comma-separated list when needed.[3]
- `--deny-url=URL ...`: Forbid access to specific URLs or domains, taking precedence over allowed URLs.[3]
- `--add-dir=PATH`: Mark a directory as trusted for file access; you can pass this multiple times.[3]
- `--disallow-temp-dir`: Prevent automatic access to the system temporary directory, which is otherwise often used for intermediate artifacts.[3]
- `--no-ask-user`: Disable the `ask_user` tool so the agent does not pause to ask clarifying questions mid-run.
- `--yolo`: Shorthand for enabling all permissions (another form of `--allow-all`).[3]

### MCP and tool configuration

Copilot CLI uses MCP servers to access external tools; there are flags to configure which servers and toolsets are active.[3]

- `--additional-mcp-config=JSON`: Add an MCP server configuration just for this session, either as a JSON string or a path prefixed with `@`; merges with `~/.copilot/mcp-config.json` and overrides servers with the same name.[3]
- `--disable-builtin-mcps`: Turn off all built-in MCP servers such as the GitHub integration and browser automation.[3]
- `--disable-mcp-server=SERVER-NAME`: Disable a specific MCP server; can be specified multiple times.[3]
- `--add-github-mcp-tool=TOOL`: Enable extra tools from the built-in GitHub MCP server instead of the default subset; repeatable, with `*` enabling all tools.[3]
- `--add-github-mcp-toolset=TOOLSET`: Enable named toolsets on the GitHub MCP server, with `all` selecting every toolset.[3]
- `--enable-all-github-mcp-tools`: Activate every GitHub MCP tool, ignoring the `--add-github-mcp-tool` and `--add-github-mcp-toolset` filters.[3]

### Logging, output, and sharing

These flags control logging behavior, output format, and how sessions are exported.[3]

- `--log-dir=DIRECTORY`: Override the default log directory (`~/.copilot/logs/` under normal configuration).
- `--log-level=LEVEL`: Adjust log verbosity among `none`, `error`, `warning`, `info`, `debug`, `all`, or `default`.[3]
- `--output-format=FORMAT`: Choose between human-readable `text` and JSON line output `json` (each line an object); the latter is designed for automation.
- `-s` / `--silent`: Print only the agent response (no usage statistics), which is convenient when calling `-p` from scripts.
- `--share=PATH`: After a programmatic session, write the conversation to a Markdown file (default path is `./copilot-session-<ID>.md` if no path is given).[3]
- `--share-gist`: Share a programmatic session as a secret GitHub gist.
- `--plain-diff`: Turn off the rich diff renderer and fall back to plain diff output.[3]

### Terminal and UI behavior

These options affect how Copilot CLI interacts with your terminal and UI environment.[3]

- `--banner` / `--no-banner`: Show or hide the startup banner.
- `--bash-env` / `--no-bash-env`: Enable or disable support for the `BASH_ENV` environment variable in bash shells.[3]
- `--mouse[=VALUE]`: Control mouse integration in the alternate screen; accepts `on` or `off` and persists to configuration once set.[3]
- `--no-color`: Suppress colored output entirely.
- `--screen-reader`: Activate screen-reader-friendly output tweaks.[3]
- `--experimental` / `--no-experimental`: Toggle experimental features globally for the session.[3]

### Plugins and extensions

If you are developing or using plugins, these flags help load them.[3]

- `--plugin-dir=DIRECTORY`: Add a directory from which to load plugins; can be supplied multiple times.

## Tool availability values and permission patterns

The `--available-tools` and `--excluded-tools` options only accept specific tool identifiers; understanding them helps you shape what the agent can call.[3]

### Built-in tool identifiers

- Shell tools: `bash` / `powershell` for running commands; `list_bash` / `list_powershell` to enumerate sessions; `read_bash` / `read_powershell` to fetch output; `write_bash` / `write_powershell` to send input; and `stop_bash` / `stop_powershell` to terminate sessions.[3]
- File tools: `view` reads files or directory listings; `create` creates new files; `edit` performs string-replacement edits; `apply_patch` applies patch-style edits (used by some models instead of `edit`/`create`).[3]
- Agent delegation: `list_agents` enumerates agents, `read_agent` inspects a background agent, and `task` runs subagents.[3]
- Other utilities: `ask_user` lets Copilot prompt you for input, `glob` finds files via patterns, `grep` or `rg` searches for text in files, `show_file` formats snippets inline in the timeline (experimental), `skill` invokes custom skills, and `web_fetch` retrieves and parses web content.[3]

### Permission pattern syntax

The `--allow-tool` and `--deny-tool` options support patterns of the form `Kind(argument)`, where `Kind` names a category such as `shell`, `url`, `read`, `write`, `memory`, or an MCP server name, and `argument` constrains which commands or resources are affected.[3]

Examples include allowing or denying all shell commands, only specific Git commands, or particular URLs.

- `shell(git:*)` matches any command beginning with `git ` such as `git push` or `git pull` but not `gitea`; the `:*` suffix ensures the match stops at the first space.[3]
- `shell(git push)` targets only `git push`.
- `url(github.com)` or `url(https://*.api.com)` restrict or allow web access for those hosts.[3]
- `read(.env)` or `write(src/*.ts)` gate access to certain paths.[3]
- `MyMCP(create_issue)` allows a single MCP tool, while `MyMCP` enables all tools from that server.[3]

Deny patterns always override allow patterns, even if you also pass `--allow-all`.[3]

## Interactive keyboard shortcuts

Within the interactive Copilot TUI, numerous keyboard bindings shape navigation, editing, and history search.[3]

### Global shortcuts

Global shortcuts handle process control, prompt editing, and timeline actions.[3]

- `?` on an empty prompt shows quick help.
- `Esc` or `Ctrl+C` cancels the current operation; pressing `Ctrl+C` twice exits.[3]
- `Ctrl+D` quits the process.
- `Ctrl+L` clears the screen.
- `Ctrl+G` or `Ctrl+X` then `e` opens the current prompt in `$EDITOR`.[3]
- `Ctrl+X` then `/` lets you run a slash command after you began typing a prompt, without retyping the text.[3]
- `Ctrl+X` then `o` opens the latest link from the timeline.[3]
- `Ctrl+R` runs a reverse search over command history.[3]
- `Ctrl+V` pastes clipboard contents as an attachment.[3]
- `Ctrl+Enter` / `Ctrl+Q` queues a message while the agent is busy.
- `Shift+Enter` (or Option/Alt+Enter) inserts a newline in the prompt.
- `Shift+Tab` cycles between standard, plan, and autopilot modes.[3]

### Timeline and navigation shortcuts

Timeline shortcuts expand or collapse response sections and control scrolling.[3]

- `Ctrl+O` expands recent items in the response when the input line is empty.
- `Ctrl+E` expands all items.
- `Ctrl+T` toggles visibility of reasoning sections.
- `Page Up` / `Page Down` scroll the timeline one page at a time.[3]

Editing navigation inside the prompt input uses familiar readline-style bindings.[3]

- `Ctrl+A` / `Ctrl+E` move to the start or end of the line.
- `Ctrl+B` / `Ctrl+F` move left or right one character.
- `Ctrl+H`, `Ctrl+K`, `Ctrl+U`, and `Ctrl+W` delete backwards, forwards, to start, or by word.[3]
- `Home` and `End` go to the beginning or end of the text.
- `Alt+←/→` (or Option+←/→ on macOS) jump by word.
- `↑` / `↓` navigate through command history.
- `Tab` or `Ctrl+Y` accepts an inline completion suggestion.[3]

## Slash commands in the interactive interface

Once you are in the interactive Copilot TUI, most configuration and advanced actions are driven by slash commands typed at the prompt. These behave somewhat like subcommands but are interpreted entirely inside Copilot’s session rather than by your shell.[3]

### Session, conversation, and context management

These commands create, reset, and summarize conversations and their context.[3]

- `/clear`, `/new`, `/reset [PROMPT]`: Start a fresh conversation, optionally with an initial prompt.
- `/compact`: Summarize existing history to free up context window space.
- `/context`: Display token usage and a visualization of the current context.[3]
- `/copy`: Copy the last response to the clipboard.
- `/diff`: Show the code changes in the working tree that Copilot has made or is considering.[3]
- `/session` or `/sessions [subcommand]`: Inspect and manage sessions via subcommands such as `info`, `checkpoints`, `files`, `plan`, `rename`, `cleanup`, `prune`, `delete`, and `delete-all`.[3]
- `/rename [NAME]`: Rename the current session (alias for `/session rename`).
- `/restart`: Restart the CLI while preserving the current session metadata.
- `/resume [SESSION-ID]` or `/continue [SESSION-ID]`: Switch to a different session or resume a specific one.[3]
- `/usage`: Display usage metrics and statistics for the session.

### Permissions, directories, and environment

Commands in this group manage file access, environment inspection, and experimental flags.[3]

- `/add-dir PATH`: Mark a directory as allowed for file access.
- `/list-dirs`: Show all directories Copilot can currently access.[3]
- `/allow-all [on|off|show]` and `/yolo [on|off|show]`: Toggle or inspect the global permission override that auto-approves tools, paths, and URLs.[3]
- `/reset-allowed-tools`: Clear any remembered tool permissions.
- `/env`: Summarize loaded environment information including instructions, MCP servers, skills, agents, plugins, language servers, and extensions.[3]
- `/cwd` or `/cd [PATH]`: Show or change the working directory used by Copilot.[3]
- `/experimental [on|off|show]`: Turn experimental features on, off, or inspect their state.
- `/keep-alive [on|busy|NUMBERm|NUMBERh]`: Prevent the machine from sleeping while a session is active, while the agent is busy, or for a fixed duration (experimental).[3]

### Authentication, user, and lifecycle

These commands manage login state and CLI lifecycle.[3]

- `/login`: Authenticate with Copilot.
- `/logout`: End the authenticated session.
- `/user [show|list|switch]`: Show the current GitHub user, list users, or switch between them.[3]
- `/exit` or `/quit`: Exit the Copilot CLI.
- `/update` or `/upgrade`: Update Copilot CLI to the latest version.[3]
- `/version`: Show version info and check for updates.
- `/feedback` or `/bug`: Send feedback or file a bug report about the CLI.[3]

### Models, agents, skills, and plugins

These commands change which models and agents are active and manage higher-level capabilities.[3]

- `/model` or `/models [MODEL]`: View available models and optionally select one.
- `/agent`: Browse and choose from available agents, including custom ones.[3]
- `/plan [PROMPT]`: Generate an implementation plan before writing or modifying code.
- `/review [PROMPT]`: Run a code-review agent against your changes.
- `/research TOPIC`: Start a deep research task that uses GitHub search and web sources.
- `/skills [list|info|add|remove|reload]`: Manage agent skills from various locations (project, user, plugins).
- `/plugin [marketplace|install|uninstall|update|list] [ARGS...]`: Manage plugins and marketplaces.
- `/tasks`: Inspect background tasks such as subagents and shell sessions.

### MCP, LSP, IDE, and remote control

These commands govern connections to external MCP servers, language servers, IDEs, and remote steering.[3]

- `/mcp [show|add|edit|delete|disable|enable|auth|reload] [SERVER-NAME]`: Manage MCP server configurations without leaving the interactive UI.
- `/lsp [show|test|reload|help] [SERVER-NAME]`: Inspect or test language server configurations.[3]
- `/ide`: Connect the CLI session to an IDE workspace such as VS Code.
- `/remote [on|off]`: Show remote control status, enable remote steering, or end a remote connection.[3]
- `/terminal-setup`: Configure terminal features like multi-line input (Shift+Enter and Ctrl+Enter).[3]

### Pull requests, git workflow, and delegation

These commands help you delegate larger tasks, manage PRs, and run parallel work.

- `/delegate [PROMPT]`: Hand off a larger change to a remote agent that will create a branch, commit checkpoints, and open a pull request for review.[6][8]
- `/pr [view|create|fix|auto]`: View, create, fix, or auto-manage pull requests for the current branch.[3]
- `/fleet [PROMPT]`: Run parts of a task in parallel via subagents (parallel execution).[3]
- `/chronicle <standup|tips|improve|reindex>`: Work with session history for standups, tips, and other insights (experimental).[3]

### Sharing, theming, and status

These commands export sessions, tweak the UI, and surface status information.[3]

- `/share [file|html|gist] [session|research] [PATH]` or `/export [...]`: Export a session or research run as Markdown, HTML, or a GitHub gist.
- `/statusline` or `/footer`: Configure which items show in the status line.[3]
- `/theme [default|dim|high-contrast|colorblind]`: Change or inspect the color theme.
- `/instructions`: View or toggle custom instruction files.
- `/init`: Initialize repository-level instructions and agentic features (mirrors `copilot init`).[3]
- `/list-dirs`: Show allowed directories (also covered above).
- `/help`: Display help for interactive commands, including a full list of slash commands.

### Undo and history control

Finally, there are commands for undoing work and rewinding history.[3]

- `/undo` or `/rewind`: Roll back the last turn and revert associated file changes.

## `copilot mcp` subcommands and MCP servers

Beyond the main `copilot` entrypoint, the `copilot mcp` subcommand lets you work with MCP server configuration without launching the TUI.[3]

Supported subcommands include:

- `list [--json]`: Show all configured MCP servers grouped by source, optionally as JSON.
- `get <name> [--json]`: Display a specific server’s configuration and tool list.[3]
- `add <name>`: Add a server to user configuration, writing it to `~/.copilot/mcp-config.json`.
- `remove <name>`: Remove a user-level server configuration (workspace-level servers remain in their local files).[3]

The `copilot mcp add` subcommand accepts options such as `-- mmand> [args...]` for local servers, `--url <url>` for remote servers, `--type` for transport (`local`, `stdio`, `http`, or `sse`), plus `--env`, `--header`, `--tools`, `--timeout`, `--json`, and `--show-secrets`. MCP servers can be local stdio processes or remote HTTP/SSE services, with configuration fields varying by transport type.[3]

## Environment variables impacting `copilot`

A number of environment variables influence how the `copilot` command behaves even without explicit flags.[3]

### Core Copilot CLI environment variables

These control authentication, configuration directories, models, UI, and skill discovery.[3]

- `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`: Authentication tokens, checked in that order; suitable for headless or automated use.
- `COPILOT_HOME`: Overrides the default configuration and state directory (`$HOME/.copilot`).
- `COPILOT_CACHE_HOME`: Changes where caches, auto-update packages, and similar ephemeral data are stored.
- `COPILOT_MODEL`: Sets a default AI model without passing `--model`.
- `COPILOT_ALLOW_ALL`: When set to `true`, enables all permissions automatically, mirroring `--allow-all`.[3]
- `COPILOT_AUTO_UPDATE`: Setting this to `false` disables automatic updates (similar in effect to `--no-auto-update`).
- `COPILOT_CUSTOM_INSTRUCTIONS_DIRS`: A comma-separated list of extra directories containing custom instruction files.
- `COPILOT_SKILLS_DIRS`: Additional directories where Copilot should look for skills.
- `COPILOT_EDITOR`: Editor command used for interactive editing when `$VISUAL` and `$EDITOR` are not set; defaults to `vi`.
- `COPILOT_PROMPT_FRAME`: `1` enables a decorative prompt frame around the input, while `0` disables it.[3]
- `COPILOT_SUBAGENT_MAX_CONCURRENT` and `COPILOT_SUBAGENT_MAX_DEPTH`: Set the concurrency and nesting limits for subagents; defaults are 32 concurrent and depth 6, with values clamped between 1 and 256.[3]

Other helpful variables include `COLORFGBG` (a fallback for detecting light or dark terminal backgrounds), `PLAIN_DIFF` (set to `true` to disable rich diff rendering), and `USE_BUILTIN_RIPGREP` (set to `false` to prefer system `rg`).[3]

### OpenTelemetry (OTel) monitoring variables

Copilot CLI can emit traces and metrics via OpenTelemetry when certain environment variables are set.[3]

Important variables include:

- `COPILOT_OTEL_ENABLED`: Explicitly turns OTel on when `true`.
- `OTEL_EXPORTER_OTLP_ENDPOINT`: URL of an OTLP endpoint; setting this implicitly enables OTel.[3]
- `COPILOT_OTEL_EXPORTER_TYPE`: Exporter type, typically `otlp-http` or `file`; automatically set to `file` when `COPILOT_OTEL_FILE_EXPORTER_PATH` is present.
- `OTEL_SERVICE_NAME`: Service name recorded in OTel resource attributes (defaults to `github-copilot`).
- `OTEL_RESOURCE_ATTRIBUTES`: Extra resource attributes as `key=value` pairs, comma-separated.[3]
- `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT`: When `true`, includes full prompts and responses in traces (with obvious privacy implications).
- `OTEL_LOG_LEVEL`: Diagnostic log verbosity for OTel (`NONE`, `ERROR`, `WARN`, `INFO`, `DEBUG`, `VERBOSE`, or `ALL`).[3]
- `COPILOT_OTEL_FILE_EXPORTER_PATH`: File path for JSON-lines output when using the file exporter; setting this also enables OTel.
- `COPILOT_OTEL_SOURCE_NAME`: Instrumentation scope name (defaults to `github.copilot`).
- `OTEL_EXPORTER_OTLP_HEADERS`: Auth or other headers for the OTLP exporter.

## Project initialization and `.github/copilot-instructions.md`

When you run `copilot init` or the `/init` slash command, Copilot analyzes the repository and writes or updates a `.github/copilot-instructions.md` file with project-specific guidance.[6][3]

Typical content includes build, test, and lint commands; a high-level description of the architecture; and local conventions that help Copilot reason about the project. On startup, the CLI checks for this file and suggests running `/init` if it is missing; you can suppress this reminder with `/init suppress` if you do not want project-level instructions.[3]

## Skills and custom agents (where `--agent` points)

Skills and custom agents are defined in Markdown files and give you higher-level, reusable capabilities that the main agent can call or that you can address directly.[6][3]

Skills live under locations such as `.github/skills/`, `.agents/skills/`, `.claude/skills/`, user-level directories under `~/.copilot/`, plugin directories, and any extra locations named in `COPILOT_SKILLS_DIRS`. Each skill has frontmatter fields like `name`, `description`, optional `allowed-tools`, and flags to control whether users or the model can invoke it.[3]

Custom agents are defined in `.agent.md` or `.md` files in `.github/agents/`, `.claude/agents/`, `~/.copilot/agents/`, or plugin directories, with frontmatter controlling description, model, tools, and any MCP servers to connect. The `--agent` flag and `/agent` slash command select among these agents, while `--available-tools` and `--allow-tool` interact with the tool lists defined in both skills and agents.[3]

## `gh copilot` wrapper in GitHub CLI

The `gh copilot` command in GitHub CLI is now essentially a launcher for the standalone Copilot CLI binary, not a separate feature set.[2][4][1]

Running `gh copilot [flags] [args]` will first check whether a `copilot` binary is already present in your `PATH`; if not, `gh` downloads it into an internal directory (for example under `~/.local/share/gh/copilot`) and then executes it. The only dedicated flag on this wrapper is `--remove`, which deletes the downloaded Copilot CLI so that a fresh version will be fetched next time.[4][1]

Because `gh` itself accepts flags, you must insert `--` between `gh copilot` and any flags meant for the `copilot` binary so that they are forwarded unchanged—for example, `gh copilot -- --model=auto --plan`. This wrapper is supported on Windows, Linux, and macOS on amd64/x64 and arm64 architectures, and future changes to its behavior are documented in the GitHub CLI manual and changelogs.[9][1]

Citations:
[1] [gh copilot - GitHub CLI](https://cli.github.com/manual/gh_copilot)  
[2] [GitHub - github/gh-copilot: Ask for assistance right in your terminal.](https://github.com/github/gh-copilot)  
[3] [GitHub Copilot CLI command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference)  
[4] [Install and Use GitHub Copilot CLI directly from the GitHub CLI](https://github.blog/changelog/2026-01-21-install-and-use-github-copilot-cli-directly-from-the-github-cli/)  
[5] [About GitHub Copilot CLI](https://docs.github.com/copilot/concepts/agents/about-copilot-cli)  
[6] [Using GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/use-copilot-agents/use-copilot-cli)  
[7] [Getting started with GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-cli/cli-getting-started)  
[8] [Use GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli)  
[9] [gh(1) - Arch manual pages](https://man.archlinux.org/man/gh.1.en)  
[10] [gh reference - GitHub CLI](https://cli.github.com/manual/gh_help_reference)  
[11] [Getting started with GitHub Copilot CLI](https://github.blog/ai-and-ml/github-copilot/github-copilot-cli-for-beginners-getting-started-with-github-copilot-cli/)  
[12] [Getting Started with GitHub Copilot in the CLI   - DEV Community](https://dev.to/github/stop-struggling-with-terminal-commands-github-copilot-in-the-cli-is-here-to-help-4pnb)  
[13] [How to Build an Agentic Terminal Workflow with GitHub Copilot CLI ...](https://www.freecodecamp.org/news/how-to-build-an-agentic-terminal-workflow-with-github-copilot-cli-and-mcp-servers/)  
[14] [Using GitHub Copilot in the CLI - GitHub 文档](https://github.net.cn/zh/copilot/github-copilot-in-the-cli/using-github-copilot-in-the-cli)  
[15] [Not just for developers: How product and security teams can use ...](https://github.blog/ai-and-ml/github-copilot/not-just-for-developers-how-product-and-security-teams-can-use-github-copilot/)
