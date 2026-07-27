#!/usr/bin/env node

const API_URL_BASE = 'https://www.sonicgarden.world/room_api/v1'

/**
 * GitHub Actions のワークフローコマンドで使えない文字をエスケープする。
 * https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions
 */
function escapeData(value) {
  return String(value)
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A')
}

/** core.setFailed 相当 */
function setFailed(message) {
  process.stdout.write(`::error::${escapeData(message)}\n`)
  process.exitCode = 1
}

/** core.getInput 相当（composite の env から読む） */
function getInput(name, {required = false} = {}) {
  const value = (process.env[name] ?? '').trim()
  if (required && !value) {
    throw new Error(`Input required and not supplied: ${name}`)
  }
  return value
}

function splitIds(ids) {
  return ids
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0)
}

async function post(url, label, body) {
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify(body)
    })
  } catch (error) {
    // ネットワークエラー等。error には URL (= token) が含まれうるので使わない
    throw new Error(`${label}: request failed (${error.name ?? 'Error'})`)
  }

  if (!res.ok) {
    throw new Error(`${label}: HTTP ${res.status} ${res.statusText}`)
  }
}

async function run() {
  try {
    const token = getInput('WORLD_TOKEN', {required: true})
    const participationIdInput = getInput('WORLD_PARTICIPATION_ID')
    const groupIdInput = getInput('WORLD_GROUP_ID')
    if (!participationIdInput && !groupIdInput) {
      throw new Error('participationId or groupId must be set')
    }

    const participationIds = splitIds(participationIdInput)
    const groupIds = splitIds(groupIdInput)
    const content = getInput('WORLD_CONTENT', {required: true})

    const query = `token=${encodeURIComponent(token)}`

    const tasks = [
      ...participationIds.map(participationId => {
        const id = encodeURIComponent(participationId)
        return post(
          `${API_URL_BASE}/rooms/participations/${id}/comments?${query}`,
          `participation ${participationId}`,
          {comment: {content}}
        )
      }),
      ...groupIds.map(groupId => {
        const id = encodeURIComponent(groupId)
        return post(
          `${API_URL_BASE}/groups/${id}/entries?${query}`,
          `group ${groupId}`,
          {entry: {content}}
        )
      })
    ]

    const results = await Promise.allSettled(tasks)
    const errors = results
      .filter(result => result.status === 'rejected')
      .map(result =>
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason)
      )

    if (errors.length > 0) {
      throw new Error(
        `${errors.length} of ${results.length} notifications failed: ${errors.join('; ')}`
      )
    }
  } catch (error) {
    setFailed(error instanceof Error ? error.message : String(error))
  }
}

run()
