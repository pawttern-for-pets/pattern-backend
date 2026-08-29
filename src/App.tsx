import './App.css'

import { CadCanvas } from './components/CadCanvas'

import {
  addLine,
  addPoint,
  createEmptyDocument,
} from './cad/document'

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

const demoPattern = createDemoPattern()

function App() {
  return (
    <div className="app">
      <header className="header">
        <strong>PAWTTERN CAD</strong>
        <span>Foundation v0.1</span>
      </header>

      <main className="workspace">
        <CadCanvas document={demoPattern} />
      </main>
    </div>
  )
}

export default App