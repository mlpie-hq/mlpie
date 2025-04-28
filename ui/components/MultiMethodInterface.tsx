import React, { useState, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Copy, X, Check } from 'lucide-react';

export type FormData = Record<string, string | number | boolean | string[]>;

export type UIFormField = {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select';
  placeholder?: string;
  required?: boolean;
  value: string | number;
  onChange: (value: string | number) => void;
  options?: { value: string; label: string }[];
};

export type CodeExample = {
  yamlExample: string;
  cliExample: string;
  sdkExample: string;
};

export interface MultiMethodInterfaceProps {
  title?: string;
  fields: UIFormField[];
  getExampleCode: (formData: FormData) => CodeExample;
  onSubmit: (formData: FormData) => void;
  tags?: string[];
  tagInput?: string;
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tagToRemove: string) => void;
  onTagInputChange?: (value: string) => void;
  onTagInputKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  yamlInstructions?: string;
  cliInstructions?: string;
  sdkInstructions?: string;
  submitButtonText?: string;
}

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
  title = "Create Resource",
  fields,
  getExampleCode,
  onSubmit,
  tags,
  tagInput,
  onAddTag,
  onRemoveTag,
  onTagInputChange,
  onTagInputKeyDown,
  yamlInstructions = "Define your resource configuration in YAML format.",
  cliInstructions = "Use the command-line interface to create the resource.",
  sdkInstructions = "Use the Python SDK to programmatically create the resource.",
  submitButtonText = "Create",
}) => {
  const [activeTab, setActiveTab] = useState('ui');
  const [formData, setFormData] = useState<FormData>(
    fields.reduce((acc, field) => {
      acc[field.name] = field.value;
      return acc;
    }, {} as FormData)
  );
  const [copiedStates, setCopiedStates] = useState({ yaml: false, cli: false, sdk: false });

  React.useEffect(() => {
    const newFormData = fields.reduce((acc, field) => {
      acc[field.name] = field.value;
      return acc;
    }, {} as FormData);
    setFormData(newFormData);
  }, [fields]);

  const handleInputChange = (name: string, value: string | number) => {
    const field = fields.find(f => f.name === name);
    field?.onChange(value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentFormData = fields.reduce((acc, field) => {
        acc[field.name] = field.value;
        return acc;
    }, {} as FormData);
    if (tags && tags.length > 0) {
        currentFormData.tags = tags;
    }
    console.log("Submitting form data:", currentFormData);
    onSubmit(currentFormData);
  };

  const codeExamples = getExampleCode(formData);

  const copyToClipboard = (text: string, type: 'yaml' | 'cli' | 'sdk') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates(prev => ({ ...prev, [type]: true }));
      setTimeout(() => setCopiedStates(prev => ({ ...prev, [type]: false })), 1500);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const renderField = (field: UIFormField) => {
    // Common classes for input fields matching screenshot style
    const commonInputClasses = "block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 bg-white";

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.id}
            name={field.name}
            rows={3}
            className={commonInputClasses} // Apply common style
            placeholder={field.placeholder}
            value={field.value as string}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
          />
        );
      case 'select':
        return (
            <select
                id={field.id}
                name={field.name}
                className={commonInputClasses} // Apply common style
                value={field.value}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                required={field.required}
            >
                {field.placeholder && <option value="" disabled>{field.placeholder}</option>}
                {field.options?.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        );
      case 'text':
      case 'number':
      default:
        return (
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            id={field.id}
            name={field.name}
            className={commonInputClasses} // Apply common style
            placeholder={field.placeholder}
            value={field.value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm w-full p-6">
      {title && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        </div>
      )}
      
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
      
      <div className="flex flex-col relative">
        <AnimatePresence mode="wait">
          {activeTab === 'ui' && (
            <motion.div
              key="ui-tab"
              className="flex-1"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <form onSubmit={handleSubmit} className="h-full flex flex-col" id="multi-method-interface-form">
                <div className="flex-1 overflow-y-auto space-y-4 pb-4 mb-6">
                  {fields.map((field) => (
                    <div key={field.id}>
                      <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}{field.required && '*'}
                      </label>
                      {renderField(field)}
                    </div>
                  ))}
                  
                  {tags !== undefined && onAddTag && onRemoveTag && onTagInputChange && onTagInputKeyDown && (
                    <div>
                      <label htmlFor="tags-input" className="block text-sm font-medium text-foreground mb-1">
                        Tags (optional)
                      </label>
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                          {tags.map(tag => (
                              <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                                  {tag}
                                  <button
                                      type="button"
                                      onClick={() => onRemoveTag(tag)}
                                      className="ml-1.5 flex-shrink-0 text-muted-foreground hover:text-foreground focus:outline-none"
                                      aria-label={`Remove ${tag} tag`}
                                  >
                                      <X className="h-3 w-3" />
                                  </button>
                              </span>
                          ))}
                      </div>
                      <input
                        type="text"
                        id="tags-input"
                        className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Add a tag and press Enter..."
                        value={tagInput}
                        onChange={(e) => onTagInputChange(e.target.value)}
                        onKeyDown={onTagInputKeyDown}
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {submitButtonText}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'yaml' && (
            <motion.div
              key="yaml-tab" 
              className="flex-1 flex flex-col"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{yamlInstructions}</p>
                <div className="relative rounded-md border border-border p-0 overflow-hidden"> 
                  <SyntaxHighlighter 
                    language="yaml" 
                    style={vscDarkPlus} // Use vscDarkPlus style
                    customStyle={{ 
                      margin: 0, 
                      padding: '1rem', 
                      // Let the theme handle background
                      // background: 'transparent', 
                      overflowX: 'auto' 
                    }}
                    wrapLongLines={false}
                    className="text-sm"
                  >
                    {codeExamples.yamlExample}
                  </SyntaxHighlighter>
                  <button
                    onClick={() => copyToClipboard(codeExamples.yamlExample, 'yaml')}
                    className="absolute top-2 right-2 p-1.5 bg-gray-800/70 backdrop-blur-sm rounded-md text-gray-300 hover:text-white border border-gray-600 transition-all"
                    title={copiedStates.yaml ? "Copied!" : "Copy YAML"}
                  >
                    {copiedStates.yaml ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'cli' && (
            <motion.div
              key="cli-tab" 
              className="flex-1 flex flex-col"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{cliInstructions}</p>
                <div className="relative rounded-md border border-border p-0 overflow-hidden">
                   <SyntaxHighlighter 
                    language="bash" 
                    style={vscDarkPlus} // Use vscDarkPlus style
                     customStyle={{ 
                      margin: 0, 
                      padding: '1rem', 
                      // background: 'transparent', 
                      overflowX: 'auto' 
                    }}
                    wrapLongLines={true}
                    className="text-sm"
                  >
                    {codeExamples.cliExample}
                  </SyntaxHighlighter>
                   <button
                     onClick={() => copyToClipboard(codeExamples.cliExample, 'cli')}
                     className="absolute top-2 right-2 p-1.5 bg-gray-800/70 backdrop-blur-sm rounded-md text-gray-300 hover:text-white border border-gray-600 transition-all"
                     title={copiedStates.cli ? "Copied!" : "Copy CLI command"}
                   >
                     {copiedStates.cli ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                   </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'sdk' && (
            <motion.div
              key="sdk-tab" 
              className="flex-1 flex flex-col"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{sdkInstructions}</p>
                <div className="relative rounded-md border border-border p-0 overflow-hidden">
                  <SyntaxHighlighter 
                    language="python" 
                    style={vscDarkPlus} // Use vscDarkPlus style
                    customStyle={{ 
                      margin: 0, 
                      padding: '1rem', 
                      // background: 'transparent', 
                      overflowX: 'auto' 
                    }}
                    wrapLongLines={false}
                    className="text-sm"
                  >
                    {codeExamples.sdkExample}
                  </SyntaxHighlighter>
                   <button
                    onClick={() => copyToClipboard(codeExamples.sdkExample, 'sdk')}
                     className="absolute top-2 right-2 p-1.5 bg-gray-800/70 backdrop-blur-sm rounded-md text-gray-300 hover:text-white border border-gray-600 transition-all"
                    title={copiedStates.sdk ? "Copied!" : "Copy SDK code"}
                  >
                    {copiedStates.sdk ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MultiMethodInterface; 