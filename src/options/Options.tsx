import { useEffect, useState } from 'react'
import { Form, Field } from 'react-final-form'
import AutoSave from './AutoSave'
import { Config } from '../types'
import './Options.css'

const save = async (values: Config) => chrome.storage.sync.set({ config: values });
const validatePath = (path: string) => path ? undefined : 'Required'

const validateFrontMatter = (template: string) => {
  if (template.length == 0) {
    return 'Required'
  }

  if (!template.includes('${content}')) {
    return 'Template must include ${content}'
  }

  return undefined
}

const submit = async (values: Config) => {
  await save(values)
  window.close()
}

function App() {
  const [config, setConfig] = useState({ path: '', template: '' })

  useEffect(() => {
      chrome.storage.sync.get('config', (args) => { setConfig(args.config) })
  }, [setConfig]);

  return (
    <main>
      <h3>Options</h3>

      <Form
        onSubmit={submit}
        initialValues={config}
        subscription={{}}
        render={({ handleSubmit, submitting }) => (
          <form onSubmit={handleSubmit} className="form">
            <AutoSave debounce={1000} onSave={save} />

            <Field name="path" component="input" validate={validatePath}>
            {({ input, meta }) => (
              <div className="form-element">
                <label>Root Folder {meta.error && meta.touched && <span className="error">({meta.error})</span>}</label>

                <input {...input} type="text" placeholder="Root folder path" />
              </div>
            )}
            </Field>

            <Field name="template" component="textarea" validate={validateFrontMatter}>
            {({ input, meta }) => (
              <div className="form-element">
                <label>Front Matter Template</label>
                <p>
                Valid template strings are <code>$&#123;date&#125;</code>, <code>$&#123;url&#125;</code>, <code>$&#123;type&#125;</code> and <code>$&#123;content&#125;</code>.
                </p>
                {meta.error && meta.touched && <span className="error">{meta.error}</span>}
                <textarea {...input} />
              </div>
            )}
            </Field>

            <button type="submit" disabled={submitting}>
              OK
            </button>
          </form>
        )}
      />

    </main>
  )
}

export default App
