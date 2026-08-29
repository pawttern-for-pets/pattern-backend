export type CadShortcut =
  | 'undo'
  | 'redo'
  | 'delete'

export interface ShortcutInput {
  key: string

  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean

  isEditableTarget?: boolean
}

export function getCadShortcut(
  input: ShortcutInput,
): CadShortcut | null {
  if (input.isEditableTarget) {
    return null
  }

  if (input.altKey) {
    return null
  }

  const key =
    input.key.toLowerCase()

  const commandKey =
    Boolean(
      input.ctrlKey ||
        input.metaKey,
    )

  if (
    commandKey &&
    key === 'z' &&
    input.shiftKey
  ) {
    return 'redo'
  }

  if (
    commandKey &&
    key === 'z'
  ) {
    return 'undo'
  }

  if (
    commandKey &&
    key === 'y'
  ) {
    return 'redo'
  }

  if (
    !commandKey &&
    key === 'delete'
  ) {
    return 'delete'
  }

  return null
}