# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- **Build**: `pnpm build` - Compiles TypeScript and copies markdown files to dist/
- **Lint**: `pnpm lint` - Runs TypeScript type checking and Biome linting
- **Test**: `pnpm test` - Runs tests using Vitest
- **Demo**: `pnpm demo` - Runs the cucumber-ai CLI demo
- **Run single test**: Use Vitest patterns like `pnpm test -- step-parser` to run specific test files

## Project Architecture

Cucumber-ai is an AI-powered testing framework that extends Cucumber with natural language processing capabilities. The architecture follows a multi-agent pattern where different agents handle specific aspects of test execution.

### Core Components

**Agent System (`src/agents.ts`)**:
- Central orchestrator managing multiple specialized agents
- **StepAgent**: Executes Gherkin step definitions written in natural language
- **ActionAgent**: Handles low-level automation actions (browser interactions, assertions)
- **ConceptAgent**: Manages reusable page objects and behaviors
- **BrowserAgent**: Controls browser automation via Playwright/Midscene
- **UIAgent**: Handles visual AI interactions using Vision Language Models
- **DataAgent**: Manages test data preparation via MCP servers
- **TextAgent**: Processes natural language instructions

**World Context (`src/agent.world.ts`)**:
- Extends Cucumber's World class with AI capabilities
- Provides unified interface for step execution and agent orchestration
- Manages test lifecycle and cleanup (screenshots, videos on failure)

**Loaders (`src/loaders/`)**:
- **step-loader.ts**: Loads `.steps` files containing natural language step definitions
- **concept-loader.ts**: Loads `.concept` files defining reusable page objects
- **hook-loader.ts**: Loads `.hooks` files for test setup/teardown
- **definition-loader.ts**: Generic loader for processing custom file formats
- Parsers for converting natural language syntax to executable actions

### File Structure Conventions

The framework expects a specific project structure:

```
features/
├── concepts/     # Reusable page objects (.concept files)
├── steps/        # Step definitions (.steps files)
├── hooks/        # Setup/teardown logic (.hooks files)
└── *.feature     # Gherkin feature files
```

### Natural Language Syntax

**Step Definitions (.steps)**:
```
Step: I search for "{{name}}"
    MapPage: search for a location "[[name]]"
```
- `{{variable}}`: Captures from Gherkin steps
- `[[variable]]`: Passes to concept behaviors
- `ConceptName: behavior`: References concept behaviors

**Concepts (.concept)**:
```
Concept: MapPage
    Behavior: search for a location "{{name}}"
        aiInput([[name]]): the search box
        aiTap: the search button
```

**Action Types**:
- `ai: prompt` - General AI-powered actions
- `aiInput(text): element` - Type text into elements
- `aiTap: element` - Click elements
- `aiWaitFor: condition` - Wait for conditions
- `aiAssert: condition` - Verify conditions
- `browser: action` - Browser-level operations
- `data: action` - Data preparation via MCP

### Required Configuration

**Cucumber Setup**:
The cucumber configuration must include:
- `'./node_modules/cucumber-ai/dist/ai.steps.js'` - Universal step matcher
- `'./node_modules/cucumber-ai/dist/setup.js'` - World setup and hooks

**Environment Variables**:
- `OPENAI_API_KEY` - API key for AI models
- `OPENAI_BASE_URL` - API endpoint (e.g., OpenRouter)
- `MIDSCENE_MODEL_NAME` - VLM for browser interactions (recommended: qwen2.5-vl-72b-instruct)
- `LLM_MODEL_NAME` - LLM for text processing (recommended: gpt-4o)

### Development Notes

- Uses Biome for linting/formatting (120 char line width, double quotes)
- TypeScript with relaxed settings (no strict null checks, implicit any allowed)
- Tests use Vitest framework
- Built files go to `dist/` directory
- Package manager: pnpm
- Visual Language Models (VLMs) are strongly recommended for browser automation as they can see and interact with pages visually