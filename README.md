# Cucumber-ai

[![CI](https://github.com/zbcjackson/cucumber-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/zbcjackson/cucumber-ai/actions/workflows/ci.yml)

Cucumber-ai is an AI-powered extension of [Cucumber](https://cucumber.io/) that enables you to write automated tests using natural language. It leverages AI models to interpret your test descriptions and automatically generate the necessary automation code, making test creation more accessible and intuitive.

## What is Cucumber-ai?

Cucumber-ai builds upon the [Cucumber framework](https://cucumber.io/docs/installation/javascript/) by adding AI capabilities that can:

- **Interpret natural language**: Write test steps in plain English and let AI understand what you want to test
- **Reduce boilerplate**: Focus on describing behavior rather than writing implementation details
- **Maintain consistency**: Use AI to ensure your tests follow best practices

## Key Concepts

Cucumber-ai extends several core [Cucumber concepts](https://cucumber.io/docs/cucumber/):

- **[Features](https://cucumber.io/docs/gherkin/)**: Write scenarios in Gherkin syntax (Given/When/Then)
- **[Step Definitions](https://cucumber.io/docs/cucumber/step-definitions/)**: Define what each step should do using natural language
- **[Hooks](https://cucumber.io/docs/cucumber/api/#hooks)**: Set up and tear down test environments
- **[Page Objects](https://cucumber.io/docs/guides/browser-automation/#page-objects)**: Create reusable page models for web applications

## Installation

Install cucumber-ai as a development dependency:

```bash
# Using pnpm (recommended)
pnpm add -D cucumber-ai

# Using npm
npm install --save-dev cucumber-ai

# Using yarn
yarn add -D cucumber-ai
```

## Configuration

### 1. Environment Setup

Create a `.env` file in your project root with your AI model configuration:

```dotenv
# Visual Language Model (VLM) for browser interaction
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://openrouter.ai/api/v1
MIDSCENE_MODEL_NAME=qwen/qwen2.5-vl-72b-instruct
MIDSCENE_USE_QWEN_VL=1

# Language Model (LLM) for other AI tasks
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL_NAME=openai/gpt-4o
```

**Note**: For browser automation, we strongly recommend using a Visual Language Model (VLM) like `qwen2.5-vl-72b-instruct` as it can understand and interact with web page elements visually.

### 2. Project Structure

Create a `features` directory in your project root with the following structure:

```
features/
├── concepts/          # Reusable page objects and behaviors
│   └── *.concept
├── steps/            # Step definitions in natural language
│   └── *.steps
├── hooks/            # Setup and teardown logic
│   └── *.hooks
└── *.feature         # Test scenarios in Gherkin format
```

## Writing Tests

### 1. Feature Files

Feature files use standard [Gherkin syntax](https://cucumber.io/docs/gherkin/) and are identical to regular Cucumber feature files:

```gherkin
Feature: Search for a location on the map

  Scenario: Search for a location
    When I search for "百度研发中心"
    Then I should see the address "上海市浦东新区纳贤路701号"
```

### 2. Step Definitions

Create step definitions using natural language. Each step should start with `Step:`:

```text
Step: I search for "{{name}}"
    MapPage: search for a location "[[name]]"

Step: I should see the address "{{address}}"
    MapPage: verify the address "[[address]]"
```

**Syntax**:
- `{{variable}}`: Captures values from the Gherkin step
- `[[variable]]`: Passes values to the concept behavior
- `ConceptName: behavior_name`: References a behavior defined in a concept file

### 3. Concepts (Page Objects)

Concepts define reusable behaviors and page interactions:

```text
Concept: MapPage
    Behavior: search for a location "{{name}}"
        aiInput([[name]]): the search box
        aiTap: the search button
        aiWaitFor: the search results populates

    Behavior: verify the address "{{address}}"
        aiAssert: the address shows "[[address]]"
```

**AI Commands**:
- `browser: action`: Browser-related operations, including: Opening/closing the browser, Managing local storage, Saving/deleting screenshots and video recordings, Other browser-level operations
- `data: action`: Data preparation and cleanup operations, including: Preparing test data via API calls, Direct database operations, Cleaning up test data, Requires MCP server configuration to connect to databases or API services
- `ai: prompt`: AI-powered interactions, including: Analyzing the page and planning actions first, Intelligent element recognition, Handling dynamic page content automatically, Adapting strategies based on context
- `aiInput(text): element`: Types text into an element
- `aiTap: element`: Clicks on an element
- `aiWaitFor: condition`: Waits for a condition to be met
- `aiAssert: condition`: Verifies a condition is true

### 4. Hooks

Hooks handle setup and teardown using natural language:

```text
Before:
    browser: open https://ditu.baidu.com/

After:
    browser: close
```

## Running Tests

Use the `cucumber-ai` command, which accepts the same options as `cucumber-js`:

```bash
# Run all tests
pnpm cucumber-ai

# Run specific feature files
pnpm cucumber-ai features/search.feature

# Run with specific tags
pnpm cucumber-ai --tags @smoke

# Run in parallel
pnpm cucumber-ai --parallel 4
```

## Examples

### Complete Example

Here's a complete example of testing a map search functionality:

**`features/map.feature`**:
```gherkin
Feature: Search for a location on the map

  Scenario: Search for a location
    When I search for "百度研发中心"
    Then I should see the address "上海市浦东新区纳贤路701号"
```

**`features/steps/map.steps`**:
```text
Step: I search for "{{name}}"
    MapPage: search for a location "[[name]]"

Step: I should see the address "{{address}}"
    MapPage: verify the address "[[address]]"
```

**`features/concepts/map.page.concept`**:
```text
Concept: MapPage
    Behavior: search for a location "{{name}}"
        aiInput([[name]]): the search box
        aiTap: the search button
        aiWaitFor: the search results populates

    Behavior: verify the address "{{address}}"
        aiAssert: the address shows "[[address]]"
```

**`features/hooks/setup.hooks`**:
```text
Before:
    browser: open https://ditu.baidu.com/
```

### More Examples

Check out our [example project](https://github.com/zbcjackson/cucumber-ai-example) for more comprehensive examples and use cases.

## How It Works

1. **Natural Language Processing**: Cucumber-ai uses AI models to understand your test descriptions
3. **Browser Interaction**: Visual Language Models can see and interact with web pages
4. **Test Execution**: Runs your tests using the generated automation code

## Benefits

- **Lower Learning Curve**: Write tests in natural language without deep programming knowledge
- **Faster Test Creation**: AI handles the implementation details
- **Maintainable Tests**: Focus on behavior rather than implementation
- **Visual Understanding**: AI can see and interact with web pages like a human
- **Cucumber Compatible**: Works with existing Cucumber workflows and tools

## Getting Help

- **Documentation**: [Cucumber.io Documentation](https://cucumber.io/docs/)
- **Gherkin Syntax**: [Gherkin Reference](https://cucumber.io/docs/gherkin/)
- **Step Definitions**: [Cucumber Step Definitions](https://cucumber.io/docs/cucumber/step-definitions/)
- **Examples**: [Cucumber-ai Example Project](https://github.com/zbcjackson/cucumber-ai-example)

## Contributing

We welcome contributions! Please see our [contributing guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 

