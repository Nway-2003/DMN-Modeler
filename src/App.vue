<template>
  <div id="app">
    <DMNEditor />
  </div>
</template>

<script>
import DMNEditor from './components/DMNEditor.vue';

export default {
  components: {
    DMNEditor,
  },
};
</script>

<style>
#app {
  height: 100vh;
  margin: 0;
  display: flex;
  flex-direction: column;
}
</style>
