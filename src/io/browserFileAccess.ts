export interface PawtternReadableFile {
  readonly name: string

  text(): Promise<string>
}

export interface PawtternWritableFileStream {
  write(
    data: string,
  ): Promise<void>

  close(): Promise<void>

  abort?(): Promise<void>
}

export type PawtternPermissionState =
  | 'granted'
  | 'denied'
  | 'prompt'

export interface PawtternPermissionDescriptor {
  mode: 'readwrite'
}

export interface PawtternFileHandle {
  readonly name: string

  getFile():
    Promise<PawtternReadableFile>

  createWritable():
    Promise<PawtternWritableFileStream>

  /*
   * Chrome exposes these on
   * FileSystemFileHandle.
   *
   * They are optional here because
   * browser support differs and our
   * test doubles do not always need
   * to implement them.
   */
  queryPermission?: (
    descriptor:
      PawtternPermissionDescriptor,
  ) => Promise<
    PawtternPermissionState
  >

  requestPermission?: (
    descriptor:
      PawtternPermissionDescriptor,
  ) => Promise<
    PawtternPermissionState
  >
}

export interface PatternPickerType {
  description: string

  accept: Record<
    string,
    string[]
  >
}

export interface PatternOpenPickerOptions {
  multiple: boolean

  excludeAcceptAllOption:
    boolean

  types: PatternPickerType[]
}

export interface PatternSavePickerOptions {
  suggestedName: string

  excludeAcceptAllOption:
    boolean

  types: PatternPickerType[]
}

export interface BrowserFilePickerHost {
  showOpenFilePicker?: (
    options:
      PatternOpenPickerOptions,
  ) => Promise<
    PawtternFileHandle[]
  >

  showSaveFilePicker?: (
    options:
      PatternSavePickerOptions,
  ) => Promise<
    PawtternFileHandle
  >
}

export interface OpenedPatternFile {
  handle:
    PawtternFileHandle

  fileName: string

  text: string
}

function getBrowserFilePickerHost():
BrowserFilePickerHost {
  if (
    typeof window ===
    'undefined'
  ) {
    return {}
  }

  /*
   * File System Access picker methods
   * are not present in every browser's
   * built-in Window TypeScript type.
   *
   * Keep that browser-specific surface
   * isolated in this module.
   */
  return window as unknown as
    BrowserFilePickerHost
}

function createPatternPickerTypes():
PatternPickerType[] {
  return [
    {
      description:
        'PAWTTERN CAD Pattern',

      accept: {
        'application/json': [
          '.json',
        ],
      },
    },
  ]
}

export function isFileSystemAccessSupported(
  host:
    BrowserFilePickerHost =
      getBrowserFilePickerHost(),
): boolean {
  return (
    typeof host
      .showOpenFilePicker ===
      'function' &&
    typeof host
      .showSaveFilePicker ===
      'function'
  )
}

export function isFilePickerAbortError(
  error: unknown,
): boolean {
  if (
    typeof error !==
      'object' ||
    error === null
  ) {
    return false
  }

  const maybeNamed =
    error as {
      name?: unknown
    }

  return (
    maybeNamed.name ===
    'AbortError'
  )
}

export async function pickPatternFileToOpen(
  host:
    BrowserFilePickerHost =
      getBrowserFilePickerHost(),
): Promise<
  OpenedPatternFile | null
> {
  const picker =
    host.showOpenFilePicker

  if (
    typeof picker !==
    'function'
  ) {
    throw new Error(
      'Direct file opening is not supported by this browser.',
    )
  }

  try {
    const handles =
      await picker.call(
        host,
        {
          multiple: false,

          excludeAcceptAllOption:
            true,

          types:
            createPatternPickerTypes(),
        },
      )

    const handle =
      handles[0]

    if (!handle) {
      return null
    }

    const file =
      await handle.getFile()

    const text =
      await file.text()

    return {
      handle,

      fileName:
        file.name,

      text,
    }
  } catch (error) {
    /*
     * Closing the picker with Cancel
     * is normal user behavior.
     */
    if (
      isFilePickerAbortError(
        error,
      )
    ) {
      return null
    }

    throw error
  }
}

export async function pickPatternFileToSave(
  suggestedName: string,

  host:
    BrowserFilePickerHost =
      getBrowserFilePickerHost(),
): Promise<
  PawtternFileHandle | null
> {
  const picker =
    host.showSaveFilePicker

  if (
    typeof picker !==
    'function'
  ) {
    throw new Error(
      'Direct file saving is not supported by this browser.',
    )
  }

  try {
    return await picker.call(
      host,
      {
        suggestedName,

        excludeAcceptAllOption:
          true,

        types:
          createPatternPickerTypes(),
      },
    )
  } catch (error) {
    if (
      isFilePickerAbortError(
        error,
      )
    ) {
      return null
    }

    throw error
  }
}

export async function ensurePatternWritePermission(
  handle:
    PawtternFileHandle,
): Promise<boolean> {
  const descriptor:
    PawtternPermissionDescriptor = {
      mode: 'readwrite',
    }

  /*
   * A handle obtained from Save As
   * will normally already have write
   * permission.
   *
   * A handle obtained from Open may
   * initially be read-only.
   */
  if (
    typeof handle
      .queryPermission ===
    'function'
  ) {
    const currentPermission =
      await handle.queryPermission(
        descriptor,
      )

    if (
      currentPermission ===
      'granted'
    ) {
      return true
    }

    if (
      currentPermission ===
      'denied'
    ) {
      return false
    }
  }

  /*
   * Requesting permission must happen
   * from a user action such as pressing
   * the Save button.
   */
  if (
    typeof handle
      .requestPermission ===
    'function'
  ) {
    const requestedPermission =
      await handle.requestPermission(
        descriptor,
      )

    return (
      requestedPermission ===
      'granted'
    )
  }

  /*
   * Some compatible environments may
   * not expose the permission helpers.
   * In that case createWritable() is
   * allowed to make the final decision.
   */
  return true
}

export async function writePatternTextToHandle(
  handle:
    PawtternFileHandle,

  text: string,
): Promise<void> {
  const permissionGranted =
    await ensurePatternWritePermission(
      handle,
    )

  if (!permissionGranted) {
    throw new Error(
      'Permission to update this pattern file was not granted.',
    )
  }

  const writable =
    await handle.createWritable()

  try {
    await writable.write(
      text,
    )

    /*
     * close() commits the write.
     */
    await writable.close()
  } catch (error) {
    /*
     * Abort the temporary write when
     * possible so a failed operation
     * does not partially replace the
     * project file.
     */
    if (
      typeof writable.abort ===
      'function'
    ) {
      try {
        await writable.abort()
      } catch {
        /*
         * Preserve the original error.
         */
      }
    }

    throw error
  }
}