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

  test('should save diagram as JSON', async ({ page }) => {
    await page.goto('http://localhost:5173'); // Navigate to the DMN Editor page
    await page.waitForSelector('#dmn-container'); // Wait for the DMN editor to load

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 60000 }), // Wait for the download event
      page.click('#controls i.fas.fa-save'), // Trigger the download
    ]);

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toBe('diagram.json');

    const downloadPath = await download.path();
    const fileContent = fs.readFileSync(downloadPath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    const xmlContent = jsonData.xml;

    expect(xmlContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  });

  test('should trigger file input and select a DMN file', async ({ page }) => {
    await page.goto('http://localhost:5173'); // Navigate to the DMN Editor page
    await page.waitForSelector('#dmn-container'); // Wait for the DMN editor to load

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
    await page.goto('http://localhost:5173'); // Navigate to the DMN Editor page
    await page.waitForSelector('#dmn-container'); // Wait for the DMN editor to load

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
    await page.goto('http://localhost:5173'); // Navigate to the DMN Editor page
    await page.waitForSelector('#dmn-container'); // Wait for the DMN editor to load

    // Check if the DMN container has some content that indicates a diagram is loaded
    const containerContent = await page.evaluate(() => {
      const container = document.querySelector('#dmn-container');
      return container ? container.innerHTML.trim() : '';
    });

    // Assert that the container content is not empty (indicating the presence of a diagram or placeholder)
    expect(containerContent).not.toBe('');
  });

  test('should trigger file input dialog on "Retrieve DMN" button click', async ({ page }) => {
    await page.goto('http://localhost:5173'); // Navigate to the DMN Editor page
    await page.waitForSelector('#dmn-container'); // Wait for the DMN editor to load
  
    // Click on the "Retrieve DMN" button to trigger file input
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'), // Wait for the file chooser event
      page.click('#controls i.fas.fa-upload'), // Click the upload button
    ]);
  
    // Verify that the file chooser dialog is opened
    expect(fileChooser).toBeDefined();
  });

 

});
