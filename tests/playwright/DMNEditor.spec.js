import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Utility function to create a temporary file
const createTempFile = (content) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const tempFilePath = path.join(__dirname, 'temp-file.dmn');
  fs.writeFileSync(tempFilePath, content);
  return tempFilePath;
};

// Utility function to delete a temporary file
const deleteTempFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

test.describe('DMN Editor Tests', () => {
  // Runs once before all tests
  test.beforeAll(async () => {
    console.log('Setting up before all tests');
    // Place setup code here if needed
  });

  // Runs once after all tests
  test.afterAll(async () => {
    console.log('Cleaning up after all tests');
    // Place teardown code here if needed
  });

  // Runs before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173'); // Navigate to the DMN Editor page
    await page.waitForSelector('#dmn-container'); // Wait for the DMN editor to load
  });

  // Runs after each test
  test.afterEach(async () => {
    console.log('Cleaning up after each test');
    // Place any per-test cleanup code here if needed
  });


  test('should trigger file input and select a DMN file', async ({ page }) => {
    const dmnXML = `
    <?xml version="1.0" encoding="UTF-8"?>
    <definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd">
      <decision id="decision" name="Decision">
        <decisionTable id="decisionTable">
          <input id="input" label="Input"/>
          <output id="output" label="Output"/>
          <rule id="rule">
            <inputEntry id="inputEntry">input</inputEntry>
            <outputEntry id="outputEntry">output</outputEntry>
          </rule>
        </decisionTable>
      </decision>
    </definitions>
    `;

    const tempFilePath = createTempFile(dmnXML);

    try {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'), // Wait for the file chooser event
        page.click('#controls i.fas.fa-upload'), // Trigger the file input
      ]);

      await fileChooser.setFiles(tempFilePath);

      await page.waitForTimeout(20000); // Wait for file processing

      const containerVisible = await page.isVisible('#dmn-container');
      expect(containerVisible).toBe(true);

      const fileInputValue = await page.evaluate(() => {
        const input = document.querySelector('input[type="file"]');
        return input.files.length > 0 ? input.files[0].name : null;
      });
      expect(fileInputValue).toBe('temp-file.dmn');
    } finally {
      deleteTempFile(tempFilePath);
    }
  });

  test('should initialize DMN editor correctly', async ({ page }) => {
    // Verify if the DMN container is visible
    const containerVisible = await page.isVisible('#dmn-container');
    expect(containerVisible).toBe(true);

    // Verify that there are no unexpected errors during initialization
    const errorMessages = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.error')).map(el => el.textContent);
    });
    expect(errorMessages.length).toBe(0);
  });

  // New test: Verify that the default diagram is displayed correctly
  test('should display a default diagram on initialization', async ({ page }) => {
    // Check if the DMN container has some content that indicates a diagram is loaded
    const containerContent = await page.evaluate(() => {
      const container = document.querySelector('#dmn-container');
      return container ? container.innerHTML.trim() : '';
    });

    // Assert that the container content is not empty (indicating the presence of a diagram or placeholder)
    expect(containerContent).not.toBe('');
  });

  test('should trigger file input dialog on "Retrieve DMN" button click', async ({ page }) => {
    // Click on the "Retrieve DMN" button to trigger file input
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'), // Wait for the file chooser event
      page.click('#controls i.fas.fa-upload'), // Click the upload button
    ]);
  
    // Verify that the file chooser dialog is opened
    expect(fileChooser).toBeDefined();
  });

  test('should save DMN diagram as JSON', async ({ page }) => {
    // Create a temporary DMN file
    const dmnXML = `
    <?xml version="1.0" encoding="UTF-8"?>
    <definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd">
      <decision id="decision" name="Decision">
        <decisionTable id="decisionTable">
          <input id="input" label="Input"/>
          <output id="output" label="Output"/>
          <rule id="rule">
            <inputEntry id="inputEntry">input</inputEntry>
            <outputEntry id="outputEntry">output</outputEntry>
          </rule>
        </decisionTable>
      </decision>
    </definitions>
    `;
    
    const tempFilePath = createTempFile(dmnXML);
  
    try {
      // Load the DMN file
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.click('#controls i.fas.fa-upload'),
      ]);
  
      await fileChooser.setFiles(tempFilePath);
  
      await page.waitForTimeout(20000); // Wait for file processing
  
      // Trigger saving the DMN diagram as JSON
      const [download] = await Promise.all([
        page.waitForEvent('download'), // Wait for the download event
        page.click('#controls i.fas.fa-save'), // Click the save button
      ]);
  
      // Check that the download event has occurred
      expect(download).toBeDefined();
  
      // Verify that the downloaded file is a JSON file
      const downloadPath = await download.path();
      const content = fs.readFileSync(downloadPath, 'utf8');
      const json = JSON.parse(content);
  
      // Check if JSON content includes metadata and definitions
      expect(json).toHaveProperty('metadata');
      expect(json).toHaveProperty('definitions');
      
      // Optionally, check metadata
      expect(json.metadata).toHaveProperty('name', 'Nway Nandar Lin');
      expect(json.metadata).toHaveProperty('date');
    } finally {
      deleteTempFile(tempFilePath);
    }
  });

});
