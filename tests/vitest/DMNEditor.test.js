import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import DMNEditor from '../../src/components/DMNEditor.vue'; // Update the path if necessary
import DmnModeler from 'dmn-js/lib/Modeler';
 
// Create a mock function for importXML
const importXMLMock = vi.fn();
const saveXMLMock = vi.fn();
 
// Mock DmnModeler
vi.mock('dmn-js/lib/Modeler', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      importXML: importXMLMock,
      saveXML: saveXMLMock,
      getActiveView: vi.fn().mockReturnValue({ type: 'drd' }),
      getActiveViewer: () => ({
        get: vi.fn().mockReturnValue({ zoom: vi.fn() })
      })
    }))
  };
});
 
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
});