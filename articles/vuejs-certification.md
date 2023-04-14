---
title: "Vue.js Certification 一問一答"
emoji: "📜"
type: "idea" # tech: 技術記事 / idea: アイデア
topics: ["vue"]
published: false
---

## Creating a Vue Application

Know your different options for creating a Vue.js application and how to initialize the app.

:::details How to create a Vue SPA (Single Page Application)?

To create a Vue SPA, ensure you have Node.js (version 16.0 or higher) installed. Then, run the following command in your command line to install and execute `create-vue`, the official Vue project scaffolding tool:

```sh
npm init vue@latest
```

This command will prompt you to choose optional features like TypeScript, testing support, and more. If unsure, choose 'No' for now. Once the project is created, follow the instructions to install dependencies and start the dev server:

```sh
cd <your-project-name>
npm install
npm run dev
```

Now, your first Vue project should be running. The example components in the generated project use the Composition API and `<script setup>`. For an optimal development experience, it's recommended to use Visual Studio Code with the Volar extension. To prepare your app for production, run `npm run build`, which will create a production-ready build in the `./dist` directory.

:::

:::details How to use Vue from a CDN?

Include a script tag in your HTML file to use Vue from a CDN:

```html
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
```

Using Vue from a CDN simplifies setup, but you won't be able to use Single-File Component (SFC) syntax. Here's a basic example:

```html
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<div id="app">{{ message }}</div>
<script>
  const { createApp } = Vue
  createApp({
    data() {
      return {
        message: 'Hello Vue!'
      }
    }
  }).mount('#app')
</script>
```

:::

:::details How to create a Vue application instance?

Initialize a Vue application by creating a new application instance using the createApp function:

```js
import { createApp } from 'vue'
const app = createApp({
  /* root component options */
})
```

This application instance serves as the root for your Vue app and is responsible for managing its components and their interactions.

:::

## Reactivity Fundamentals

Know how to declare reactive and computed data and how the Options API differs from the Composition API.

:::details How to declare reactive state using the Composition API?

To create a reactive object or array, use the `reactive()` function:

```js
import { reactive } from 'vue'
const state = reactive({ count: 0 })
```

Reactive objects behave like normal objects, but Vue can track property access and mutations. To use reactive state in a component's template, declare and return them from the component's `setup()` function:

```js
import { reactive } from 'vue'
export default {
  setup() {
    const state = reactive({ count: 0 })
    return { state }
  }
}
```

```vue
<div>{{ state.count }}</div>
```

To create functions that modify reactive state, declare them in the same scope and expose them along with the state:

```js
import { reactive } from 'vue'
export default {
  setup() {
    const state = reactive({ count: 0 })
    function increment() {
      state.count++
    }
    return { state, increment }
  }
}
```

```vue
<button @click="increment">
  {{ state.count }}
</button>
```

:::

:::details How to declare reactive variables with `ref()`?

In Vue, you can use the `ref()` function to create reactive "refs" for any value type:

```js
import { ref } from 'vue'
const count = ref(0)
```

`ref()` wraps the argument in a ref object with a `.value` property:

```js
const count = ref(0)
console.log(count) // { value: 0 }
console.log(count.value) // 0
count.value++
console.log(count.value) // 1
```

Similar to properties on a reactive object, the `.value` property of a ref is reactive. Refs can be accessed as top-level properties in the template and are automatically "unwrapped":

```vue
<script setup>
import { ref } from 'vue'
const count = ref(0)
function increment() {
  count.value++
}
</script>
<template>
  <button @click="increment">
    {{ count }} <!-- no .value needed -->
  </button>
</template>
```

Keep in mind that the unwrapping only applies if the ref is a top-level property on the template render context. If a ref is accessed or mutated as a property of a reactive object, it is also automatically unwrapped to behave like a normal property.

:::

## Template Syntax

Interpolate text with HTML, bind data to attributes, and use built in directives to render HTML based on your reactive data.

## Event Handling

Know the Vue syntax for listening to events, the difference between inline and method handlers, how to access the event object, and how to modify the event with modifiers.

## Form Input Binding

Know how to bind data to form inputs and update that data on form events. Use the v-model shorthand for quick two-way binding. Finally, know the difference between how Vue works with all the different input types.

## Watchers

Know how to perform side effects with watchers, when to use them vs computed, the various ways of declaring sources, and the various possible options.

## LifeCycle Hooks

Know the lifecycle of a Vue.js component, plus how and why to hook into each part.

## Template Refs

Get direct access DOM nodes and component instances with template refs. Know how to define them and use them.

## Components

Know how to define components, use them, pass props, and emit events. Also know how to get the most out of them with the SFC syntax and script setup.

## Slots

Know how to pass template fragments to components with slots. Know how to define fallback content, named slots and scoped slots.

## Transitions

Know the basics of transition DOM elements into and out of view with the built-in Transition and TransitionGroup components.

## Vue Router

Client side routing is essential for Vue.js SPA’s. Know how to use the official Vue.js router to register routes, display pages with <RouterView>, and navigate with <RouterLink>.

## Ecosystem

Vue is more than just it’s core library. It’s a whole ecosystem. Be familiar at a very high level with related softwares like VueUse, Nuxt, Vuetify, Devtools, and Volar. (In a sentence what do each of these do).

