import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import './App.css'

import {
  CadCanvas,
} from './components/CadCanvas'

import {
  PatternInputPanel,
} from './components/PatternInputPanel'

import type {
  PatternDocument,
} from './cad/document'

import type {
  BodyMeasurements,
} from './pattern/measurements'

import type {
  DisplayUnit,
} from './cad/display'

import {
  canRedo,
  canUndo,
  commitHistory,
  redoHistory,
  undoHistory,
} from './cad/history'

import {
  createCleanPatternProjectSnapshot,
  hasUnsavedPatternProjectChanges,
  type CleanPatternProjectSnapshot,
} from './pattern/projectDirty'

import {
  createNewPatternProjectHistory,
  openPatternProjectHistoryFromJson,
  serializePatternProjectForSave,
  type PatternProjectHistory,
} from './pattern/projectLifecycle'

import {
  setDraftingRuleVersion,
  setPatternProjectDocument,
  setPatternProjectMeasurements,
  setPatternProjectNeckOpeningAllowanceMm,
  setPatternProjectShoulderLengthMm,
} from './pattern/project'

import {
  PAWTTERN_MASTER_V2_RULE_VERSION,
} from './pattern/referenceTankV2Formula'

import {
  isFileSystemAccessSupported,
  pickPatternFileToOpen,
  pickPatternFileToSave,
  writePatternTextToHandle,
  type PawtternFileHandle,
} from './io/browserFileAccess'

const DEFAULT_PATTERN_FILE_NAME =
  'untitled-pawttern.json'

interface ProjectState {
  patternHistory:
    PatternProjectHistory

  cleanSnapshot:
    CleanPatternProjectSnapshot

  fileHandle:
    PawtternFileHandle | null

  fileName:
    string

  hasSavedFile:
    boolean

  /*
   * New/Open increments this so
   * CadCanvas receives a completely
   * fresh temporary UI session.
   */
  sessionId:
    number
}

function normalizePatternFileName(
  fileName: string,
): string {
  const trimmed =
    fileName.trim()

  if (
    trimmed.length === 0
  ) {
    return DEFAULT_PATTERN_FILE_NAME
  }

  if (
    trimmed
      .toLowerCase()
      .endsWith('.json')
  ) {
    return trimmed
  }

  return `${trimmed}.json`
}

function createInitialProjectState():
ProjectState {
  const patternHistory =
    createNewPatternProjectHistory()

  return {
    patternHistory,

    cleanSnapshot:
      createCleanPatternProjectSnapshot(
        patternHistory.present,
      ),

    fileHandle:
      null,

    fileName:
      DEFAULT_PATTERN_FILE_NAME,

    hasSavedFile:
      false,

    sessionId:
      1,
  }
}

function App() {
  const [
    displayUnit,
    setDisplayUnit,
  ] = useState<DisplayUnit>(
    'cm',
  )

  const [
    project,
    setProject,
  ] = useState<ProjectState>(
    createInitialProjectState,
  )

  const [
    projectMessage,
    setProjectMessage,
  ] = useState<string | null>(
    null,
  )

  const fileAccessSupported =
    useMemo(
      () =>
        isFileSystemAccessSupported(),
      [],
    )

  const patternHistory =
    project.patternHistory

  const patternProject =
    patternHistory.present

  const patternDocument =
    patternProject.document

  const hasUnsavedChanges =
    useMemo(
      () =>
        hasUnsavedPatternProjectChanges(
          patternProject,
          project.cleanSnapshot,
        ),
      [
        patternProject,
        project.cleanSnapshot,
      ],
    )

  useEffect(() => {
    const handleBeforeUnload = (
      event: BeforeUnloadEvent,
    ) => {
      if (
        !hasUnsavedChanges
      ) {
        return
      }

      event.preventDefault()

      event.returnValue = ''
    }

    window.addEventListener(
      'beforeunload',
      handleBeforeUnload,
    )

    return () => {
      window.removeEventListener(
        'beforeunload',
        handleBeforeUnload,
      )
    }
  }, [
    hasUnsavedChanges,
  ])

  const handleDocumentChange = (
    nextDocument:
      PatternDocument,
  ) => {
    setProject(
      (currentProject) => {
        const currentPatternProject =
          currentProject
            .patternHistory
            .present

        const nextPatternProject =
          setPatternProjectDocument(
            currentPatternProject,
            nextDocument,
          )

        if (
          nextPatternProject ===
          currentPatternProject
        ) {
          return currentProject
        }

        return {
          ...currentProject,

          patternHistory:
            commitHistory(
              currentProject
                .patternHistory,

              nextPatternProject,
            ),
        }
      },
    )

    setProjectMessage(null)
  }

  /*
   * GENERATE VIDEO-2 MASTER BLOCK
   *
   * One Generate action stores:
   *
   * raw B / C / N
   * shoulder length
   * neck opening allowance
   * drafting rule version
   * generated CAD geometry
   *
   * Everything is committed as ONE
   * PatternProject history action.
   */
  const handleGenerateBaseBlock = (
    measurements:
      BodyMeasurements,

    shoulderLengthMm:
      number,

    neckOpeningAllowanceMm:
      number,

    document:
      PatternDocument,
  ) => {
    setProject(
      (currentProject) => {
        const currentPatternProject =
          currentProject
            .patternHistory
            .present

        let nextPatternProject =
          setPatternProjectMeasurements(
            currentPatternProject,
            measurements,
          )

        nextPatternProject =
          setPatternProjectShoulderLengthMm(
            nextPatternProject,
            shoulderLengthMm,
          )

        nextPatternProject =
          setPatternProjectNeckOpeningAllowanceMm(
            nextPatternProject,
            neckOpeningAllowanceMm,
          )

        nextPatternProject =
          setDraftingRuleVersion(
            nextPatternProject,
            PAWTTERN_MASTER_V2_RULE_VERSION,
          )

        nextPatternProject =
          setPatternProjectDocument(
            nextPatternProject,
            document,
          )

        return {
          ...currentProject,

          patternHistory:
            commitHistory(
              currentProject
                .patternHistory,

              nextPatternProject,
            ),
        }
      },
    )

    setProjectMessage(null)
  }

  const handleUndo = () => {
    setProject(
      (currentProject) => ({
        ...currentProject,

        patternHistory:
          undoHistory(
            currentProject
              .patternHistory,
          ),
      }),
    )

    setProjectMessage(null)
  }

  const handleRedo = () => {
    setProject(
      (currentProject) => ({
        ...currentProject,

        patternHistory:
          redoHistory(
            currentProject
              .patternHistory,
          ),
      }),
    )

    setProjectMessage(null)
  }

  const confirmDiscardUnsavedChanges =
    (): boolean => {
      if (
        !hasUnsavedChanges
      ) {
        return true
      }

      return window.confirm(
        'This pattern has unsaved changes. Discard those changes and continue?',
      )
    }

  const handleNewPattern =
    () => {
      if (
        !confirmDiscardUnsavedChanges()
      ) {
        return
      }

      setProject(
        (currentProject) => {
          const patternHistory =
            createNewPatternProjectHistory()

          return {
            patternHistory,

            cleanSnapshot:
              createCleanPatternProjectSnapshot(
                patternHistory.present,
              ),

            fileHandle:
              null,

            fileName:
              DEFAULT_PATTERN_FILE_NAME,

            hasSavedFile:
              false,

            sessionId:
              currentProject
                .sessionId + 1,
          }
        },
      )

      setProjectMessage(
        'New blank pattern created.',
      )
    }

  const handleOpenPattern =
    async () => {
      if (
        !fileAccessSupported
      ) {
        setProjectMessage(
          'Direct file opening is not supported by this browser.',
        )

        return
      }

      if (
        !confirmDiscardUnsavedChanges()
      ) {
        return
      }

      setProjectMessage(null)

      try {
        const opened =
          await pickPatternFileToOpen()

        if (!opened) {
          return
        }

        const openedHistory =
          openPatternProjectHistoryFromJson(
            opened.text,
          )

        const cleanSnapshot =
          createCleanPatternProjectSnapshot(
            openedHistory.present,
          )

        setProject(
          (currentProject) => ({
            patternHistory:
              openedHistory,

            cleanSnapshot,

            fileHandle:
              opened.handle,

            fileName:
              opened.fileName,

            hasSavedFile:
              true,

            sessionId:
              currentProject
                .sessionId + 1,
          }),
        )

        setProjectMessage(
          `Opened ${opened.fileName}`,
        )
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unknown file error.'

        setProjectMessage(
          `Open failed: ${message}`,
        )
      }
    }

  const savePatternToHandle =
    async (
      handle:
        PawtternFileHandle,

      json: string,
    ) => {
      await writePatternTextToHandle(
        handle,
        json,
      )

      setProject(
        (currentProject) => ({
          ...currentProject,

          cleanSnapshot:
            json,

          fileHandle:
            handle,

          fileName:
            handle.name,

          hasSavedFile:
            true,
        }),
      )

      setProjectMessage(
        `Saved ${handle.name}`,
      )
    }

  const handleSaveAsPattern =
    async () => {
      if (
        !fileAccessSupported
      ) {
        setProjectMessage(
          'Direct file saving is not supported by this browser.',
        )

        return
      }

      try {
        const json =
          serializePatternProjectForSave(
            patternProject,
          )

        const suggestedName =
          normalizePatternFileName(
            project.fileName,
          )

        const handle =
          await pickPatternFileToSave(
            suggestedName,
          )

        if (!handle) {
          return
        }

        await savePatternToHandle(
          handle,
          json,
        )
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unknown save error.'

        setProjectMessage(
          `Save As failed: ${message}`,
        )
      }
    }

  const handleSavePattern =
    async () => {
      if (
        !fileAccessSupported
      ) {
        setProjectMessage(
          'Direct file saving is not supported by this browser.',
        )

        return
      }

      if (
        project.fileHandle ===
        null
      ) {
        await handleSaveAsPattern()

        return
      }

      try {
        const json =
          serializePatternProjectForSave(
            patternProject,
          )

        await savePatternToHandle(
          project.fileHandle,
          json,
        )
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unknown save error.'

        setProjectMessage(
          `Save failed: ${message}`,
        )
      }
    }

  useEffect(() => {
    const handleProjectShortcut = (
      event: KeyboardEvent,
    ) => {
      const isSaveShortcut =
        (
          event.ctrlKey ||
          event.metaKey
        ) &&
        !event.altKey &&
        event.key
          .toLowerCase() === 's'

      if (!isSaveShortcut) {
        return
      }

      event.preventDefault()

      if (event.shiftKey) {
        void handleSaveAsPattern()

        return
      }

      void handleSavePattern()
    }

    window.addEventListener(
      'keydown',
      handleProjectShortcut,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleProjectShortcut,
      )
    }
  })

  let projectStatus =
    'New pattern'

  if (
    hasUnsavedChanges
  ) {
    projectStatus =
      'Unsaved changes'
  } else if (
    project.hasSavedFile
  ) {
    projectStatus =
      'Saved'
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

        <div
          style={{
            display: 'flex',
            alignItems:
              'center',
            gap: '6px',
          }}
        >
          <button
            type="button"
            onClick={
              handleNewPattern
            }
          >
            New
          </button>

          <button
            type="button"
            disabled={
              !fileAccessSupported
            }
            onClick={
              handleOpenPattern
            }
          >
            Open
          </button>

          <button
            type="button"
            disabled={
              !fileAccessSupported
            }
            onClick={() => {
              void handleSavePattern()
            }}
            title="Save (Ctrl+S)"
          >
            Save
          </button>

          <button
            type="button"
            disabled={
              !fileAccessSupported
            }
            onClick={() => {
              void handleSaveAsPattern()
            }}
            title="Save As (Ctrl+Shift+S)"
          >
            Save As
          </button>
        </div>

        <span
          style={{
            fontSize:
              '12px',

            fontWeight:
              hasUnsavedChanges
                ? 'bold'
                : 'normal',
          }}
          title={
            project.fileName
          }
        >
          {projectStatus}
          {' — '}
          {project.fileName}
        </span>

        {projectMessage && (
          <span
            style={{
              fontSize:
                '12px',
            }}
          >
            {projectMessage}
          </span>
        )}

        {!fileAccessSupported && (
          <span
            style={{
              fontSize:
                '12px',

              color:
                '#b00020',
            }}
          >
            Direct project-file access is unavailable in this browser.
          </span>
        )}

        <label className="unitControl">
          Units

          <select
            value={
              displayUnit
            }
            onChange={(
              event,
            ) => {
              setDisplayUnit(
                event.target
                  .value as
                  DisplayUnit,
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

      <PatternInputPanel
        key={
          `pattern-input-${project.sessionId}`
        }
        measurements={
          patternProject.measurements
        }
        halfBodyAllowanceMm={
          patternProject
            .halfBodyAllowanceMm
        }
        shoulderLengthMm={
          patternProject
            .shoulderLengthMm
        }
        neckOpeningAllowanceMm={
          patternProject
            .neckOpeningAllowanceMm
        }
        onGenerate={
          handleGenerateBaseBlock
        }
      />

      <main className="workspace">
        <CadCanvas
          key={
            project.sessionId
          }
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