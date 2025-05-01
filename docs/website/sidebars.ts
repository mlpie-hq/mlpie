import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [
    {
      type: "category",
      label: "Getting Started",
      items: ["intro"],
    },
    // Empty categories have been commented out until we add content
    // {
    //   type: "category",
    //   label: "Guides",
    //   items: [],
    // },
    {
      type: "category",
      label: "Core Concepts",
      items: ["core-concepts/secret-management", "core-concepts/plugins"],
    },
    {
      type: "category",
      label: "Plugin Development",
      items: [
        "plugins/index",
        "plugins/secret-provider",
        "plugins/storage-provider",
      ],
    },
    // {
    //   type: "category",
    //   label: "API Reference",
    //   items: [],
    // },
    // {
    //   type: "category",
    //   label: "Deployment",
    //   items: [],
    // },
    // {
    //   type: "category",
    //   label: "Contributing",
    //   items: [],
    // },
  ],

  // But you can create a sidebar manually
  /*
  tutorialSidebar: [
    'intro',
    'hello',
    {
      type: 'category',
      label: 'Tutorial',
      items: ['tutorial-basics/create-a-document'],
    },
  ],
   */
};

export default sidebars;
