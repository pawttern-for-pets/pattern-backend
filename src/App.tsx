import {
  useState,
} from 'react'

import './App.css'

import {
  CadCanvas,
} from './components/CadCanvas'

import {
  addLine,
  addPoint,
  createEmptyDocument,
  type PatternDocument,
} from './cad/document'

import type {
  DisplayUnit,
} from './cad/display'

import {
  canRedo,
  canUndo,
  commitHistory,
  createHistory,
  redoHistory,
  undoHistory,
} from './cad/history'

function createDemoPattern() {
  let document =
    createEmptyDocument()

  document = addPoint(
    document,
    {
      id: 'A',
      name: 'A',
      xMm: 0,
      yMm: 0,
    },
  )

  document = addPoint(
    document,
    {
      id: 'B',
      name: 'B',
      xMm: 100,
      yMm: 0,
    },
  )

  document = addLine(
    document,
    {
      id: 'AB',
      name: 'AB',
      startPointId: 'A',
      endPointId: 'B',
    },
  )

  return document
}

function App() {
  const [
    displayUnit,
    setDisplayUnit,
  ] = useState<DisplayUnit>(
    'cm',
  )

  const [
    patternHistory,
    setPatternHistory,
  ] = useState(() =>
    createHistory(
      createDemoPattern(),
    ),
  )

  const patternDocument =
    patternHistory.present

  const handleDocumentChange = (
    nextDocument: PatternDocument,
  ) => {
    setPatternHistory(
      (currentHistory) =>
        commitHistory(
          currentHistory,
          nextDocument,
        ),
    )
  }

  const handleUndo = () => {
    setPatternHistory(
      (currentHistory) =>
        undoHistory(
          currentHistory,
        ),
    )
  }

  const handleRedo = () => {
    setPatternHistory(
      (currentHistory) =>
        redoHistory(
          currentHistory,
        ),
    )
  }

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
                event.target
                  .value as DisplayUnit,
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
          document={
            patternDocument
          }
          unit={
            displayUnit
          }
          onDocumentChange={
            handleDocumentChange
          }
          canUndo={
            canUndo(
              patternHistory,
            )
          }
          canRedo={
            canRedo(
              patternHistory,
            )
          }
          onUndo={
            handleUndo
          }
          onRedo={
            handleRedo
          }
        />
      </main>
    </div>
  )
}

export default App