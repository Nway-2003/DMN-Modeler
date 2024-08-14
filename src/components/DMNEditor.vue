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
      <i class="fas fa-upload" @click="triggerFileInput" title="Retrieve DMN"></i>
      <input type="file" ref="fileInput" @change="handleFileSelect" style="display: none" accept=".dmn" />
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted, ref } from 'vue';
import DmnModeler from 'dmn-js/lib/Modeler';

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
        const dmnXML = await fetchDiagram('/public/dmn/diagram.dmn');
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
        const { xml } = await modeler.value.saveXML({ format: true });

        // Parse the XML to extract definitions and convert it to JSON
        const definitions = modeler.value.getDefinitions();
        
        // Add metadata
        const jsonContent = {
          metadata: metadata.value,
          definitions,
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

    return {
      dmnContainer,
      saveAsJson,
      triggerFileInput,
      handleFileSelect,
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
  margin: -60px;
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
