import { useState } from 'react'

import './App.css'

import { CadCanvas } from './components/CadCanvas'

import {
  addLine,
  addPoint,
  createEmptyDocument,
} from './cad/document'

import type { DisplayUnit } from './cad/display'

function createDemoPattern() {
  let document = createEmptyDocument()

  document = addPoint(document, {
    id: 'A',
    name: 'A',
    xMm: 0,
    yMm: 0,
  })

  document = addPoint(document, {
    id: 'B',
    name: 'B',
    xMm: 100,
    yMm: 0,
  })

  document = addLine(document, {
    id: 'AB',
    name: 'AB',
    startPointId: 'A',
    endPointId: 'B',
  })

  return document
}

function App() {
  const [
    displayUnit,
    setDisplayUnit,
  ] = useState<DisplayUnit>('cm')

  const [
    patternDocument,
    setPatternDocument,
  ] = useState(createDemoPattern)

  return (
    <div className="app">
      <header className="header">
        <strong>
          PAWTTERN CAD
        </strong>

        <span>
          Foundation v0.1
        </span>

        <label className="unitControl">
          Units

          <select
            value={displayUnit}
            onChange={(event) => {
              setDisplayUnit(
                event.target.value as DisplayUnit,
              )
            }}
          >
            <option value="cm">
              Centimeters (cm)
            </option>

            <option value="in">
              Inches (in)
            </option>
          </select>
        </label>
      </header>

      <main className="workspace">
        <CadCanvas
          document={patternDocument}
          unit={displayUnit}
          onDocumentChange={
            setPatternDocument
          }
        />
      </main>
    </div>
  )
}

export default App