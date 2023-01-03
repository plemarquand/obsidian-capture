import { useEffect, useState } from 'react'
import { Form, Field, AnyObject,  } from 'react-final-form'
import AutoSave from './AutoSave'
import { Config } from '../types'
import './Options.css'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const save = async (values: Config) => {
  chrome.storage.sync.set({ config: values });
  console.log('Saving', values)
}

const validatePath = (path: string) => {
  console.log('validate', path)
  return path ? undefined : "Required"
}

const submit = async (values: Config) => {
  await save(values)
  window.close()
}

const initialConfig: Config = { path: '/' }

function App() {
  const [config, setConfig] = useState(initialConfig)
  
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

            <label>Root Folder</label>
            <Field name="path" component="input" placeholder="Root folder path" validate={validatePath} />
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
