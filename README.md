# DMN Editor

## Overview

DMN Editor is a Vue.js application designed for editing DMN (Decision Model and Notation) diagrams. It integrates the `dmn-js` library for DMN modeling and supports functionalities such as saving, loading, and exporting diagrams.

## Project Structure

- **`src/`**: Contains the source code for the DMN Editor.
  - **`components/DMNEditor.vue`**: The main component for the DMN editor.
  - **`App.vue`**: The root component that includes the DMNEditor component.
  - **`main.js`**: The entry point of the application, where the Vue instance is created and mounted.
  - **`style.css`**: Global styles for the application.

- **`dmn/`**: Contains DMN diagram files.
  - **`diagram.dmn`**: Default DMN diagram loaded initially.
  - **`empty.dmn`**: Template for an empty DMN diagram to reset the editor.

- **`tests/`**: Contains test files for Playwright and Vitest.
  - **`playwright/DMNEditor.spec.js`**: End-to-end tests using Playwright.
  - **`vitest/DMNEditor.test.js`**: Unit and integration tests using Vitest.

## Dependencies

- **Vue.js**: Framework used for building the UI.
- **`dmn-js`**: Library for DMN modeling.
- **`html2canvas`**: Library for capturing screenshots of the diagram.

## Setup

### 1. Clone the Repository

Clone the repository to your local machine using Git. Replace `<repository-url>` with the URL of your Git repository.

```bash
git clone https://github.com/your-username/dmn-app.git
cd dmn-app

## Prerequisites
1. **Node.js**: Ensure Node.js is installed on your machine. You can download it from [nodejs.org](https://nodejs.org/).

## Install dependencies
npm install

## Running the Project
To start the development server and run the application, use:

```bash
npm run dev

## Running Tests
npx vitest run (vitest)
npx playwright test (playwright)

## Contact
If you have any more questions, please contact me at "linnwaynandar91@gmail.com" or from team.
Thank you!