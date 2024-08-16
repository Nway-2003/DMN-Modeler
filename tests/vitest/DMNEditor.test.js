import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import DMNEditor from '../../src/components/DMNEditor.vue'; // Update the path if necessary
import DmnModeler from 'dmn-js/lib/Modeler';

 
// Create a mock function for importXML
const importXMLMock = vi.fn();
const saveXMLMock = vi.fn();
const zoomMock = vi.fn();

 
// Mock DmnModeler
vi.mock('dmn-js/lib/Modeler', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      importXML: importXMLMock,
      saveXML: saveXMLMock,
      getActiveView: vi.fn().mockReturnValue({ type: 'drd' }),
      getActiveViewer: () => ({
        get: vi.fn().mockReturnValue({ zoom: zoomMock })
      })
    }))
  };
});

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: () => 'data:image/png;base64,12345'
  })
}));
 
// Mock fetch function
vi.spyOn(global, 'fetch').mockImplementation(() =>
  Promise.resolve({
    text: () => Promise.resolve('<dmn:Definitions></dmn:Definitions>')
  })
);
 
// Mock FileReader
global.FileReader = class {
  constructor() {
    this.onload = () => {}; // Placeholder function
    this.onerror = () => {}; // Placeholder function
  }
 
  readAsText(file) {
    // Simulate file reading and trigger onload
    setTimeout(() => {
      this.onload({ target: { result: '<dmn:Definitions></dmn:Definitions>' } });
    }, 0);
  }
};
 
// Mock URL.createObjectURL and URL.revokeObjectURL
const createObjectURLMock = vi.fn();
const revokeObjectURLMock = vi.fn();
vi.spyOn(URL, 'createObjectURL').mockImplementation(createObjectURLMock);
vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revokeObjectURLMock);


 
describe('DMNEditor.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(DMNEditor);
    expect(wrapper.find('#dmn-container').exists()).toBe(true);
    expect(wrapper.find('#controls').exists()).toBe(true);
    expect(wrapper.find('input[type="file"]').exists()).toBe(true);
  });
 
  it('triggers file input click', async () => {
    const wrapper = mount(DMNEditor);
    const fileInput = wrapper.find('input[type="file"]');
    const clickSpy = vi.spyOn(fileInput.element, 'click');
 
    await wrapper.vm.triggerFileInput();
 
    expect(clickSpy).toHaveBeenCalled();
  });
 
  it('handles file input change correctly', async () => {
    const wrapper = mount(DMNEditor);
    const file = new Blob(['<dmn:Definitions></dmn:Definitions>'], { type: 'text/xml' });
 
    // Set up the file input element
    const fileInput = wrapper.find('input[type="file"]');
    fileInput.element.files = [file];
 
    // Spy on FileReader's readAsText
    const readAsTextMock = vi.spyOn(global.FileReader.prototype, 'readAsText');
 
    // Trigger file input change event
    await fileInput.trigger('change');
 
    // Verify that readAsText is called
    expect(readAsTextMock).toHaveBeenCalled();
 
    // Ensure that Vue processes the DOM update
    await wrapper.vm.$nextTick();
 
    // Verify that importXML is called with the correct XML content
    expect(importXMLMock).toHaveBeenCalledWith('<dmn:Definitions></dmn:Definitions>');
  });
 
 
  it('fetches and loads DMN XML on mount', async () => {
    const wrapper = mount(DMNEditor);
 
    // Wait for component to mount and fetch DMN XML
    await wrapper.vm.$nextTick();
 
    // Verify that fetch was called
    expect(global.fetch).toHaveBeenCalledWith('/dmn/diagram.dmn');
 
    // Ensure importXML was called with the correct XML
    expect(importXMLMock).toHaveBeenCalledWith('<dmn:Definitions></dmn:Definitions>');
  });

  it('saves the diagram as DMN when Save as DMN button is clicked', async () => {
    // Mock the saveXML function to return a sample DMN XML
    saveXMLMock.mockResolvedValue({ xml: '<dmn:Definitions></dmn:Definitions>' });
  
    const wrapper = mount(DMNEditor);
  
    // Find the Save as DMN button and trigger a click event
    const saveAsDmnButton = wrapper.find('i[title="Save as DMN"]');
    await saveAsDmnButton.trigger('click');
  
    // Ensure that saveXML was called
    expect(saveXMLMock).toHaveBeenCalled();
  
    // Ensure that the DMN XML was properly saved
    expect(createObjectURLMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });

  it('resets the diagram to default state when resetDiagram is called', async () => {
    // Mock the fetch response for the default DMN file
    const defaultDmnXML = '<dmn:Definitions></dmn:Definitions>';
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(defaultDmnXML),
    });
  
    const wrapper = mount(DMNEditor);
  
    // Call the resetDiagram method
    await wrapper.vm.resetDiagram();
  
    // Verify that importXML was called with the default DMN XML
    expect(importXMLMock).toHaveBeenCalledWith(defaultDmnXML);
  });

  it('displays the correct metadata', () => {
    // Mount the component
    const wrapper = mount(DMNEditor);

    // Find the metadata inputs
    const nameInput = wrapper.find('#metadata input[type="text"]').element;
    const dateInput = wrapper.findAll('#metadata input[type="text"]').at(1).element;

    // Verify that the metadata is correctly rendered
    expect(nameInput.value).toBe('Nway Nandar Lin'); // Check default name
    expect(dateInput.value).toBe(new Date().toLocaleDateString()); // Check default date
  });
  
  it('zooms in and out correctly', async () => {
    const wrapper = mount(DMNEditor);

    // Find zoom in and zoom out buttons
    const zoomInButton = wrapper.find('i[title="Zoom In"]');
    const zoomOutButton = wrapper.find('i[title="Zoom Out"]');

    // Trigger zoom in and zoom out events
    await zoomInButton.trigger('click');
    await zoomOutButton.trigger('click');

    // Verify that zoom function was called with correct arguments
    expect(zoomMock).toHaveBeenCalledWith(expect.any(Number)); // Check that zoom function was called with a number argument
  });

  it('saves the diagram as JSON when Save as JSON button is clicked', async () => {
    // Mock the saveXML function to return sample XML
    saveXMLMock.mockResolvedValue({ xml: '<dmn:Definitions></dmn:Definitions>' });
    
    const wrapper = mount(DMNEditor);
    
    // Find the Save as JSON button and trigger a click event
    const saveAsJsonButton = wrapper.find('i[title="Save as JSON"]');
    await saveAsJsonButton.trigger('click');
    
    // Ensure that saveXML was called
    expect(saveXMLMock).toHaveBeenCalled();
    
    // Ensure that the JSON save functionality was properly triggered
    expect(createObjectURLMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });
  
  it('exports the diagram as PNG when Export as PNG button is clicked', async () => {
    const wrapper = mount(DMNEditor);

    // Find the Export as PNG button and trigger a click event
    const exportImageButton = wrapper.find('i[title="Export as PNG"]');
    await exportImageButton.trigger('click');

    // Verify that html2canvas was called
    const html2canvas = await import('html2canvas');
    expect(html2canvas.default).toHaveBeenCalledWith(wrapper.vm.$refs.dmnContainer);

    // Ensure that createObjectURL was called
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));

    // Ensure that revokeObjectURL was called
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });


  it('prints the diagram when Print Diagram button is clicked', async () => {
    const wrapper = mount(DMNEditor);

    // Mock the window.open function
    const printWindow = {
      document: {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn(),
      },
      focus: vi.fn(),
    };
    const windowOpenMock = vi.spyOn(window, 'open').mockReturnValue(printWindow);

    // Trigger the print diagram functionality
    const printDiagramButton = wrapper.find('i[title="Print Diagram"]');
    await printDiagramButton.trigger('click');

    // Ensure that window.open was called
    expect(windowOpenMock).toHaveBeenCalledWith('', '', 'height=600,width=800');

    // Ensure that the document was written with the expected content
    expect(printWindow.document.write).toHaveBeenCalledWith(expect.stringContaining('data:image/png;base64,12345'));

    // Ensure that document was closed after writing
    expect(printWindow.document.close).toHaveBeenCalled();

    // Restore the original window.open implementation
    windowOpenMock.mockRestore();
  });

  it('retrieves and loads DMN XML when file is selected', async () => {
    const wrapper = mount(DMNEditor);

    // Create a mock DMN XML file
    const file = new Blob(['<dmn:Definitions></dmn:Definitions>'], { type: 'text/xml' });

    // Set up the file input element
    const fileInput = wrapper.find('input[type="file"]');
    fileInput.element.files = [file];

    // Spy on FileReader's readAsText
    const readAsTextMock = vi.spyOn(global.FileReader.prototype, 'readAsText');

    // Trigger file input change event
    await fileInput.trigger('change');

    // Verify that readAsText is called
    expect(readAsTextMock).toHaveBeenCalled();

    // Ensure that Vue processes the DOM update
    await wrapper.vm.$nextTick();

    // Verify that importXML was called with the correct XML content
    expect(importXMLMock).toHaveBeenCalledWith('<dmn:Definitions></dmn:Definitions>');
  });

  
});