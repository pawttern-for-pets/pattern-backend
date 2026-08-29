import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  getCadShortcut,
} from './shortcuts'

describe(
  'PAWTTERN CAD keyboard shortcuts',
  () => {
    it(
      'maps Ctrl+Z to undo',
      () => {
        expect(
          getCadShortcut({
            key: 'z',
            ctrlKey: true,
          }),
        ).toBe('undo')
      },
    )

    it(
      'maps Ctrl+Y to redo',
      () => {
        expect(
          getCadShortcut({
            key: 'y',
            ctrlKey: true,
          }),
        ).toBe('redo')
      },
    )

    it(
      'maps Ctrl+Shift+Z to redo',
      () => {
        expect(
          getCadShortcut({
            key: 'z',
            ctrlKey: true,
            shiftKey: true,
          }),
        ).toBe('redo')
      },
    )

    it(
      'supports Command shortcuts for future Mac compatibility',
      () => {
        expect(
          getCadShortcut({
            key: 'z',
            metaKey: true,
          }),
        ).toBe('undo')
      },
    )

    it(
      'maps Delete to delete',
      () => {
        expect(
          getCadShortcut({
            key: 'Delete',
          }),
        ).toBe('delete')
      },
    )

    it(
      'does not treat ordinary typing as a CAD command',
      () => {
        expect(
          getCadShortcut({
            key: 'a',
          }),
        ).toBeNull()
      },
    )

    it(
      'ignores shortcuts while typing in an editable control',
      () => {
        expect(
          getCadShortcut({
            key: 'Delete',
            isEditableTarget: true,
          }),
        ).toBeNull()

        expect(
          getCadShortcut({
            key: 'z',
            ctrlKey: true,
            isEditableTarget: true,
          }),
        ).toBeNull()
      },
    )

    it(
      'ignores Alt combinations',
      () => {
        expect(
          getCadShortcut({
            key: 'Delete',
            altKey: true,
          }),
        ).toBeNull()
      },
    )
  },
)