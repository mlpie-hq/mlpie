import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { prism } from 'react-syntax-highlighter/dist/cjs/styles/prism';

export type CodeExample = {
  yamlExample: string;
  cliExample: string;
  sdkExample: string;
};

export type UIFormField = {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options?: Array<{value: string; label: string}>;
};

// Define the shape for the optional tags prop
type TagHandling = {
  tags: string[];
  tagInput: string;
  setTagInput: (value: string) => void;
  handleAddTag: () => void;
  handleRemoveTag: (tag: string) => void;
  handleTagKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

type MultiMethodInterfaceProps = {
  title?: string;
  fields: UIFormField[];
  getExampleCode: () => CodeExample;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  tags?: TagHandling;
  yamlInstructions?: string;
  cliInstructions?: string;
  sdkInstructions?: string;
};

// Animation variants for tab transitions
const tabVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { 
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

const MultiMethodInterface: React.FC<MultiMethodInterfaceProps> = ({
  title,
  fields,
  getExampleCode,
  onSubmit,
  tags,
  yamlInstructions = 'Define in YAML and apply with:',
  cliInstructions = 'Use the command-line interface:',
  sdkInstructions = 'Use the Python SDK:',
}) => {
  const [activeTab, setActiveTab] = useState('ui');
  const { yamlExample, cliExample, sdkExample } = getExampleCode();

  // Select theme based on active tab
  const currentTheme = activeTab === 'yaml' ? prism : vscDarkPlus;
  const currentBgColor = activeTab === 'yaml' ? '#f9fafb' : '#111827'; // bg-gray-50 or bg-gray-900

  // Custom style for syntax highlighter
  const customStyle = {
    ...currentTheme,
    'pre[class*="language-"]': {
      ...(currentTheme['pre[class*="language-"]'] || {}), // Handle potential undefined style
      backgroundColor: currentBgColor,
      padding: '0.5rem', 
      margin: 0, 
      borderRadius: '0.375rem',
      height: '100%', // Ensure pre fills the container
      overflow: 'auto' // Add scrollbars if needed within pre
    },
     'code[class*="language-"]': {
      ...(currentTheme['code[class*="language-"]'] || {}), // Handle potential undefined style
      fontFamily: 'inherit', 
      fontSize: '0.875rem' 
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm w-full p-6">
      {title && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className="border-b border-border mb-6">
        <nav className="flex -mb-px" aria-label="Tabs">
          {['ui', 'yaml', 'cli', 'sdk'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium relative ${
                activeTab === tab
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'ui' ? 'UI' : 
               tab === 'yaml' ? 'YAML' : 
               tab === 'cli' ? 'CLI' : 'Python SDK'}
              
              {/* Animated underline */}
              {activeTab === tab && (
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                  layoutId="activeTabIndicator"
                  initial={false}
                />
              )}
            </button>
          ))}
        </nav>
      </div>
      
      {/* REMOVE Fixed height container for all tab content */}
      {/* Let height be determined by content */}
      <div className="flex flex-col relative">
        <AnimatePresence mode="wait">
          {/* UI Tab */} 
          {activeTab === 'ui' && (
            <motion.div
              key="ui-tab"
              // Remove absolute positioning if container height is not fixed
              className="flex-1"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <form onSubmit={onSubmit} className="h-full flex flex-col" id="multi-method-interface-form">
                 {/* Let this div scroll if content overflows */}
                <div className="flex-1 overflow-y-auto space-y-4 pb-4 mb-6">
                  {/* Form Fields */}
                  {fields.map((field) => (
                    <div key={field.id}>
                      <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}{field.required && '*'}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          id={field.id}
                          name={field.name}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          required={field.required}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder={field.placeholder}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          id={field.id}
                          name={field.name}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          required={field.required}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          {field.options?.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          id={field.id}
                          name={field.name}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          required={field.required}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  ))}
                  
                  {/* Tags Input (Optional) */}
                  {tags && (
                    <div>
                      <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                      <div className="flex">
                        <input
                          type="text"
                          id="tagInput"
                          value={tags.tagInput}
                          onChange={(e) => tags.setTagInput(e.target.value)}
                          onKeyDown={tags.handleTagKeyDown}
                          className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Add a tag"
                        />
                        <button
                          type="button"
                          onClick={tags.handleAddTag}
                          className="bg-gray-100 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                        >
                          Add
                        </button>
                      </div>
                      <AnimatePresence>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {tags.tags.map(tag => (
                            <motion.span 
                              key={tag} 
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.2 }}
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => tags.handleRemoveTag(tag)}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </motion.span>
                          ))}
                        </div>
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </form>
            </motion.div>
          )}

          {/* YAML Tab */} 
          {activeTab === 'yaml' && (
            <motion.div
              key="yaml-tab" 
              className="flex-1 flex flex-col"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="flex-1 overflow-hidden flex flex-col">
                <p className="text-sm text-gray-600 mb-4">
                  {yamlInstructions} <code className="bg-gray-100 px-1 py-0.5 rounded">mlpie apply -f resource.yaml</code>
                </p>
                
                <div className="flex-1 rounded-md overflow-hidden overflow-x-auto"> 
                  <SyntaxHighlighter 
                    language="yaml" 
                    style={customStyle} 
                    customStyle={{ height: '100%', margin: 0 }} 
                    wrapLines={true}
                    showLineNumbers={false}
                  >
                    {yamlExample}
                  </SyntaxHighlighter>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
                <motion.button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(yamlExample);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium flex items-center"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy YAML
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* CLI Tab */} 
          {activeTab === 'cli' && (
            <motion.div
              key="cli-tab" 
              className="flex-1 flex flex-col"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="flex-1 overflow-hidden flex flex-col">
                <p className="text-sm text-gray-600 mb-4">
                  {cliInstructions}
                </p>
                
                <div className="flex-1 rounded-md overflow-hidden overflow-x-auto">
                  <SyntaxHighlighter 
                    language="bash" 
                    style={customStyle} 
                    customStyle={{ height: '100%', margin: 0 }}
                    wrapLines={true}
                    showLineNumbers={false}
                  >
                    {cliExample}
                  </SyntaxHighlighter>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
                <motion.button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(cliExample);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium flex items-center"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy Command
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* SDK Tab */} 
          {activeTab === 'sdk' && (
            <motion.div
              key="sdk-tab" 
              className="flex-1 flex flex-col"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="flex-1 overflow-hidden flex flex-col">
                <p className="text-sm text-gray-600 mb-4">
                  {sdkInstructions}
                </p>
                
                <div className="flex-1 rounded-md overflow-hidden overflow-x-auto">
                  <SyntaxHighlighter 
                    language="python" 
                    style={customStyle} 
                    customStyle={{ height: '100%', margin: 0 }}
                    wrapLines={true}
                    showLineNumbers={false}
                  >
                    {sdkExample}
                  </SyntaxHighlighter>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
                <motion.button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(sdkExample);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium flex items-center"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy Code
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MultiMethodInterface; 