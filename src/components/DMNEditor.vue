<template>
  <div id="dmn-editor">
    <div id="metadata">
      <label>
        Name:
     <input type="text" v-model="metadata.name" readonly />
      </label>
      <label>
        Date:
        <input type="text" v-model="metadata.date" readonly />
      </label>
    </div>
    <div id="dmn-container" ref="dmnContainer"></div>
    <div id="controls">
      <i class="fas fa-save" @click="saveAsJson" title="Save as JSON"></i>
      <!-- New icon for Save as DMN -->
      <i class="fas fa-file-code" @click="saveAsDmn" title="Save as DMN" style="margin-left: 10px;"></i>
      <i class="fas fa-upload" @click="triggerFileInput" title="Retrieve DMN"></i>
      <input type="file" ref="fileInput" @change="handleFileSelect" style="display: none" accept=".dmn" />

      <!-- New reset button -->
      <i class="fas fa-undo" @click="resetDiagram" title="Reset Diagram" style="margin-left: 10px;"></i>

      <!-- New icon for exporting images -->
      <i class="fas fa-image" @click="exportImage" title="Export as PNG" style="margin-left: 10px;"></i>

       <!-- New icon for printing diagram -->
      <i class="fas fa-print" @click="printDiagram" title="Print Diagram" style="margin-left: 10px;"></i>
      
     
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted, ref } from 'vue';
import DmnModeler from 'dmn-js/lib/Modeler';
import html2canvas from 'html2canvas';

export default defineComponent({
  setup() {
    const dmnContainer = ref(null);
    const modeler = ref();
    const fileInput = ref();
    const metadata = ref({
      name: 'Nway Nandar Lin',  
      date: new Date().toLocaleDateString(),
    });

    onMounted(async () => {
      modeler.value = new DmnModeler({
        container: dmnContainer.value,
        keyboard: {
          bindTo: window,
        },
      });

      try {
        const dmnXML = await fetchDiagram('/dmn/diagram.dmn');
        await loadDiagram(dmnXML);
      } catch (error) {
        console.error('Error loading DMN XML:', error);
      }
    });

    const fetchDiagram = async (url) => {
      const response = await fetch(url);
      return response.text();
    };

    const loadDiagram = async (dmnXML) => {
      try {
        await modeler.value.importXML(dmnXML);
        const activeView = modeler.value.getActiveView();

        if (activeView?.type === 'drd') {
          const canvas = modeler.value.getActiveViewer().get('canvas');
          canvas.zoom('fit-viewport');
        }
      } catch (error) {
        console.error('Could not import DMN diagram', error);
      }
    };

    const saveAsJson = async () => {
  try {
    // Retrieve the latest XML from the DMN modeler
    const { xml } = await modeler.value.saveXML({ format: true });

    // Get the latest definitions from the modeler (this includes the updates)
    const definitions = modeler.value.getDefinitions();

    // Add metadata (name and date)
    const jsonContent = {
      metadata: metadata.value,
      definitions, // This now includes the latest data
    };

    // Convert the combined object to a JSON string
    const jsonString = JSON.stringify(jsonContent, null, 2);

    // Create a JSON blob and save it
    const jsonBlob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(jsonBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram.json';
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Could not save DMN diagram as JSON', err);
  }
};


    // New function to save as DMN
    const saveAsDmn = async () => {
      try {
        const { xml } = await modeler.value.saveXML({ format: true });

        // Create a DMN Blob and save it
        const dmnBlob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(dmnBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'diagram.dmn';
        link.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Could not save DMN diagram as DMN', err);
      }
    };

    const triggerFileInput = () => {
      fileInput.value?.click();
    };

    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dmnXML = e.target.result;
          console.log('Loaded DMN XML:', dmnXML);
          await loadDiagram(dmnXML);
        };
        reader.readAsText(file);
      }
    };

  const resetDiagram = async () => {
  try {
    const response = await fetch('/dmn/empty.dmn');
    
    // Use optional chaining and nullish coalescing operator for safer checks
    if (!response?.ok) {
      throw new Error('Failed to load the default diagram.');
    }

    // Extract XML from the response
    const dmnXML = await response.text();
    
    // Ensure modeler is properly initialized
    if (modeler.value) {
      await modeler.value.importXML(dmnXML);
      console.log('Diagram has been reset to default.');
    } else {
      console.warn('Modeler is not initialized.');
    }
  } catch (error) {
    console.error('Error resetting diagram:', error);
  }
};

 const exportImage = async () => {
  try {
    // Temporarily hide elements with specific classes
    const elementsToHide = document.querySelectorAll(
      ".djs-palette.open, .dmn-definitions, .view-drd-button"
    );
    elementsToHide.forEach(el => el.style.visibility = 'hidden');

    // Capture the DMN container
    const canvas = await html2canvas(dmnContainer.value);
    const dataURL = canvas.toDataURL('image/png'); // Always export as PNG

    // Restore the visibility of the hidden elements
    elementsToHide.forEach(el => el.style.visibility = '');

    // Create a link to download the image
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'diagram.png'; // Default to PNG
    link.click();
  } catch (error) {
    console.error('Error exporting diagram as PNG:', error);
  }
};

const printDiagram = async () => {
  try {
    // Temporarily hide elements with specific classes
    const elementsToHide = document.querySelectorAll(
      ".djs-palette.open, .dmn-definitions, .view-drd-button"
    );
    elementsToHide.forEach(el => el.style.visibility = 'hidden');

    // Capture the DMN container
    const canvas = await html2canvas(dmnContainer.value);
    const dataURL = canvas.toDataURL('image/png');

    // Restore the visibility of the hidden elements
    elementsToHide.forEach(el => el.style.visibility = '');

    // Create a new window to display the image for printing
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Diagram</title>
        </head>
        <body onload="window.print();window.close();">
          <img src="${dataURL}" style="width: 100%; height: auto;">
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (error) {
    console.error('Error printing diagram:', error);
  }
};





    return {
      dmnContainer,
      saveAsJson,
      saveAsDmn,
      triggerFileInput,
      handleFileSelect,
      resetDiagram,
      exportImage,
      printDiagram,
      fileInput,
      metadata,
    };
  },
});
</script>

<style>
#dmn-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  margin: 0px;
}

#dmn-container {
  flex: 1;
}

#controls {
  display: flex;
  gap: 20px;
  padding-left: 30px;
  padding-bottom: 30px;
  align-items: center;
  
  position : sticky;
 
}

#controls i {
  font-size: 24px;
  cursor: pointer;
  transition: color 0.3s;
}

#controls i:hover {
  color: #007bff;
}

#metadata {
  padding: 10px;
  display: flex; /* Use flexbox layout */
  gap: 20px; /* Add space between the fields */
  align-items: center; /* Vertically center the labels and inputs */
  margin-top: 20px;
  margin-bottom: 10px;
}

#metadata label {
  display: flex; /* Display label as flexbox */
  align-items: center; /* Vertically center the label text and input */
  gap: 10px; /* Add space between the label text and input */
  font-size: 14px;
  margin-left: 20px;
}

#metadata input {
  width: 200px; /* Keep input fields shorter */
  padding: 5px;
  font-size: 14px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f9f9f9;
  color: #333;
}

#metadata input[readonly] {
  background-color: #e9ecef;
  cursor: not-allowed;
}

</style>
