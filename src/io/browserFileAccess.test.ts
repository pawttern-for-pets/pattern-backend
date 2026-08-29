import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  ensurePatternWritePermission,
  isFilePickerAbortError,
  isFileSystemAccessSupported,
  pickPatternFileToOpen,
  pickPatternFileToSave,
  writePatternTextToHandle,
  type BrowserFilePickerHost,
  type PatternSavePickerOptions,
  type PawtternFileHandle,
} from './browserFileAccess'

function createTestHandle(
  name =
    'pattern.json',

  text =
    '{"schemaVersion":1}',
): PawtternFileHandle {
  return {
    name,

    getFile:
      async () => ({
        name,

        text:
          async () =>
            text,
      }),

    createWritable:
      async () => ({
        write:
          async () => {
            // Test stub.
          },

        close:
          async () => {
            // Test stub.
          },
      }),
  }
}

describe(
  'PAWTTERN browser file access',
  () => {
    it(
      'detects supported file picker APIs',
      () => {
        const handle =
          createTestHandle()

        const host:
          BrowserFilePickerHost = {
            showOpenFilePicker:
              async () => [
                handle,
              ],

            showSaveFilePicker:
              async () =>
                handle,
          }

        expect(
          isFileSystemAccessSupported(
            host,
          ),
        ).toBe(true)
      },
    )

    it(
      'requires both Open and Save picker APIs',
      () => {
        const host:
          BrowserFilePickerHost = {
            showOpenFilePicker:
              async () => [],
        }

        expect(
          isFileSystemAccessSupported(
            host,
          ),
        ).toBe(false)
      },
    )

    it(
      'opens a selected pattern and returns its handle and text',
      async () => {
        const handle =
          createTestHandle(
            'racerback.json',
            '{"hello":"pawttern"}',
          )

        const host:
          BrowserFilePickerHost = {
            showOpenFilePicker:
              async () => [
                handle,
              ],
        }

        const result =
          await pickPatternFileToOpen(
            host,
          )

        expect(
          result,
        ).not.toBeNull()

        expect(
          result?.handle,
        ).toBe(handle)

        expect(
          result?.fileName,
        ).toBe(
          'racerback.json',
        )

        expect(
          result?.text,
        ).toBe(
          '{"hello":"pawttern"}',
        )
      },
    )

    it(
      'treats cancelling Open as a normal null result',
      async () => {
        const abortError =
          Object.assign(
            new Error(
              'Cancelled',
            ),
            {
              name:
                'AbortError',
            },
          )

        const host:
          BrowserFilePickerHost = {
            showOpenFilePicker:
              async () => {
                throw abortError
              },
        }

        await expect(
          pickPatternFileToOpen(
            host,
          ),
        ).resolves.toBeNull()
      },
    )

    it(
      'recognizes picker cancellation errors',
      () => {
        expect(
          isFilePickerAbortError(
            {
              name:
                'AbortError',
            },
          ),
        ).toBe(true)

        expect(
          isFilePickerAbortError(
            new Error(
              'Disk problem',
            ),
          ),
        ).toBe(false)
      },
    )

    it(
      'opens Save As with the requested suggested filename',
      async () => {
        const handle =
          createTestHandle(
            'tank-top.json',
          )

        const receivedOptions:
          PatternSavePickerOptions[] =
            []

        const host:
          BrowserFilePickerHost = {
            showSaveFilePicker:
              async (
                options,
              ) => {
                receivedOptions.push(
                  options,
                )

                return handle
              },
          }

        const result =
          await pickPatternFileToSave(
            'tank-top.json',
            host,
          )

        expect(
          result,
        ).toBe(handle)

        expect(
          receivedOptions,
        ).toHaveLength(1)

        expect(
          receivedOptions[0]
            ?.suggestedName,
        ).toBe(
          'tank-top.json',
        )
      },
    )

    it(
      'treats cancelling Save As as a normal null result',
      async () => {
        const abortError =
          Object.assign(
            new Error(
              'Cancelled',
            ),
            {
              name:
                'AbortError',
            },
          )

        const host:
          BrowserFilePickerHost = {
            showSaveFilePicker:
              async () => {
                throw abortError
              },
        }

        await expect(
          pickPatternFileToSave(
            'pattern.json',
            host,
          ),
        ).resolves.toBeNull()
      },
    )

    it(
      'accepts an already granted write permission',
      async () => {
        let requestCount = 0

        const handle:
          PawtternFileHandle = {
            ...createTestHandle(),

            queryPermission:
              async () =>
                'granted',

            requestPermission:
              async () => {
                requestCount += 1

                return 'granted'
              },
          }

        await expect(
          ensurePatternWritePermission(
            handle,
          ),
        ).resolves.toBe(true)

        expect(
          requestCount,
        ).toBe(0)
      },
    )

    it(
      'requests write permission when an opened file is still prompting',
      async () => {
        let requestCount = 0

        const handle:
          PawtternFileHandle = {
            ...createTestHandle(),

            queryPermission:
              async () =>
                'prompt',

            requestPermission:
              async () => {
                requestCount += 1

                return 'granted'
              },
          }

        await expect(
          ensurePatternWritePermission(
            handle,
          ),
        ).resolves.toBe(true)

        expect(
          requestCount,
        ).toBe(1)
      },
    )

    it(
      'refuses writing when permission is denied',
      async () => {
        let createWritableCount =
          0

        const base =
          createTestHandle()

        const handle:
          PawtternFileHandle = {
            ...base,

            queryPermission:
              async () =>
                'denied',

            createWritable:
              async () => {
                createWritableCount +=
                  1

                return base
                  .createWritable()
              },
          }

        await expect(
          writePatternTextToHandle(
            handle,
            'PAWTTERN',
          ),
        ).rejects.toThrow(
          'Permission to update this pattern file was not granted.',
        )

        expect(
          createWritableCount,
        ).toBe(0)
      },
    )

    it(
      'writes to the chosen file and closes the writable stream',
      async () => {
        const calls:
          string[] = []

        const handle:
          PawtternFileHandle = {
            name:
              'pattern.json',

            getFile:
              async () => ({
                name:
                  'pattern.json',

                text:
                  async () =>
                    '',
              }),

            queryPermission:
              async () =>
                'granted',

            createWritable:
              async () => ({
                write:
                  async (
                    data,
                  ) => {
                    calls.push(
                      `write:${data}`,
                    )
                  },

                close:
                  async () => {
                    calls.push(
                      'close',
                    )
                  },
              }),
          }

        await writePatternTextToHandle(
          handle,
          'PAWTTERN',
        )

        expect(
          calls,
        ).toEqual([
          'write:PAWTTERN',
          'close',
        ])
      },
    )
  },
)