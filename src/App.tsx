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

import {
  PatternPiecesView,
} from './components/PatternPiecesView'

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
  setPatternProjectDocument,
  setPatternProjectGeneratedBlock,
  type BellyVariant,
} from './pattern/project'

import {
  PAWTTERN_MASTER_V2_RULE_VERSION,
} from './pattern/referenceTankV2Formula'

import {
  REFERENCE_TANK_V2_CURVE_IDS,
} from './pattern/referenceTankV2Construction'

import {
  validateReferenceTankV2DocumentEdit,
} from './pattern/referenceTankV2EditValidation'

import {
  createReferenceTankV2ProductionLayout,
} from './pattern/referenceTankV2ProductionLayout'
import {
  createReferenceTankV2ProductionCuttingContours,
} from './pattern/referenceTankV2ProductionCuttingContours'

import {
  isFileSystemAccessSupported,
  pickPatternFileToOpen,
  pickPatternFileToSave,
  writePatternTextToHandle,
  type PawtternFileHandle,
} from './io/browserFileAccess'

const DEFAULT_PATTERN_FILE_NAME =
  'untitled-pawttern.json'

const EMPTY_READ_ONLY_CURVE_IDS:
  readonly string[] = []

const V2_MASTER_BLOCK_READ_ONLY_CURVE_IDS:
  readonly string[] = [
    REFERENCE_TANK_V2_CURVE_IDS
      .backArmholeShoulderToPivot,

    REFERENCE_TANK_V2_CURVE_IDS
      .backArmholePivotToCommon,

    REFERENCE_TANK_V2_CURVE_IDS
      .frontArmholeCommonToPivot,

    REFERENCE_TANK_V2_CURVE_IDS
      .frontArmholePivotToShoulder,
  ]

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

  /*
   * Workspace UI only.
   *
   * This is intentionally NOT part of
   * PatternProject, Undo/Redo history,
   * dirty-state tracking, or saved JSON.
   */
  const [
    isPatternSidebarCollapsed,
    setIsPatternSidebarCollapsed,
  ] = useState(false)

  const [
    workspaceView,
    setWorkspaceView,
  ] = useState<
    'drafting' |
    'pattern-pieces'
  >('drafting')

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

  const productionLayout =
    useMemo(
      () => {
        if (
          patternProject.draftingRuleVersion !==
            PAWTTERN_MASTER_V2_RULE_VERSION ||
          patternProject.measurements ===
            null
        ) {
          return null
        }

        try {
          return createReferenceTankV2ProductionLayout(
            patternDocument,
          )
        } catch {
          return null
        }
      },
      [
        patternDocument,
        patternProject.draftingRuleVersion,
        patternProject.measurements,
      ],
    )

  const productionCuttingContours =
    useMemo(
      () => {
        if (
          productionLayout === null
        ) {
          return null
        }

        try {
          return createReferenceTankV2ProductionCuttingContours(
            productionLayout,
          )
        } catch {
          return null
        }
      },
      [
        productionLayout,
      ],
    )

  useEffect(() => {
    if (
      workspaceView === 'pattern-pieces' &&
      (
        productionLayout === null ||
        productionCuttingContours === null
      )
    ) {
      setWorkspaceView('drafting')
    }
  }, [
    workspaceView,
    productionLayout,
    productionCuttingContours,
  ])

  const readOnlyCurveIds =
    patternProject.draftingRuleVersion ===
      PAWTTERN_MASTER_V2_RULE_VERSION &&
    patternProject.measurements !==
      null
      ? V2_MASTER_BLOCK_READ_ONLY_CURVE_IDS
      : EMPTY_READ_ONLY_CURVE_IDS

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
    const validation =
      validateReferenceTankV2DocumentEdit(
        patternProject,
        nextDocument,
      )

    if (
      !validation.isValid
    ) {
      setProjectMessage(
        validation.message ??
        'Pattern edit rejected.',
      )

      return
    }

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

  const handleGenerateBaseBlock = (
    measurements:
      BodyMeasurements,

    halfBodyAllowanceMm:
      number,

    shoulderLengthMm:
      number,

    neckOpeningAllowanceMm:
      number,

    bellyVariant:
      BellyVariant,

    document:
      PatternDocument,
  ) => {
    setProject(
      (currentProject) => {
        const currentPatternProject =
          currentProject
            .patternHistory
            .present

        const nextPatternProject =
          setPatternProjectGeneratedBlock(
            currentPatternProject,
            {
              measurements,

              bellyVariant,

              halfBodyAllowanceMm,

              shoulderLengthMm,

              neckOpeningAllowanceMm,

              draftingRuleVersion:
                PAWTTERN_MASTER_V2_RULE_VERSION,

              document,
            },
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

        <div className="headerActions">
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
          className={
            hasUnsavedChanges
              ? 'projectStatus projectStatusUnsaved'
              : 'projectStatus'
          }
          title={
            project.fileName
          }
        >
          {projectStatus}
          {' \u2014 '}
          {project.fileName}
        </span>

        {projectMessage && (
          <span
            className={
              projectMessage
                .toLowerCase()
                .includes(
                  'rejected',
                )
                ? 'projectMessage projectMessageError'
                : 'projectMessage'
            }
          >
            {projectMessage}
          </span>
        )}

        {!fileAccessSupported && (
          <span className="projectMessage projectMessageError">
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

      <div
        className={
          isPatternSidebarCollapsed
            ? 'workspaceShell sidebarCollapsed'
            : 'workspaceShell'
        }
      >
        <aside className="patternSidebar">
          {isPatternSidebarCollapsed ? (
            <button
              type="button"
              className="sidebarExpandButton"
              onClick={() =>
                setIsPatternSidebarCollapsed(
                  false,
                )
              }
              title="Show measurements"
              aria-label="Show measurements"
            >
              <span>
                {'\u25B6'}
              </span>

              <span className="sidebarVerticalLabel">
                Measurements
              </span>
            </button>
          ) : (
            <>
              <div className="patternSidebarHeader">
                <strong>
                  Measurements
                </strong>

                <button
                  type="button"
                  className="sidebarCollapseButton"
                  onClick={() =>
                    setIsPatternSidebarCollapsed(
                      true,
                    )
                  }
                  title="Hide measurements"
                  aria-label="Hide measurements"
                >
                  {'\u25C0'}
                </button>
              </div>

              <div className="patternSidebarContent">
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
                  bellyVariant={
                    patternProject.bellyVariant
                  }
                  onGenerate={
                    handleGenerateBaseBlock
                  }
                />
              </div>
            </>
          )}
        </aside>

        <main className="workspace">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              minHeight: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: 8,
                flex: '0 0 auto',
                borderBottom: '1px solid #d4d4d4',
                background: '#ffffff',
              }}
            >
              <strong>
                View:
              </strong>

              <button
                type="button"
                aria-pressed={
                  workspaceView === 'drafting'
                }
                onClick={() =>
                  setWorkspaceView(
                    'drafting',
                  )
                }
              >
                Drafting
              </button>

              <button
                type="button"
                aria-pressed={
                  workspaceView === 'pattern-pieces'
                }
                disabled={
                  productionCuttingContours === null
                }
                onClick={() =>
                  setWorkspaceView(
                    'pattern-pieces',
                  )
                }
                title={
                  productionCuttingContours === null
                    ? 'Generate a valid V2 production pattern first.'
                    : 'Show separated read-only pattern pieces.'
                }
              >
                Pattern Pieces
              </button>

              {workspaceView ===
                'pattern-pieces' && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: '0.85rem',
                    opacity: 0.7,
                  }}
                >
                  Read-only production view
                </span>
              )}
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 0,
                width: '100%',
              }}
            >
              {workspaceView === 'pattern-pieces' &&
              productionLayout !== null &&
              productionCuttingContours !== null ? (
                <PatternPiecesView
                  layout={productionLayout}
                  cuttingContours={
                    productionCuttingContours
                  }
                />
              ) : (
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
                            readOnlyCurveIds={
                              readOnlyCurveIds
                            }
                          />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
