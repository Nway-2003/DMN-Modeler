<template>
  <div id="dmn-editor">
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

    const saveAsJson = () => {
      modeler.value.saveXML({ format: true }, (err, xml) => {
        if (err) {
          console.error('Could not save DMN diagram', err);
          return;
        }
        const jsonBlob = new Blob([JSON.stringify({ xml })], { type: 'application/json' });
        const url = URL.createObjectURL(jsonBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'diagram.json';
        link.click();
        URL.revokeObjectURL(url);
      });
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
</style>
